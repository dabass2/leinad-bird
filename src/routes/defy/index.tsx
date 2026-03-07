/** biome-ignore-all lint/correctness/noChildrenProp: <tanstack form wants it like that> */

import { WordDef } from "#/components/defy/WordDef";
import { WordGuesses } from "#/components/defy/WordGuesses";
import { Button } from "#/components/ui/button";
import { Field } from "#/components/ui/field";
import { Input } from "#/components/ui/input";
import { GuessStore } from "#/lib/guess-store";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { generate } from "random-words";
import { z } from "zod";

interface Pronunciation {
	type: string;
	text: string;
	tags: string[];
}

interface Form {
	word: string;
	tags: string[];
}

interface Quote {
	text: string;
	reference: string;
}

interface Sense {
	definition: string;
	tags: string[];
	examples: string[];
	quotes: Quote[];
	synonyms: string[];
	antonyms: string[];
	subsenses: Sense[];
}

interface Language {
	code: string;
	name: string;
}

interface Entry {
	language: Language;
	partOfSpeech: string;
	pronunciations: Pronunciation[];
	forms: Form[];
	senses: Sense[];
	synonyms: string[];
	antonyms: string[];
}

interface License {
	name: string;
	url: string;
}

interface Source {
	url: string;
	license: License;
}

interface DictionaryResponse {
	word: string;
	entries: Entry[];
	source: Source;
}

export type TWordOfDay = {
	word: string;
	definitions: string[];
	synonyms: string[];
	pronunciations?: string[];
	partsOfSpeech: string[];
	wiktionaryUrl?: string;
};

// Super advanced cache
const cache: Record<string, TWordOfDay> = {};

// format a Date instance in UTC as "Month D<suffix> YYYY" e.g. "March 3rd 2026"
function formatUtcDate(d: Date) {
	const utcYear = d.getUTCFullYear();
	const utcMonth = d.toLocaleString("en-US", {
		month: "long",
		timeZone: "UTC",
	});
	const utcDay = d.getUTCDate();
	const getSuffix = (n: number) => {
		if (n % 100 >= 11 && n % 100 <= 13) return "th";
		switch (n % 10) {
			case 1:
				return "st";
			case 2:
				return "nd";
			case 3:
				return "rd";
			default:
				return "th";
		}
	};
	return `${utcMonth} ${utcDay}${getSuffix(utcDay)} ${utcYear}`;
}

const getWordOfDay = createServerFn().handler(async (): Promise<TWordOfDay> => {
	const dateSeed = new Date().toISOString().split("T")[0];

	// Check cache first
	if (cache[dateSeed]) {
		console.log(`Using cached result for ${dateSeed}`);
		return cache[dateSeed];
	}

	console.log(`Generating word of the day for ${dateSeed}...`);
	const word = generate({ minLength: 4, seed: dateSeed, exactly: 1 })[0];
	console.log(word);
	// const res = await fetch(
	// 	`https://freedictionaryapi.com/api/v1/entries/en/${word}`,
	// );
	// const res_json: DictionaryResponse = await res.json();
	const res_json: DictionaryResponse = {
		word: "with",
		entries: [
			{
				language: {
					code: "en",
					name: "English",
				},
				partOfSpeech: "preposition",
				pronunciations: [
					{
						type: "ipa",
						text: "/wɪð/",
						tags: [],
					},
					{
						type: "ipa",
						text: "/wɪθ/",
						tags: [],
					},
					{
						type: "ipa",
						text: "/wɪð/",
						tags: [],
					},
					{
						type: "ipa",
						text: "/wɪi/",
						tags: [],
					},
					{
						type: "ipa",
						text: "/wɪv/",
						tags: [],
					},
					{
						type: "ipa",
						text: "/wɪθ/",
						tags: ["General American"],
					},
					{
						type: "ipa",
						text: "/wɪð/",
						tags: ["General American"],
					},
					{
						type: "ipa",
						text: "/wɪt/",
						tags: [],
					},
					{
						type: "ipa",
						text: "/wɪf/",
						tags: [],
					},
					{
						type: "ipa",
						text: "/wɪ/",
						tags: [],
					},
					{
						type: "ipa",
						text: "[wʰɪθ]",
						tags: ["Northwestern", "US"],
					},
					{
						type: "ipa",
						text: "/wɪθ/",
						tags: ["Canada", "Standard"],
					},
					{
						type: "ipa",
						text: "/wɪð/",
						tags: ["Canada", "Standard"],
					},
					{
						type: "ipa",
						text: "[wɪt~wɪ(ʔ)]",
						tags: [],
					},
					{
						type: "ipa",
						text: "[wɪd]",
						tags: [],
					},
					{
						type: "ipa",
						text: "[wɪθ̠~wɪɾ]",
						tags: [],
					},
					{
						type: "ipa",
						text: "/ʋid̪(h)/",
						tags: [],
					},
					{
						type: "ipa",
						text: "/ʋit̪(ʰ)/",
						tags: [],
					},
					{
						type: "ipa",
						text: "/ʋid̪(h)/",
						tags: [],
					},
					{
						type: "ipa",
						text: "/wɪθ/",
						tags: ["General Australian"],
					},
					{
						type: "ipa",
						text: "/wɪð/",
						tags: ["General Australian"],
					},
					{
						type: "ipa",
						text: "/wəθ/",
						tags: ["New Zealand"],
					},
					{
						type: "ipa",
						text: "/wəð/",
						tags: ["New Zealand"],
					},
				],
				forms: [
					{
						word: "wyth",
						tags: ["alternative"],
					},
					{
						word: "whith",
						tags: ["alternative"],
					},
					{
						word: "wᵗʰ",
						tags: ["alternative"],
					},
					{
						word: "wᵗ",
						tags: ["alternative"],
					},
					{
						word: "w/",
						tags: ["alternative"],
					},
					{
						word: "w",
						tags: ["alternative"],
					},
					{
						word: "whit",
						tags: ["alternative"],
					},
					{
						word: "wi'",
						tags: ["alternative"],
					},
					{
						word: "wit",
						tags: ["alternative"],
					},
					{
						word: "wit'",
						tags: ["alternative"],
					},
					{
						word: "wid",
						tags: ["alternative"],
					},
					{
						word: "wif",
						tags: ["alternative"],
					},
					{
						word: "wiv",
						tags: ["alternative"],
					},
				],
				senses: [
					{
						definition: "Against.",
						tags: [],
						examples: ["He picked a fight with the class bully."],
						quotes: [
							{
								text: "Many hatchets, knives, & pieces of iron, & brass, we see, which they reported to have from the Sasquesahanocks a mighty people, and mortal enemies with the Massawomecks.",
								reference:
									"1621, John Smith, The Proceedings of the English Colony in Virginia:",
							},
						],
						synonyms: [],
						antonyms: [],
						subsenses: [],
					},
					{
						definition: "In the company of; alongside, close to; near to.",
						tags: [],
						examples: ["He went with his friends."],
						quotes: [
							{
								text: "No matter how early I came down, I would find him on the veranda, smoking cigarettes, or[…]. And at last I began to realize in my harassed soul that all elusion was futile, and to take such holidays as I could get, when he was off with a girl, in a spirit of thankfulness.",
								reference:
									"1897 December (indicated as 1898), Winston Churchill, chapter IV, in The Celebrity: An Episode, New York, N.Y.: The Macmillan Company; London: Macmillan & Co., Ltd., →OCLC, page 46:",
							},
						],
						synonyms: [],
						antonyms: [],
						subsenses: [],
					},
					{
						definition: "In addition to; as an accessory to.",
						tags: [],
						examples: ["She owns a motorcycle with a sidecar."],
						quotes: [],
						synonyms: [],
						antonyms: [],
						subsenses: [],
					},
					{
						definition:
							"Used to add supplemental information, especially to indicate simultaneous happening, or immediate succession or consequence.",
						tags: [],
						examples: [
							"Jim was listening to Bach with his eyes closed.",
							"Both armies entered into battle with confidence high.",
							"The match result was 10-5, with John scoring three goals.",
							"With a heavy sigh, she looked around the empty room.",
							"Four people were injured, with one of them in critical condition.",
							"With their reputation on the line, they decided to fire their PR team.",
						],
						quotes: [
							{
								text: "With that she told me that though she spake of her father, whom she named Chremes, she would hide no truth from me: […]",
								reference:
									"1590, Sir Philip Sidney, The Countess of Pembroke's Arcadia:",
							},
							{
								text: "His hand and all his habit smear'd with blood.",
								reference:
									"1697, Virgil, “Aeneid”, in John Dryden, transl., The Works of Virgil:",
							},
							{
								text: "With her they flourish'd, and with her they die.",
								reference:
									"1861, Alexander Pope, “The Fourth Pastoral, or Daphne”, in The Rev. George Gilfillan, editor, The Poetical Works of Alexander Pope:",
							},
							{
								text: "With a bolt of fright he remembered that there was no bathroom in the Hobhouse Room. He leapt along the corridor in a panic, stopping by the long-case clock at the end where he flattened himself against the wall.",
								reference: "1994, Stephen Fry, chapter 2, in The Hippopotamus:",
							},
							{
								text: ",[…]and so on. But the real way to build a successful online business is to be better than your rivals at undermining people's control of their own attention.",
								reference:
									"2013 June 21, Oliver Burkeman, “The tao of tech”, in The Guardian Weekly, volume 189, number 2, page 48:",
							},
						],
						synonyms: [],
						antonyms: [],
						subsenses: [],
					},
					{
						definition: "In support of.",
						tags: [],
						examples: ["We are with you all the way."],
						quotes: [],
						synonyms: [],
						antonyms: [],
						subsenses: [],
					},
					{
						definition: "In regard to.",
						tags: [],
						examples: [
							"There are a number of problems with your plan.",
							"What on Earth is wrong with my keyboard?",
							"He was pleased with the outcome.",
							"I’m upset with my father.",
						],
						quotes: [
							{
								text: "Mostly, the microbiome is beneficial. It helps with digestion and enables people to extract a lot more calories from their food than would otherwise be possible. Research over the past few years, however, has implicated it in diseases from atherosclerosis to asthma to autism.",
								reference:
									"2013 June 29, “A punch in the gut”, in The Economist, volume 407, number 8842, pages 72–3:",
							},
						],
						synonyms: [],
						antonyms: [],
						subsenses: [],
					},
					{
						definition:
							"(obsolete) To denote the accomplishment of cause, means, instrument, etc; – sometimes equivalent to by.",
						tags: ["obsolete"],
						examples: ["slain with robbers"],
						quotes: [
							{
								text: "He was torn to / pieces with a bear:",
								reference:
									"c. 1610–1611 (date written), William Shakespeare, “The Winters Tale”, in Mr. William Shakespeares Comedies, Histories, & Tragedies […] (First Folio), London: […] Isaac Iaggard, and Ed[ward] Blount, published 1623, →OCLC, [Act V, scene ii]:",
							},
							{
								text: "He was sick and lame of the scurvy, so as he could but lie in the cabin-door, and give direction, and, it should seem, was badly assisted either with mate or mariners",
								reference: "1669, Nathaniel Morton, New England’s Memorial:",
							},
							{
								text: "But several sowing of Wheat at that time, because 'twas the usual time of doing of it, it lay in the Ground till Rain came, which was the latter end of October first, and then but part of it came up neither, because it was mustied and spoiled with lying so long in the Ground […]",
								reference:
									"1721, John Mortimer, The Whole Art of Husbandry, page 61:",
							},
						],
						synonyms: [],
						antonyms: [],
						subsenses: [],
					},
					{
						definition: "Using as an instrument; by means of.",
						tags: [],
						examples: [
							"cut with a knife",
							"I water my plants with this watering can. This is the watering can I water my plants with.",
							"Find what you want instantly with our search engine.",
							"They dismissed the meeting with a wave of their hand.",
							"Speak with a confident voice.",
							"With what/whose money? I have nothing left to buy groceries (with).",
						],
						quotes: [
							{
								text: "you have paid me equal, Heavens, / And sent my own rod to correct me with",
								reference:
									"1647–1679, Francis Beaumont, John Fletcher, “A King and no King”, in Comedies and Tragedies […], London: […] Humphrey Robinson, […], and for Humphrey Moseley […], published 1647, →OCLC, Act IV, (please specify the scene number in lowercase Roman numerals):",
							},
							{
								text: "They had cut of his head upon the cudy of his boat had not the man reskued him with a sword,",
								reference: "1620, William Bradford., Of Plymouth Plantation:",
							},
							{
								text: "And keep each other company in spite, / As rivals in your common mistress, fame, / And with faint praises one another damn;",
								reference:
									"1677, William Wycherley, The plain-dealer, Prologue:",
							},
							{
								text: "As we age, the major arteries of our bodies frequently become thickened with plaque, a fatty material with an oatmeal-like consistency that builds up along the inner lining of blood vessels.",
								reference:
									"2013 July-August, Stephen P. Lownie, David M. Pelz, “Stents to Prevent Stroke”, in American Scientist:",
							},
						],
						synonyms: [],
						antonyms: [],
						subsenses: [],
					},
					{
						definition:
							"(obsolete) Using as nourishment; more recently replaced by on.",
						tags: ["obsolete"],
						examples: [],
						quotes: [
							{
								text: "I am fain to dine and sup with water and bran.",
								reference:
									"c. 1603–1604 (date written), William Shakespeare, “Measure for Measure”, in Mr. William Shakespeares Comedies, Histories, & Tragedies […] (First Folio), London: […] Isaac Iaggard, and Ed[ward] Blount, published 1623, →OCLC, [Act IV, scene iii]:",
							},
						],
						synonyms: [],
						antonyms: [],
						subsenses: [],
					},
					{
						definition: "Having, owning.",
						tags: [],
						examples: [
							"It was small and bumpy, with a tinge of orange.",
							"There are lots of people with no homes after the wildfire.",
						],
						quotes: [
							{
								text: "As we age, the major arteries of our bodies frequently become thickened with plaque, a fatty material with an oatmeal-like consistency that builds up along the inner lining of blood vessels.",
								reference:
									"2013 July-August, Stephen P. Lownie, David M. Pelz, “Stents to Prevent Stroke”, in American Scientist:",
							},
						],
						synonyms: [],
						antonyms: [],
						subsenses: [],
					},
					{
						definition: "Affected by (a certain emotion or condition).",
						tags: [],
						examples: [
							"Speak with confidence.",
							"He spoke with sadness in his voice.",
							"The sailors were infected with malaria.",
						],
						quotes: [],
						synonyms: [],
						antonyms: [],
						subsenses: [],
					},
					{
						definition: "Prompted by (a certain emotion).",
						tags: [],
						examples: [
							"overcome with happiness",
							"green with envy; flushed with success",
						],
						quotes: [],
						synonyms: [],
						antonyms: [],
						subsenses: [],
					},
					{
						definition: "In the employment of.",
						tags: [],
						examples: [
							"She was with Acme for twenty years before retiring last fall.",
						],
						quotes: [],
						synonyms: [],
						antonyms: [],
						subsenses: [],
					},
					{
						definition: "Considering; taking into account.",
						tags: [],
						examples: [
							"With your kind of body size, you shouldn’t be eating pizza at all.",
						],
						quotes: [],
						synonyms: ["given"],
						antonyms: [],
						subsenses: [],
					},
					{
						definition: "Keeping up with; understanding; following along.",
						tags: [],
						examples: ["That was a lot to explain; are you still with me?"],
						quotes: [
							{
								text: "Are you still with me? Good. I was worried, because you may not think you need a lightweight rifle.",
								reference:
									"1983 May 30, David E. Petzal, “The Lightweight Division”, in Field & Stream:",
							},
						],
						synonyms: [],
						antonyms: [],
						subsenses: [],
					},
				],
				synonyms: [
					"w/",
					"c̄",
					"alongside",
					"having",
					"holding",
					"including",
					"with",
				],
				antonyms: ["without", "against"],
			},
			{
				language: {
					code: "en",
					name: "English",
				},
				partOfSpeech: "adverb",
				pronunciations: [
					{
						type: "ipa",
						text: "/wɪð/",
						tags: [],
					},
					{
						type: "ipa",
						text: "/wɪθ/",
						tags: [],
					},
					{
						type: "ipa",
						text: "/wɪð/",
						tags: [],
					},
					{
						type: "ipa",
						text: "/wɪi/",
						tags: [],
					},
					{
						type: "ipa",
						text: "/wɪv/",
						tags: [],
					},
					{
						type: "ipa",
						text: "/wɪθ/",
						tags: ["General American"],
					},
					{
						type: "ipa",
						text: "/wɪð/",
						tags: ["General American"],
					},
					{
						type: "ipa",
						text: "/wɪt/",
						tags: [],
					},
					{
						type: "ipa",
						text: "/wɪf/",
						tags: [],
					},
					{
						type: "ipa",
						text: "/wɪ/",
						tags: [],
					},
					{
						type: "ipa",
						text: "[wʰɪθ]",
						tags: ["Northwestern", "US"],
					},
					{
						type: "ipa",
						text: "/wɪθ/",
						tags: ["Canada", "Standard"],
					},
					{
						type: "ipa",
						text: "/wɪð/",
						tags: ["Canada", "Standard"],
					},
					{
						type: "ipa",
						text: "[wɪt~wɪ(ʔ)]",
						tags: [],
					},
					{
						type: "ipa",
						text: "[wɪd]",
						tags: [],
					},
					{
						type: "ipa",
						text: "[wɪθ̠~wɪɾ]",
						tags: [],
					},
					{
						type: "ipa",
						text: "/ʋid̪(h)/",
						tags: [],
					},
					{
						type: "ipa",
						text: "/ʋit̪(ʰ)/",
						tags: [],
					},
					{
						type: "ipa",
						text: "/ʋid̪(h)/",
						tags: [],
					},
					{
						type: "ipa",
						text: "/wɪθ/",
						tags: ["General Australian"],
					},
					{
						type: "ipa",
						text: "/wɪð/",
						tags: ["General Australian"],
					},
					{
						type: "ipa",
						text: "/wəθ/",
						tags: ["New Zealand"],
					},
					{
						type: "ipa",
						text: "/wəð/",
						tags: ["New Zealand"],
					},
				],
				forms: [
					{
						word: "wyth",
						tags: ["alternative"],
					},
					{
						word: "whith",
						tags: ["alternative"],
					},
					{
						word: "wᵗʰ",
						tags: ["alternative"],
					},
					{
						word: "wᵗ",
						tags: ["alternative"],
					},
					{
						word: "w/",
						tags: ["alternative"],
					},
					{
						word: "w",
						tags: ["alternative"],
					},
					{
						word: "whit",
						tags: ["alternative"],
					},
					{
						word: "wi'",
						tags: ["alternative"],
					},
					{
						word: "wit",
						tags: ["alternative"],
					},
					{
						word: "wit'",
						tags: ["alternative"],
					},
					{
						word: "wid",
						tags: ["alternative"],
					},
					{
						word: "wif",
						tags: ["alternative"],
					},
					{
						word: "wiv",
						tags: ["alternative"],
					},
				],
				senses: [
					{
						definition:
							"(regional US, chiefly Midwest and West, informal) Along, together with others, in a group, etc.",
						tags: ["US", "informal", "not comparable", "regional"],
						examples: ["Do you want to come with?"],
						quotes: [],
						synonyms: [],
						antonyms: [],
						subsenses: [],
					},
				],
				synonyms: [],
				antonyms: [],
			},
			{
				language: {
					code: "en",
					name: "English",
				},
				partOfSpeech: "noun",
				pronunciations: [],
				forms: [
					{
						word: "withs",
						tags: ["plural"],
					},
				],
				senses: [
					{
						definition: "Alternative form of withe.",
						tags: ["alt of", "alternative"],
						examples: [],
						quotes: [
							{
								text: "And Samson said unto her, If they bind me with seven green withs that were never dried, then shall I be weak, and be as another man.",
								reference:
									"1611, The Holy Bible, […] (King James Version), London: […] Robert Barker, […], →OCLC, Judges 16:7:",
							},
						],
						synonyms: [
							"testest",
							"withe",
							"thetest",
							"hunter",
							"testing",
							"animal",
							"the",
							"cross",
							"test word",
							"testest32",
							"withe3112",
							"thetest231",
							"hunter331",
							"testing2121",
							"animal222",
							"th3131",
							"cross111",
							"test wor1313d",
						],
						antonyms: [],
						subsenses: [],
					},
				],
				synonyms: [
					"testest",
					"withe",
					"thetest",
					"hunter",
					"testing",
					"animal",
					"the",
					"cross",
					"test word",
				],
				antonyms: [],
			},
		],
		source: {
			url: "https://en.wiktionary.org/wiki/with",
			license: {
				name: "CC BY-SA 4.0",
				url: "https://creativecommons.org/licenses/by-sa/4.0/",
			},
		},
	};

	const wordOfDay: TWordOfDay = {
		word: res_json.word,
		definitions: res_json.entries.flatMap((entry) =>
			entry.senses.map((sense) => sense.definition),
		),
		synonyms: res_json.entries
			.flatMap((entry) => entry.senses.flatMap((sense) => sense.synonyms))
			.filter((syn, index, self) => syn && self.indexOf(syn) === index),
		pronunciations: res_json.entries.flatMap((entry) =>
			entry.pronunciations.map((p) => p.text),
		),
		partsOfSpeech: res_json.entries.flatMap((entry) =>
			entry.partOfSpeech ? [entry.partOfSpeech] : [],
		),
		wiktionaryUrl: res_json.source.url,
	};

	// Store in cache
	cache[dateSeed] = wordOfDay;

	return wordOfDay;
});

const guessWord = createServerFn({
	method: "POST",
})
	.inputValidator(
		z.object({ guess: z.string().min(1), numGuesses: z.number().min(0) }),
	)
	.handler(async ({ data }) => {
		console.log(
			`Received guess: ${data.guess} with ${data.numGuesses} previous guesses`,
		);
		const wordOfDay = await getWordOfDay();

		// This shouldn't happen, but if it does, they've failed so just end game
		if (data.numGuesses >= 5) {
			console.log(
				`BUG DETECTED. Limit exceeded. The word was ${wordOfDay.word}`,
			);
			return { correct: false, wordDef: wordOfDay, failure: true };
		}

		// if (data.guess.trim().length === 0) {
		// 	console.log(
		// 		"Initial load, no guesses yet. Returning definition outline.",
		// 	);
		// 	const defOutlineOnly: TWordOfDay = {
		// 		word: "?????",
		// 		definitions: Array.from(
		// 			{ length: wordOfDay.definitions.length },
		// 			() => "???",
		// 		),
		// 		synonyms: Array.from(
		// 			{ length: wordOfDay.synonyms.length },
		// 			() => "???",
		// 		),
		// 		pronunciations: undefined,
		// 		partsOfSpeech: Array.from(
		// 			{ length: wordOfDay.partsOfSpeech.length },
		// 			() => "???",
		// 		),
		// 		// Don't reveal pronunciations until after the first guess
		// 		wiktionaryUrl: undefined,
		// 	};
		// 	return { correct: false, wordDef: defOutlineOnly, failure: false };
		// }

		const isCorrect =
			data?.guess?.toLowerCase() === wordOfDay.word.toLowerCase();
		if (isCorrect) {
			console.log(`Correct guess! The word was indeed ${wordOfDay.word}`);
			return { correct: true, wordDef: wordOfDay, failure: false };
		}

		// If the guess is wrong and it's the 5th guess, reveal the word and definition
		if (data.numGuesses >= 4) {
			console.log(
				`Final guess was incorrect. The word was ${wordOfDay.word}. Game over.`,
			);
			return { correct: false, wordDef: wordOfDay, failure: true };
		}

		// Otherwise, return it's wrong and reveal another hint based on the number of guesses
		const defOutlineWithHints: TWordOfDay = {
			word: "?????",
			// On 4th guess (numGuesses >= 3), reveal all. Otherwise, reveal 1 more per guess
			definitions: wordOfDay.definitions.map((def, index) =>
				data.numGuesses >= 3 || index < data.numGuesses + 1 ? def : "???",
			),
			// On 4th guess (numGuesses >= 3), reveal all. Otherwise, reveal after 2 guesses
			synonyms: wordOfDay.synonyms.map((syn, index) =>
				data.numGuesses >= 3 ||
				(data.numGuesses >= 2 && index < data.numGuesses - 1)
					? syn
					: "???",
			),
			// On 4th guess (numGuesses >= 3), reveal all. Otherwise, don't reveal
			partsOfSpeech: wordOfDay.partsOfSpeech.map((pos, index) =>
				data.numGuesses >= 3 || index < data.numGuesses + 1 ? pos : "???",
			),
			pronunciations: undefined,
			wiktionaryUrl: undefined,
		};

		console.log(
			`Incorrect guess. Providing hints for guess number ${data.numGuesses + 1}. Hints: ${JSON.stringify(defOutlineWithHints)}`,
		);
		return { correct: false, wordDef: defOutlineWithHints, failure: false };
	});

export const Route = createFileRoute("/defy/")({
	loader: async () => {
		return await guessWord({ data: { guess: " ", numGuesses: 0 } });
	},
	component: Defy,
});

function Defy() {
	const data = Route.useLoaderData();

	const guessWordMutation = useMutation({
		mutationFn: async (values: { guess: string }) => {
			return await guessWord({
				data: {
					guess: values.guess,
					numGuesses: GuessStore.store.state.guesses.length,
				},
			});
		},
		onSuccess: (result) => {
			GuessStore.addGuess({
				word: form.getFieldValue("guess"),
				status: result.correct ? "correct" : "wrong",
			});
			form.reset({ guess: "" });
		},
	});

	const form = useForm({
		defaultValues: {
			guess: "",
		},
		onSubmit: async (values) => {
			guessWordMutation.mutate(values.value);
		},
		validators: {
			onSubmit: z.object({ guess: z.string().min(1, "Please enter a guess") }),
		},
	});

	// Use mutation data if available, otherwise fall back to loader data
	const wordDef = guessWordMutation.data?.wordDef ?? data.wordDef;
	const isGameOver = guessWordMutation.data?.failure ?? data.failure;

	return (
		<main className="grid grid-cols-12 gap-4 p-6 align-middle">
			<p className="col-span-12 text-center text-6xl mb-2">
				defy - {formatUtcDate(new Date())}
			</p>
			<section className="col-span-6">
				<form
					className="flex flex-row items-center gap-2 mb-4"
					onSubmit={(e) => {
						e.preventDefault();
						form.handleSubmit();
					}}
				>
					<form.Field
						name="guess"
						children={(field) => {
							const isInvalid =
								field.state.meta.isTouched && !field.state.meta.isValid;
							return (
								<Field data-invalid={isInvalid} className="flex-1">
									<Input
										disabled={isGameOver || guessWordMutation.isPending}
										id={field.name}
										name={field.name}
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
										className="w-full"
									/>
								</Field>
							);
						}}
					/>
					<Button disabled={guessWordMutation.isPending || isGameOver}>
						Guess
					</Button>
				</form>
				<WordGuesses />
			</section>

			<section className="col-span-6">
				<WordDef wordDef={wordDef} />
			</section>
		</main>
	);
}
