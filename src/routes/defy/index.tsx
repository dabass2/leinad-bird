/** biome-ignore-all lint/correctness/noChildrenProp: <tanstack form wants it like that> */

import { WordDef } from "#/components/defy/WordDef";
import { WordGuesses } from "#/components/defy/WordGuesses";
import { Button } from "#/components/ui/button";
import { Field, FieldDescription } from "#/components/ui/field";
import { Input } from "#/components/ui/input";
import { GuessStore } from "#/lib/guess-store";
import type { DictionaryResponse, TWordOfDay } from "#/types/defy";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { createServerFn, createServerOnlyFn } from "@tanstack/react-start";
import confetti from "canvas-confetti";
import { generate } from "random-words";
import { useEffect } from "react";
import { z } from "zod";

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

const getWordOfDay = createServerOnlyFn(async (): Promise<TWordOfDay> => {
	const dateSeed = new Date().toISOString().split("T")[0];

	// Check cache first
	if (cache[dateSeed]) {
		console.log(`Using cached result for ${dateSeed}`);
		return cache[dateSeed];
	}

	console.log(`Generating word of the day for ${dateSeed}...`);
	const word = generate({ minLength: 4, seed: dateSeed, exactly: 1 })[0];
	console.log(word);
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
		if (data.numGuesses > 5) {
			console.log(
				`BUG DETECTED. Limit exceeded. The word was ${wordOfDay.word}`,
			);
			return { correct: false, wordDef: wordOfDay, failure: true };
		}

		const isCorrect =
			data?.guess?.toLowerCase() === wordOfDay.word?.toLowerCase();
		if (isCorrect) {
			console.log(`Correct guess! The word was indeed ${wordOfDay.word}`);
			return { correct: true, wordDef: wordOfDay, failure: false };
		}

		// If the guess is wrong and it's the 5th guess, reveal the word and definition
		if (data.numGuesses > 4) {
			console.log(
				`Final guess was incorrect. The word was ${wordOfDay.word}. Game over.`,
			);
			return { correct: false, wordDef: wordOfDay, failure: true };
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
		} else if (numGuesses > 3) {
			// one guess left, show them all
			numHintsToShow = Infinity;
		} else {
			// otherwise, show # of guesses + 1
			numHintsToShow = numGuesses + 1;
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
			const storedNumGuesses = GuessStore.store.state.guesses.length;
			return await guessWord({
				data: {
					guess: values.guess,
					numGuesses: storedNumGuesses + 1,
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
			onSubmit: z.object({
				guess: z
					.string()
					.min(1, "Please enter a guess")
					.regex(/^[a-zA-Z]+$/, "Guesses must only contain letters")
					.refine((val) => !val.includes(" "), "Guesses must be single words"),
			}),
		},
	});

	// Use mutation data if available, otherwise fall back to loader data
	// TODO: Look into this more, should probably just use react query only
	// page flickers when a guess is made
	const wordDef = guessWordMutation.data?.wordDef ?? data.wordDef;
	const gameFailed = guessWordMutation.data?.failure ?? data.failure;
	const gameWon = guessWordMutation.data?.correct ?? false;
	const isGameOver = gameFailed || gameWon;

	useEffect(() => {
		if (isGameOver && gameWon) {
			confetti({
				particleCount: 200,
				startVelocity: 60,
				spread: 90,
				origin: { y: 1 },
				colors: ["#4ade80", "#22d3ee", "#fbbf24", "#f87171", "#a78bfa"],
			});
		}
	}, [isGameOver, gameWon]);

	return (
		<main className="grid grid-cols-12 gap-4 p-6 align-middle">
			<p className="col-span-12 text-center text-6xl mb-2">
				defy - {formatUtcDate(new Date())}
			</p>
			<section className="col-span-6">
				<form
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
									<span className="flex flex-row gap-2 items-center">
										<Input
											disabled={isGameOver || guessWordMutation.isPending}
											id={field.name}
											name={field.name}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
											className="w-full"
										/>
										<Button
											disabled={guessWordMutation.isPending || isGameOver}
										>
											Guess
										</Button>
									</span>
									<FieldDescription
										className={`text-[--guess-wrong] ${isInvalid ? "visible" : "invisible"}`}
									>
										{isInvalid
											? field.state.meta.errors
													.map((err) => err?.message)
													.filter((err) => err)
													.join(", ")
											: "Please enter your guess"}
									</FieldDescription>
								</Field>
							);
						}}
					/>
				</form>
				<WordGuesses />
			</section>

			<section className="col-span-6">
				<WordDef wordDef={wordDef} />
			</section>
		</main>
	);
}
