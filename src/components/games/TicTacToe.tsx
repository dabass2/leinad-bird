import { Circle, X } from "lucide-react";
import { GameShell } from "#/components/games/GameShell";
import {
	turnStatus,
	useVersusSettings,
	VersusControls,
} from "#/components/games/VersusControls";
import { type Difficulty, useComputerOpponent, useGame } from "#/hooks/useGame";
import type { AiOptions, Player } from "#/lib/games/engine";
import { ticTacToe, winningLine } from "#/lib/games/tic-tac-toe";
import { cn } from "#/lib/utils";

const AI: Record<Difficulty, AiOptions> = {
	easy: { depth: 9, mistakeChance: 0.4 },
	hard: { depth: 9 },
};

function Mark({ player }: { player: Player }) {
	return player === 0 ? (
		<X className="size-3/5 text-(--game-p1)" strokeWidth={3} />
	) : (
		<Circle className="size-1/2 text-(--game-p2)" strokeWidth={3} />
	);
}

export function TicTacToe() {
	const { state, dispatch, reset } = useGame(ticTacToe);
	const versus = useVersusSettings();
	const computerThinking = useComputerOpponent(ticTacToe, state, dispatch, {
		player: 1,
		enabled: versus.vsComputer,
		ai: AI[versus.difficulty],
	});

	const line = winningLine(state);
	const winner = ticTacToe.winner(state);

	return (
		<GameShell
			title="Tic-Tac-Toe"
			description="Get three in a row before your opponent does."
			status={turnStatus(winner, state.turn, versus.playerName)}
			onNewGame={reset}
			controls={<VersusControls {...versus} />}
		>
			<div className="grid w-full max-w-sm grid-cols-3 gap-2">
				{state.cells.map((cell, i) => (
					<button
						key={i}
						type="button"
						aria-label={`Cell ${i + 1}`}
						disabled={cell !== null || winner !== null || computerThinking}
						onClick={() => dispatch(i)}
						className={cn(
							"flex aspect-square cursor-pointer items-center justify-center rounded-xl border border-(--game-line) bg-(--game-surface) transition enabled:hover:bg-(--game-input) disabled:cursor-default",
							line?.includes(i) && "bg-(--foam)",
						)}
					>
						{cell !== null && <Mark player={cell} />}
					</button>
				))}
			</div>
		</GameShell>
	);
}
