import { Timer } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { GameShell } from "#/components/games/GameShell";
import { Button } from "#/components/ui/button";
import { useBestScore, useGame } from "#/hooks/useGame";
import { MATH_FRENZY_MS, mathFrenzy } from "#/lib/games/math-frenzy";
import { cn } from "#/lib/utils";

const TICK_MS = 100;

export function MathFrenzy() {
	const { state, dispatch, reset } = useGame(mathFrenzy);
	const [best, submitBest] = useBestScore("math-frenzy");
	const [input, setInput] = useState("");
	const inputRef = useRef<HTMLInputElement>(null);

	const playing = state.status === "playing";
	const problem = state.problems[state.index];

	// Count down from real elapsed time so a slow or backgrounded tab stays accurate.
	useEffect(() => {
		if (!playing) return;
		let last = Date.now();
		const id = setInterval(() => {
			const now = Date.now();
			dispatch({ type: "tick", ms: now - last });
			last = now;
		}, TICK_MS);
		return () => clearInterval(id);
	}, [playing, dispatch]);

	useEffect(() => {
		if (state.status === "over") submitBest(state.correct);
	}, [state.status, state.correct, submitBest]);

	useEffect(() => {
		if (playing) inputRef.current?.focus();
	}, [playing]);

	const answer = (value: number | null) => {
		dispatch({ type: "answer", value });
		setInput("");
	};

	const onChange = (value: string) => {
		const cleaned = value.replace(/\D/g, "");
		setInput(cleaned);
		// Right answers go through as soon as they're typed.
		if (cleaned !== "" && Number(cleaned) === problem.answer)
			answer(problem.answer);
	};

	const newGame = () => {
		reset();
		setInput("");
	};

	const seconds = Math.ceil(state.timeLeftMs / 1000);
	const answered = state.correct + state.missed;

	return (
		<GameShell
			title="Math Frenzy"
			description="Solve as many problems as you can in 60 seconds. Mind the order of operations."
			status={
				<span className="inline-flex items-center gap-4">
					<span className="inline-flex items-center gap-1.5">
						<Timer className="size-5" />
						<span className="font-mono">{seconds}s</span>
					</span>
					<span>Score: {state.correct}</span>
					{best !== null && (
						<span className="text-(--sea-ink-soft)">Best: {best}</span>
					)}
				</span>
			}
			onNewGame={newGame}
		>
			<div className="flex w-full max-w-md flex-col items-center gap-5 rounded-2xl border border-(--game-line) bg-(--game-surface) px-6 py-8">
				<div className="h-1.5 w-full overflow-hidden rounded-full bg-(--game-line)">
					<div
						className="h-full rounded-full bg-(--game-p1) transition-[width] duration-100 ease-linear"
						style={{ width: `${(state.timeLeftMs / MATH_FRENZY_MS) * 100}%` }}
					/>
				</div>

				{state.status === "ready" && (
					<>
						<p className="m-0 text-center text-(--sea-ink-soft)">
							Problems use +, −, × and ÷, and get longer as you go. Right
							answers submit on their own. Press Enter to skip one.
						</p>
						<Button size="lg" onClick={() => dispatch({ type: "start" })}>
							Start
						</Button>
					</>
				)}

				{playing && (
					<form
						className="flex w-full flex-col items-center gap-4"
						onSubmit={(e) => {
							e.preventDefault();
							answer(input === "" ? null : Number(input));
						}}
					>
						<p
							aria-live="polite"
							className="m-0 font-mono text-4xl font-bold tracking-tight text-(--sea-ink) sm:text-5xl"
						>
							{problem.text}
						</p>
						<input
							ref={inputRef}
							value={input}
							onChange={(e) => onChange(e.target.value)}
							inputMode="numeric"
							autoComplete="off"
							aria-label="Your answer"
							placeholder="?"
							className={cn(
								"w-40 rounded-xl border-2 bg-white px-4 py-2 text-center font-mono text-3xl outline-none transition-colors",
								state.last === "missed"
									? "border-(--guess-wrong)"
									: "border-(--game-line) focus:border-(--game-p1)",
							)}
						/>
					</form>
				)}

				{state.status === "over" && (
					<div className="flex flex-col items-center gap-3 text-center">
						<p className="m-0 text-5xl font-extrabold text-(--sea-ink)">
							{state.correct}
						</p>
						<p className="m-0 text-(--sea-ink-soft)">
							{answered > 0
								? `${Math.round((state.correct / answered) * 100)}% accuracy, ${state.missed} missed or skipped.`
								: "No answers this time."}
						</p>
						<Button size="lg" onClick={newGame}>
							Play again
						</Button>
					</div>
				)}
			</div>
		</GameShell>
	);
}
