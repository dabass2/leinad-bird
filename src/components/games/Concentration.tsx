import { Bird, Cat, Dog, Fish, Flower2, Leaf, Moon, Sun } from "lucide-react";
import { useEffect } from "react";
import { GameShell } from "#/components/games/GameShell";
import { useBestScore, useGame } from "#/hooks/useGame";
import { concentration } from "#/lib/games/concentration";
import { cn } from "#/lib/utils";

/** One icon per pair; a card's symbol indexes into this. */
const SYMBOLS = [Bird, Cat, Dog, Fish, Flower2, Leaf, Moon, Sun];
const SYMBOL_NAMES = [
	"bird",
	"cat",
	"dog",
	"fish",
	"flower",
	"leaf",
	"moon",
	"sun",
];

const MISMATCH_MS = 900;

export function Concentration() {
	const { state, dispatch, reset, isOver } = useGame(concentration);
	const [best, submitBest] = useBestScore("concentration", true);

	// Turn a mismatched pair back over after a moment.
	const showingMismatch = state.faceUp.length === 2;
	useEffect(() => {
		if (!showingMismatch) return;
		const id = setTimeout(() => dispatch({ type: "hide" }), MISMATCH_MS);
		return () => clearTimeout(id);
	}, [showingMismatch, dispatch]);

	useEffect(() => {
		if (isOver) submitBest(state.moves);
	}, [isOver, state.moves, submitBest]);

	const status = isOver
		? `Cleared in ${state.moves} moves!`
		: `Moves: ${state.moves}${best !== null ? ` · Best: ${best}` : ""}`;

	return (
		<GameShell
			title="Concentration"
			description="Flip two cards at a time and find every matching pair in as few moves as you can."
			status={status}
			onNewGame={reset}
		>
			<div className="grid w-full max-w-md grid-cols-4 gap-2 sm:gap-3">
				{state.cards.map((card, i) => {
					const Icon = SYMBOLS[card.symbol];
					const visible = card.matched || state.faceUp.includes(i);
					return (
						<button
							key={i}
							type="button"
							aria-label={visible ? SYMBOL_NAMES[card.symbol] : `Card ${i + 1}`}
							disabled={card.matched}
							onClick={() => dispatch({ type: "flip", index: i })}
							className={cn(
								"flex aspect-square cursor-pointer items-center justify-center rounded-xl border transition-all duration-200",
								visible
									? "border-(--game-line) bg-(--game-surface)"
									: "border-transparent bg-(--sea-ink-soft) hover:-translate-y-0.5",
								card.matched && "cursor-default bg-(--foam) opacity-70",
							)}
						>
							{visible && (
								<Icon
									className="size-1/2 text-(--sea-ink-soft)"
									strokeWidth={2}
								/>
							)}
						</button>
					);
				})}
			</div>
		</GameShell>
	);
}
