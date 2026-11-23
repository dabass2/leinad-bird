import { GameShell } from "#/components/games/GameShell";
import {
	PlayerDot,
	turnStatus,
	useVersusSettings,
	VersusControls,
} from "#/components/games/VersusControls";
import { type Difficulty, useComputerOpponent, useGame } from "#/hooks/useGame";
import {
	BOX_COLS,
	BOX_ROWS,
	dotsAndBoxes,
	horizontalLine,
	verticalLine,
} from "#/lib/games/dots-and-boxes";
import type { AiOptions, Player } from "#/lib/games/engine";
import { cn } from "#/lib/utils";

const AI: Record<Difficulty, AiOptions> = {
	easy: { depth: 1, mistakeChance: 0.25 },
	hard: { depth: 3 },
};

const playerColor = (player: Player) =>
	player === 0 ? "var(--game-p1)" : "var(--game-p2)";

// The board is a CSS grid of alternating thin (dot/line) and wide (line/box) tracks.
const DOT = "20px";
const SPAN = "minmax(0, 1fr)";
const track = (count: number) =>
	`${Array.from({ length: count }, () => `${DOT} ${SPAN}`).join(" ")} ${DOT}`;

export function DotsAndBoxes() {
	const { state, dispatch, reset } = useGame(dotsAndBoxes);
	const versus = useVersusSettings();
	const computerThinking = useComputerOpponent(dotsAndBoxes, state, dispatch, {
		player: 1,
		enabled: versus.vsComputer,
		ai: AI[versus.difficulty],
		delayMs: 350,
	});

	const winner = dotsAndBoxes.winner(state);
	const canPlay = winner === null && !computerThinking;

	const lineButton = (id: number, horizontal: boolean, label: string) => {
		const owner = state.lines[id];
		return (
			<button
				key={`line-${id}`}
				type="button"
				aria-label={label}
				disabled={owner !== null || !canPlay}
				onClick={() => dispatch(id)}
				className="group flex h-full w-full cursor-pointer items-center justify-center p-0 disabled:cursor-default"
			>
				<span
					className={cn(
						"rounded-full transition-colors",
						horizontal ? "h-1.5 w-full" : "h-full w-1.5",
						owner === null &&
							"bg-(--game-line) group-enabled:group-hover:bg-(--sea-ink-soft)/40",
					)}
					style={
						owner !== null ? { background: playerColor(owner) } : undefined
					}
				/>
			</button>
		);
	};

	const cells = [];
	for (let r = 0; r <= BOX_ROWS * 2; r++) {
		for (let c = 0; c <= BOX_COLS * 2; c++) {
			const row = Math.floor(r / 2);
			const col = Math.floor(c / 2);
			if (r % 2 === 0 && c % 2 === 0) {
				cells.push(
					<span
						key={`dot-${r}-${c}`}
						className="m-auto size-3 rounded-full bg-(--sea-ink-soft)"
					/>,
				);
			} else if (r % 2 === 0) {
				cells.push(
					lineButton(
						horizontalLine(row, col),
						true,
						`Line across, row ${row + 1}, column ${col + 1}`,
					),
				);
			} else if (c % 2 === 0) {
				cells.push(
					lineButton(
						verticalLine(row, col),
						false,
						`Line down, row ${row + 1}, column ${col + 1}`,
					),
				);
			} else {
				const owner = state.boxes[row * BOX_COLS + col];
				cells.push(
					<span
						key={`box-${r}-${c}`}
						className="m-1 rounded-md transition-colors"
						style={{
							background:
								owner === null
									? "transparent"
									: `color-mix(in srgb, ${playerColor(owner)} 45%, transparent)`,
						}}
					/>,
				);
			}
		}
	}

	return (
		<GameShell
			title="Dots and Boxes"
			description="Take turns drawing lines. Close a box to claim it and go again. Most boxes wins."
			status={
				<span className="inline-flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
					{([0, 1] as const).map((player) => (
						<span key={player} className="inline-flex items-center gap-1.5">
							<PlayerDot player={player} />
							{versus.playerName(player)}: {state.scores[player]}
						</span>
					))}
					<span className="text-(--sea-ink-soft)">
						{turnStatus(winner, state.turn, versus.playerName)}
					</span>
				</span>
			}
			onNewGame={reset}
			controls={<VersusControls {...versus} />}
		>
			<div
				className="grid aspect-square w-full max-w-md rounded-2xl border border-(--game-line) bg-(--game-surface) p-3"
				style={{
					gridTemplateColumns: track(BOX_COLS),
					gridTemplateRows: track(BOX_ROWS),
				}}
			>
				{cells}
			</div>
		</GameShell>
	);
}
