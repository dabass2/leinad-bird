import { useState } from "react";
import { GameShell } from "#/components/games/GameShell";
import {
	PlayerDot,
	turnStatus,
	useVersusSettings,
	VersusControls,
} from "#/components/games/VersusControls";
import { type Difficulty, useComputerOpponent, useGame } from "#/hooks/useGame";
import {
	CONNECT_FOUR_COLS,
	connectFour,
	landingRow,
} from "#/lib/games/connect-four";
import type { AiOptions } from "#/lib/games/engine";
import { cn } from "#/lib/utils";

const AI: Record<Difficulty, AiOptions> = {
	easy: { depth: 2, mistakeChance: 0.25 },
	hard: { depth: 5 },
};

const discColor = (player: 0 | 1) =>
	player === 0 ? "var(--game-p1)" : "var(--game-p2)";

export function ConnectFour() {
	const { state, dispatch, reset } = useGame(connectFour);
	const versus = useVersusSettings();
	const computerThinking = useComputerOpponent(connectFour, state, dispatch, {
		player: 1,
		enabled: versus.vsComputer,
		ai: AI[versus.difficulty],
	});
	const [hoverCol, setHoverCol] = useState<number | null>(null);

	const winner = connectFour.winner(state);
	const canPlay = winner === null && !computerThinking;
	const previewRow =
		canPlay && hoverCol !== null ? landingRow(state, hoverCol) : -1;
	const isWinningCell = (r: number, c: number) =>
		state.winningCells?.some(([wr, wc]) => wr === r && wc === c) ?? false;

	return (
		<GameShell
			title="Connect Four"
			description="Drop discs into the columns. Four in a row, in any direction, wins."
			status={
				<span className="inline-flex items-center gap-2">
					{winner === null && <PlayerDot player={state.turn} />}
					{turnStatus(winner, state.turn, versus.playerName)}
				</span>
			}
			onNewGame={reset}
			controls={<VersusControls {...versus} />}
		>
			<div
				className="grid w-full max-w-lg gap-1.5 rounded-2xl bg-(--game-board) p-2 sm:gap-2 sm:p-3"
				style={{ gridTemplateColumns: `repeat(${CONNECT_FOUR_COLS}, 1fr)` }}
			>
				{Array.from({ length: CONNECT_FOUR_COLS }, (_, col) => (
					<button
						key={col}
						type="button"
						aria-label={`Drop in column ${col + 1}`}
						disabled={!canPlay || state.board[0][col] !== null}
						onClick={() => dispatch(col)}
						onMouseEnter={() => setHoverCol(col)}
						onFocus={() => setHoverCol(col)}
						onMouseLeave={() => setHoverCol(null)}
						onBlur={() => setHoverCol(null)}
						className="flex cursor-pointer flex-col gap-1.5 rounded-lg p-0 transition enabled:hover:bg-white/10 disabled:cursor-default sm:gap-2"
					>
						{state.board.map((cells, row) => {
							const cell = cells[col];
							const isPreview = cell === null && row === previewRow;
							return (
								<span
									key={row}
									className={cn(
										"aspect-square w-full rounded-full transition-colors",
										isWinningCell(row, col) &&
											"ring-4 ring-(--game-win) ring-inset",
									)}
									style={{
										background:
											cell !== null
												? discColor(cell)
												: isPreview
													? `color-mix(in srgb, ${discColor(state.turn)} 40%, var(--game-hole))`
													: "var(--game-hole)",
									}}
								/>
							);
						})}
					</button>
				))}
			</div>
		</GameShell>
	);
}
