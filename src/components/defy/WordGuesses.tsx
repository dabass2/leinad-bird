/** biome-ignore-all lint/correctness/noChildrenProp: <tanstack form wants it like that> */

import { useForm } from "@tanstack/react-form";
import { useStore } from "@tanstack/react-store";
import { Copy } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { Field, FieldDescription } from "#/components/ui/field";
import { guessStore } from "#/lib/guess-store";
import { getCurrentFormattedDate } from "#/lib/utils";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { WordGuess } from "./WordGuess";

const MAX_GUESSES = 5;

export type WordGuessesProps = {
	answer?: string;
	isSubmitting: boolean;
	onGuess: (guess: string) => Promise<void>;
};

export function WordGuesses({
	answer,
	isSubmitting,
	onGuess,
}: WordGuessesProps) {
	const guesses = useStore(guessStore, (state) => state.guesses);
	const hintsUsed = useStore(guessStore, (state) => state.hintsUsed);
	const gameOver = useStore(guessStore, (state) => state.gameOver);
	const gameWon = useStore(guessStore, (state) => state.gameWon);
	const [shared, setShared] = useState(false);

	const form = useForm({
		defaultValues: { guess: "" },
		onSubmit: async ({ value }) => {
			await onGuess(value.guess);
			form.reset({ guess: "" });
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

	const copyResults = async () => {
		await navigator.clipboard.writeText(`defy | ${getCurrentFormattedDate()}
-------------------
Guesses 🤔: ${guesses.map((guess) => (guess.status === "correct" ? "🟩" : "🟥")).join("")}
Hints Used 💡: ${hintsUsed}
${window.location.href}`);
		setShared(true);
		setTimeout(() => setShared(false), 1400);
	};

	const slots = Array.from({ length: MAX_GUESSES }, (_, i) => guesses[i]);

	return (
		<section className="rounded-2xl border border-(--defy-line) bg-(--defy-surface) shadow-[0_1px_0_rgba(23,22,19,.04),0_12px_32px_-18px_rgba(23,22,19,.28)]">
			<div className="flex items-center justify-between gap-3 border-b border-(--defy-line) px-4.5 py-4">
				<span className="text-xs font-semibold tracking-widest text-(--defy-muted) uppercase">
					Guesses
				</span>
				<span className="font-mono text-xs font-bold text-(--defy-ink)">
					{guesses.length} / {MAX_GUESSES}
				</span>
			</div>

			<div className="flex flex-col gap-2 p-3.5">
				{slots.map((guess, index) => (
					<WordGuess
						key={`guess-slot-${index}`}
						index={index}
						status={guess ? guess.status : "empty"}
						word={guess?.word ?? ""}
					/>
				))}
			</div>

			{!gameOver ? (
				<form
					className="flex gap-2 border-t border-(--defy-line) p-3.5"
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
										id="defy-input-field"
										autoFocus
										disabled={isSubmitting}
										name={field.name}
										value={field.state.value}
										onChange={(e) => field.handleChange(e.target.value)}
										maxLength={16}
										placeholder="type a word"
										autoComplete="off"
										spellCheck={false}
										className="h-auto rounded-xl border-(--defy-line) bg-(--defy-surface-muted) px-4 py-3.5 font-mono text-base font-bold tracking-[0.08em] text-(--defy-ink) shadow-none focus-visible:border-(--defy-accent) focus-visible:bg-(--defy-surface) focus-visible:ring-(--defy-accent)/30"
									/>
									<FieldDescription
										className={
											isInvalid ? "text-(--defy-wrong-text)" : "sr-only"
										}
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
					<Button
						disabled={isSubmitting}
						className="h-auto self-start rounded-xl bg-(--defy-ink) px-5 py-3.5 font-semibold text-(--defy-bg) hover:bg-[#2C2A24]"
					>
						Guess
					</Button>
				</form>
			) : (
				<div className="flex items-center gap-3 border-t border-(--defy-line) bg-[rgba(124,196,154,.1)] p-4">
					<div className="flex-1">
						<b className="text-sm text-(--defy-ink)">
							{gameWon ? `Solved in ${guesses.length}` : "Out of guesses"}
						</b>
						<p className="m-0 text-[13px] text-(--defy-muted)">
							The word was{" "}
							<span className="font-mono font-bold text-(--defy-ink)">
								{answer ?? "?????"}
							</span>
							.
						</p>
					</div>
					<Button
						variant="outline"
						onClick={copyResults}
						className="h-auto rounded-xl border-(--defy-line) bg-(--defy-surface) px-5 py-3.5 font-semibold text-(--defy-ink) hover:bg-(--defy-surface-muted)"
					>
						{shared ? "Copied" : "Share"} <Copy className="size-4" />
					</Button>
				</div>
			)}
		</section>
	);
}
