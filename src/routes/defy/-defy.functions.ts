import { getCurrentFormattedDate } from "#/lib/utils";
import type { DictionaryResponse, TWordOfDay } from "#/types/defy";
import { createServerFn, createServerOnlyFn } from "@tanstack/react-start";
import { generate } from "random-words";
import z from "zod";

// Super advanced cache
const cache: Record<string, TWordOfDay> = {};

const getWordOfDay = createServerOnlyFn(async (): Promise<TWordOfDay> => {
	const dateSeed = getCurrentFormattedDate();

	// Check cache first
	if (cache[dateSeed]) {
		console.log(`Using cached result for ${dateSeed}`);
		return cache[dateSeed];
	}

	console.log(`Generating word of the day for ${dateSeed}...`);
	const word = generate({ minLength: 4, seed: dateSeed, exactly: 1 })[0];
	console.log(word);
	// TODO: Add in retry if word doesn't exist
	const res = await fetch(
		`https://freedictionaryapi.com/api/v1/entries/en/${word}`,
	);
	const res_json: DictionaryResponse = await res.json();

	const wordOfDay: TWordOfDay = {
		word: res_json.word,
		wiktionaryUrl: res_json.source.url,
		senses: res_json.entries.map((entry) => ({
			partOfSpeech: entry.partOfSpeech,
			definitions: entry.senses.map((sense) => sense.definition),
			synonyms: entry.synonyms,
		})),
	};

	// Store in cache
	cache[dateSeed] = wordOfDay;

	return wordOfDay;
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

		const defOutlineWithHints: TWordOfDay = {
			word: undefined,
			wiktionaryUrl: undefined,
			senses: wordOfDay.senses.map((sense) => ({
				partOfSpeech: sense.partOfSpeech,
				definitions: sense.definitions.map((def, index) =>
					index < numHintsToShow ? def : undefined,
				),
				synonyms: sense.synonyms
					.filter((syn) => syn !== wordOfDay.word)
					.map((syn, index) => (index < numHintsToShow ? syn : undefined)),
			})),
		};

		return defOutlineWithHints;
	});
