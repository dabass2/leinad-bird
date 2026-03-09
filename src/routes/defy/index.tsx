/** biome-ignore-all lint/correctness/noChildrenProp: <tanstack form wants it like that> */

import { WordDef } from "#/components/defy/WordDef";
import { WordGuesses } from "#/components/defy/WordGuesses";
import { Button } from "#/components/ui/button";
import { Field, FieldDescription } from "#/components/ui/field";
import { Input } from "#/components/ui/input";
import { addGuess, guessStore, setGameOver } from "#/lib/guess-store";
import { formatUtcDate } from "#/lib/utils";
import { useForm, useStore } from "@tanstack/react-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import confetti from "canvas-confetti";
import { useEffect } from "react";
import { z } from "zod";
import { getWord, guessWord } from "./defy.functions";

export const Route = createFileRoute("/defy/")({
	loader: async () => {
		return await getWord({
			data: { numGuesses: 0, hintsUsed: 0 },
		});
	},
	component: Defy,
});

function Defy() {
	// const data = Route.useLoaderData();
	const {
		guesses: storedGuesses,
		hintsUsed,
		gameOver,
	} = useStore(guessStore, (state) => state);

	const { data, isPending, isError, refetch } = useQuery({
		queryKey: ["wordDef"],
		queryFn: async () =>
			await getWord({
				data: {
					numGuesses: storedGuesses.length,
					hintsUsed: hintsUsed,
					gameOver: guessStore.state.gameOver,
				},
			}),
	});

	const guessWordMutation = useMutation({
		mutationFn: async (values: { guess: string; isHint: boolean }) => {
			return await guessWord({
				data: {
					guess: values.guess,
				},
			});
		},
		onSuccess: async (result) => {
			if (result) {
				setGameOver();
			}
			addGuess({
				word: form.getFieldValue("guess"),
				status: result ? "correct" : "wrong",
			});
			form.reset({ guess: "" });
		},
	});

	const form = useForm({
		defaultValues: {
			guess: "",
		},
		onSubmit: async (values) => {
			guessWordMutation.mutate({ ...values.value, isHint: false });
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
	const wordDef = data;

	// biome-ignore lint/correctness/useExhaustiveDependencies: <no>
	useEffect(() => {
		void refetch();
	}, [storedGuesses]);

	guessStore.subscribe(() => {
		if (storedGuesses.length >= 5) {
			setGameOver();
		}
	});

	useEffect(() => {
		if (gameOver && storedGuesses.length < 5) {
			setGameOver();
			confetti({
				particleCount: 200,
				startVelocity: 60,
				spread: 90,
				origin: { y: 1 },
				colors: ["#4ade80", "#22d3ee", "#fbbf24", "#f87171", "#a78bfa"],
			});
		}
	}, [gameOver, storedGuesses]);

	if (isPending) {
		return null;
	}

	if (isError || !wordDef) {
		return null;
	}

	return (
		<main className="grid grid-cols-12 gap-4 p-6 align-middle">
			<p className="col-span-12 text-center text-6xl mb-2">
				defy - {formatUtcDate(new Date())}
			</p>
			<section className="col-span-full md:col-span-6">
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
											autoFocus
											disabled={
												guessStore.state.gameOver || guessWordMutation.isPending
											}
											id={field.name}
											name={field.name}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
											className="w-full"
										/>
										<Button
											disabled={
												guessWordMutation.isPending || guessStore.state.gameOver
											}
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

			<section className="col-span-full md:col-span-6">
				<WordDef wordDef={wordDef} />
			</section>
		</main>
	);
}
