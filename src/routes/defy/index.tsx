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
import { getWord, guessWord } from "./-defy.functions";
import { Loading } from "#/components/Loading";
import { Error } from "#/components/Error";
import { appStore } from "#/lib/app-store";
import { Instructions } from "#/components/defy/Instructions";
import { GameOver } from "#/components/defy/GameOver";

export const Route = createFileRoute("/defy/")({
	loader: async () => {
		return await getWord({
			data: { numGuesses: 0, hintsUsed: 0 },
		});
	},
	component: Defy,
});

function Defy() {
	const {
		guesses: storedGuesses,
		hintsUsed,
		gameOver,
	} = useStore(guessStore, (state) => state);
  const instructionsSeen = useStore(appStore, (state) => state.instructionsSeen);

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

			// This is honestly stupid, but it works and I don't feel like finding the correct way rn
			setTimeout(() => {
				document.getElementById("defy-input-field")?.focus();
			}, 10);
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

	const wordDef = data;

	// biome-ignore lint/correctness/useExhaustiveDependencies: <no>
	useEffect(() => {
		void refetch();
	}, [storedGuesses]);

	guessStore.subscribe((newState) => {
		if (newState.guesses.length >= 5) {
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
		return <Loading />;
	}

	if (isError || !wordDef) {
		return <Error />;
	}

	return (
		<main className="grid grid-cols-12 gap-4 p-6 align-middle">
      <Instructions isOpen={!instructionsSeen} />
      <GameOver isOpen={gameOver} won={storedGuesses.length < 5} wordOfDay={wordDef.word!} guesses={storedGuesses} hintsUsed={hintsUsed} />
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
											id={`defy-input-field`}
											autoFocus
											disabled={
												guessStore.state.gameOver || guessWordMutation.isPending
											}
											name={field.name}
											value={field.state.value}
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
