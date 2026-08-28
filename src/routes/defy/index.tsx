import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useStore } from "@tanstack/react-store";
import confetti from "canvas-confetti";
import { Flame } from "lucide-react";
import { useEffect } from "react";
import { BirdError } from "#/components/BirdError";
import { Instructions } from "#/components/defy/Instructions";
import { WordDef } from "#/components/defy/WordDef";
import { WordGuesses } from "#/components/defy/WordGuesses";
import { Loading } from "#/components/Loading";
import { appStore } from "#/lib/app-store";
import { addGuess, guessStore, setGameOver } from "#/lib/guess-store";
import { formatUtcDate } from "#/lib/utils";
import { getWord, guessWord } from "./-defy.functions";

const MAX_GUESSES = 5;

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
		gameOver,
		gameWon,
		streak,
	} = useStore(guessStore, (state) => state);
	const instructionsSeen = useStore(
		appStore,
		(state) => state.instructionsSeen,
	);

	const { data, isPending, isError, refetch } = useQuery({
		queryKey: ["wordDef"],
		queryFn: async () =>
			await getWord({
				data: {
					numGuesses: storedGuesses.length,
					hintsUsed: guessStore.state.hintsUsed,
					gameOver: guessStore.state.gameOver,
				},
			}),
	});

	const guessWordMutation = useMutation({
		mutationFn: async (guess: string) => guessWord({ data: { guess } }),
	});

	const handleGuess = async (guess: string) => {
		const result = await guessWordMutation.mutateAsync(guess);
		if (result) {
			setGameOver(true);
		}
		addGuess({ word: guess, status: result ? "correct" : "wrong" });

		// This is honestly stupid, but it works and I don't feel like finding the correct way rn
		setTimeout(() => {
			document.getElementById("defy-input-field")?.focus();
		}, 10);
	};

	const wordDef = data;

	useEffect(() => {
		document.body.classList.add("defy-theme");
		return () => document.body.classList.remove("defy-theme");
	}, []);

	// biome-ignore lint/correctness/useExhaustiveDependencies: <no>
	useEffect(() => {
		void refetch();
	}, [storedGuesses]);

	guessStore.subscribe((newState) => {
		if (newState.guesses.length >= MAX_GUESSES && !newState.gameWon) {
			setGameOver(false);
		}
	});

	useEffect(() => {
		if (gameOver && gameWon) {
			confetti({
				particleCount: 200,
				startVelocity: 60,
				spread: 90,
				origin: { y: 1 },
				colors: ["#4ade80", "#22d3ee", "#fbbf24", "#f87171", "#a78bfa"],
			});
		}
	}, [gameOver, gameWon]);

	if (isPending) {
		return <Loading />;
	}

	if (isError || !wordDef) {
		return <BirdError />;
	}

	const dateLabel = formatUtcDate(
		new Date(
			new Date().toLocaleDateString("en-US", {
				timeZone: "America/Chicago",
			}),
		),
	);

	return (
		// The 73px offset matches Header's rendered height at the lg+ breakpoint
		// (where its nav never wraps), so the game fits one screen with no page scroll.
		<div className="flex flex-col bg-(--defy-bg) lg:h-[calc(100dvh-73px)] lg:overflow-hidden">
			<Instructions isOpen={!instructionsSeen} />

			<main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-3 px-4 py-4 sm:px-8 sm:py-5 lg:min-h-0">
				<section className="flex shrink-0 flex-wrap items-end justify-between gap-6">
					<div>
						<div className="flex items-center gap-2.5 text-xs font-semibold tracking-[0.16em] text-(--defy-muted) uppercase">
							Daily puzzle <span className="h-px w-8.5 bg-(--defy-line)" />{" "}
							{dateLabel}
						</div>
						<h1 className="my-1 text-[clamp(32px,4.5vw,52px)] leading-[0.95] font-semibold tracking-[-0.03em] text-(--defy-ink)">
							defy
						</h1>
					</div>
					<div className="text-right text-[13px] text-(--defy-muted)">
						{streak > 0 && (
							<div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-(--defy-line) bg-(--defy-surface) px-3 py-1.5 text-[13px] font-medium">
								<Flame className="size-3.5 text-(--defy-accent)" />
								streak <b className="font-mono text-(--defy-ink)">{streak}</b>
							</div>
						)}
						<div className="flex items-center justify-end gap-1.5">
							{Array.from({ length: MAX_GUESSES }).map((_, i) => {
								const guess = storedGuesses[i];
								const color = guess
									? guess.status === "correct"
										? "var(--defy-correct-border)"
										: "var(--defy-wrong-border)"
									: "var(--defy-line)";
								return (
									<span
										key={`pip-${i}`}
										className="h-1.5 w-[26px] rounded-full"
										style={{ background: color }}
									/>
								);
							})}
						</div>
						<p className="mt-2">
							Guess the word from its definition — {MAX_GUESSES} tries.
						</p>
					</div>
				</section>

				<div className="grid flex-1 items-stretch gap-5 lg:min-h-0 lg:grid-cols-[minmax(330px,1fr)_minmax(0,1.35fr)]">
					<div className="flex flex-col lg:min-h-0 lg:overflow-auto">
						<WordGuesses
							answer={wordDef.word}
							isSubmitting={guessWordMutation.isPending}
							onGuess={handleGuess}
						/>
					</div>
					<div className="flex flex-col lg:min-h-0">
						<WordDef wordDef={wordDef} />
					</div>
				</div>
			</main>
		</div>
	);
}
