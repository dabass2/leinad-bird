/** biome-ignore-all assist/source/organizeImports: <auto-sorter is messing up, so just ignore> */
import {
	getAndPrepareDailyWord,
	incrementUsage,
	updateApiStatus,
} from "#/db/queries";
import { getCentralDayOfWeek, getCurrentFormattedDate } from "#/lib/utils";
import type { DictionaryResponse, TWordOfDay } from "#/types/defy";
import { createServerFn, createServerOnlyFn } from "@tanstack/react-start";
import z from "zod";

// Super advanced cache
const cache: Record<string, TWordOfDay> = {};

const difficultyMapping: Record<number, readonly number[]> = {
	0: [800_000, 900_000] as const, // Sunday - Hardest
	1: [8_000_000, 9_000_000] as const, // Monday - Easiest
	2: [7_000_000, 8_500_000] as const, // Tuesday - Easy
	3: [5_000_000, 7_500_000] as const, // Wednesday - Medium
	4: [3_000_000, 5_000_000] as const, // Thursday - Medium-Hard
	5: [1_000_000, 3_000_000] as const, // Friday - Hard
	6: [850_000, 1_000_000] as const, // Saturday - Very Hard
};

const MAX_RETRIES = 10;

const getWordOfDay = createServerOnlyFn(async (): Promise<TWordOfDay> => {
	const dateSeed = getCurrentFormattedDate();

	if (cache[dateSeed]) {
		return cache[dateSeed];
	}

	const dayOfWeek = getCentralDayOfWeek();
	const freqRange = difficultyMapping[dayOfWeek];

	let attempts = 0;

	while (attempts <= MAX_RETRIES) {
		let word = "";
		let wordFromDb = null;
		if (attempts === MAX_RETRIES) {
			word = "with";
		} else {
			attempts++;
			wordFromDb = await getAndPrepareDailyWord(freqRange[0], freqRange[1]);

			word = wordFromDb.word.toLowerCase().trim();

			console.log(
				`Attempt ${attempts}: Selected word "${word}" from DB (rank ${wordFromDb.rank})`,
			);
		}

		if (!wordFromDb) break;

		try {
			const res = await fetch(
				`https://freedictionaryapi.com/api/v1/entries/en/${word}`,
			);

			if (!res.ok) {
				// If it's a 500 or 429, don't blame the word, just retry the loop
				console.error(`API temporary error: ${res.status}`);
				continue;
			}

			const res_json: DictionaryResponse = await res.json();

			// THE CRITICAL CHECK: If body is null or entries is an empty array
			if (!res_json || !res_json.entries || res_json.entries.length < 1) {
				console.warn(`Word "${word}" has no entries. Marking as invalid.`);
				await updateApiStatus(wordFromDb.rank, false);
				continue; // Try again with a new word from the DB
			}

			// If we got here, the word is good. Time to commit!
			await incrementUsage(wordFromDb.rank);

			const sortByWordPresent = (a: string, b: string) => {
				const hasWordA = a.toLowerCase().includes(word.toLowerCase());
				const hasWordB = b.toLowerCase().includes(word.toLowerCase());
				return Number(hasWordA) - Number(hasWordB);
			};

			const blacklistedTags = ["form of", "plural"];

			const wordOfDay: TWordOfDay = {
				word: res_json.word,
				wiktionaryUrl: res_json.source.url,
				senses: res_json.entries.map((entry) => ({
					partOfSpeech: entry.partOfSpeech,
					definitions: (entry.senses || [])
						.filter(
							(sense) =>
								!blacklistedTags.some((tag) => sense.tags.includes(tag)),
						)
						.map((sense) => sense.definition)
						.toSorted(sortByWordPresent),
					synonyms: (entry.synonyms || []).toSorted(sortByWordPresent),
				})),
			};

			const totalDefinitions = wordOfDay.senses.reduce(
				(sum, sense) => sum + sense.definitions.length,
				0,
			);
			if (totalDefinitions === 0) {
				console.warn(
					`Word "${word}" has no valid definitions after filtering. Marking as invalid.`,
				);
				await updateApiStatus(wordFromDb.rank, false);
				continue; // Try again with a new word from the DB
			}

			if (totalDefinitions < 3 && ![0, 6].includes(dayOfWeek)) {
				console.warn(
					`Word "${word}" has only ${totalDefinitions} definitions, which is too few for today. Retrying.`,
				);
				continue; // Try again with a new word from the DB
			}

			// Success! Cache and return.
			cache[dateSeed] = wordOfDay;
			return wordOfDay;
		} catch (err) {
			console.error(`Attempt ${attempts} network/parse error:`, err);
		}
	}

	throw new Error(
		`Exhausted ${MAX_RETRIES} attempts without finding a valid word.`,
	);
});

// Function used to actually make a guess, really just takes in
// the guess and returns if they were wrong or right
export const guessWord = createServerFn({
	method: "POST",
})
	.inputValidator(
		z.object({
			guess: z
				.string()
				.nonempty()
				.regex(/^[a-zA-Z]+$/)
				.refine((s) => !s.includes(" ")),
		}),
	)
	.handler(async ({ data }) => {
		console.log(`Received guess: ${data.guess}`);

		const wordOfDay = await getWordOfDay();

		// Really shouldn't be possible
		if (!wordOfDay.word) return;

		return wordOfDay.word === data.guess.toLowerCase().trim();
	});

// Function used to just get the word based on how many guesses
// and hints have been used. Easily callable from the client to get
// the answer, but a person would have to be so incredibly smelly
// to even do that
export const getWord = createServerFn({
	method: "POST",
})
	.inputValidator(
		z.object({
			numGuesses: z.number().min(0),
			hintsUsed: z.number().optional(),
			gameOver: z.boolean().optional(),
		}),
	)
	.handler(async ({ data }) => {
		console.log(
			`Getting word with guesses ${data.numGuesses} and hints ${data.hintsUsed}`,
		);
		const wordOfDay = await getWordOfDay();
		if (data.gameOver) {
			console.log(`Game over, returning full word def`);
			return wordOfDay;
		}

		// General rules for hints
		// If no guesses, show the first of each definition and synonym
		// After that, one more hint and synonym per guess
		// When only one guess left, reveal everything (look into? maybe make a hint button instead?)
		// After that the game is over so the word is returned above
		let numHintsToShow = 0;
		const numGuesses = data.numGuesses;
		if (numGuesses === 0) {
			// initial page load, show 1
			numHintsToShow = 1;
		} else {
			// otherwise, show # of guesses + 1 + any hints that have been used
			// TODO: Look into this, if hintsUsed is 1 (first hint used) don't add any
			// otherwise it shows 2 hints. After that just show hintsUsed per normal
			numHintsToShow = numGuesses + 1 + (data.hintsUsed || 0);
		}
		console.log(
			`Number of guess ${numGuesses}. Showing number of hints ${numHintsToShow}`,
		);

		// Once every definition/synonym has already been revealed, further hints
		// have nothing left to unlock. Past that point, fall back to revealing
		// letters of the answer instead — but only in response to an actual
		// hint-button click, never just from racking up guesses. Guesses alone
		// can already push numHintsToShow past maxRevealable (e.g. a
		// low-definition word by guess 4), so letters are driven purely by the
		// portion of hintsUsed left over after defs/synonyms are exhausted.
		const maxRevealable = wordOfDay.senses.reduce(
			(max, sense) =>
				Math.max(max, sense.definitions.length, sense.synonyms.length),
			0,
		);
		const answer = wordOfDay.word ?? "";
		const hintsAbsorbedByDefs = Math.max(0, maxRevealable - (numGuesses + 1));
		const excessHints = Math.max(
			0,
			(data.hintsUsed || 0) - hintsAbsorbedByDefs,
		);
		const lettersToReveal = Math.min(
			excessHints,
			Math.max(answer.length - 1, 0),
		);
		const letterHints =
			lettersToReveal > 0
				? answer
						.split("")
						.map((letter, index) =>
							index < lettersToReveal ? letter : undefined,
						)
				: undefined;

		const defOutlineWithHints: TWordOfDay = {
			word: undefined,
			wiktionaryUrl: undefined,
			senses: wordOfDay.senses.map((sense) => ({
				partOfSpeech: sense.partOfSpeech,
				definitions: sense.definitions.map((def, index) =>
					index < numHintsToShow ? def : undefined,
				),
				synonyms: sense.synonyms
					.filter((syn) => !syn?.includes(wordOfDay.word ?? ""))
					.map((syn, index) => (index < numHintsToShow ? syn : undefined)),
			})),
			letterHints,
		};

		return defOutlineWithHints;
	});
