import { GameShell } from "#/components/games/GameShell";
import {
	PlayerDot,
	turnStatus,
	useVersusSettings,
	VersusControls,
} from "#/components/games/VersusControls";
import { type Difficulty, useComputerOpponent, useGame } from "#/hooks/useGame";
import type { AiOptions, Player } from "#/lib/games/engine";
import { mancala, PITS, pitOf, storeOf } from "#/lib/games/mancala";
import { cn } from "#/lib/utils";

const AI: Record<Difficulty, AiOptions> = {
	easy: { depth: 2, mistakeChance: 0.3 },
	hard: { depth: 8 },
};

const playerColor = (player: Player) =>
	player === 0 ? "var(--game-p1)" : "var(--game-p2)";

/** Beyond this many, a pit just shows its count. */
const MAX_DRAWN_SEEDS = 12;

function Seeds({ count }: { count: number }) {
	return (
		<span
			aria-hidden
			className="hidden max-w-full flex-wrap content-center justify-center gap-0.5 sm:flex"
		>
			{Array.from({ length: Math.min(count, MAX_DRAWN_SEEDS) }, (_, i) => (
				<span
					key={i}
					className="size-2 rounded-full bg-(--sea-ink-soft)"
				/>
			))}
		</span>
	);
}

export function Mancala() {
	const { state, dispatch, reset } = useGame(mancala);
	const versus = useVersusSettings();
	const computerThinking = useComputerOpponent(mancala, state, dispatch, {
		player: 1,
		enabled: versus.vsComputer,
		ai: AI[versus.difficulty],
		delayMs: 600,
	});

	const winner = mancala.winner(state);
	const canPlay = winner === null && !computerThinking;
	const legal = new Set(canPlay ? mancala.legalMoves(state) : []);
	const sown = new Set(state.last?.sown ?? []);

	const pit = (player: Player, i: number) => {
		const index = pitOf(player, i);
		const seeds = state.board[index];
		const playable = legal.has(index);
		return (
			<button
				key={index}
				type="button"
				disabled={!playable}
				onClick={() => dispatch(index)}
				aria-label={`${versus.playerName(player)}, pit ${i + 1}: ${seeds} seed${seeds === 1 ? "" : "s"}`}
				className={cn(
					"relative flex aspect-square min-w-0 flex-col items-center justify-center gap-0.5 rounded-full border-2 p-1 transition",
					"bg-(--game-surface) disabled:cursor-default",
					playable
						? "cursor-pointer hover:-translate-y-0.5 hover:shadow-md"
						: "border-transparent",
					sown.has(index) && "ring-2 ring-(--sea-ink-soft)/40",
					state.last?.pit === index && "border-dashed",
				)}
				style={{
					borderColor: playable
						? playerColor(player)
						: state.last?.pit === index
							? "var(--game-line)"
							: undefined,
				}}
			>
				<Seeds count={seeds} />
				<span className="text-base font-bold text-(--sea-ink) sm:text-sm">
					{seeds}
				</span>
			</button>
		);
	};

	const store = (player: Player) => {
		const seeds = state.board[storeOf(player)];
		return (
			<div
				role="img"
				aria-label={`${versus.playerName(player)}'s store: ${seeds}`}
				className={cn(
					"row-span-2 flex flex-col items-center justify-center gap-1 rounded-full px-1 py-3 transition",
					sown.has(storeOf(player)) && "ring-2 ring-(--sea-ink-soft)/40",
				)}
				style={{
					background: `color-mix(in srgb, ${playerColor(player)} 35%, var(--game-surface))`,
				}}
			>
				<span className="text-xl font-extrabold text-(--sea-ink) sm:text-2xl">
					{seeds}
				</span>
				<PlayerDot player={player} />
			</div>
		);
	};

	const lastNote = (() => {
		const last = state.last;
		if (!last || winner !== null) return null;
		const who = versus.playerName(last.player);
		if (last.captured > 0)
			return `${who} captured ${last.captured} seeds${last.extraTurn ? " and goes again" : ""}.`;
		if (last.extraTurn)
			return who === "You"
				? "Landed in your store: go again!"
				: `${who} landed in the store and goes again.`;
		return null;
	})();

	return (
		<GameShell
			title="Mancala"
			description="Pick a pit on your side and sow its seeds counter-clockwise. Land in your store to go again; land in an empty pit of yours to capture across. Most seeds wins."
			status={
				<span className="inline-flex flex-col items-center gap-1">
					<span className="inline-flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
						{([0, 1] as const).map((player) => (
							<span key={player} className="inline-flex items-center gap-1.5">
								<PlayerDot player={player} />
								{versus.playerName(player)}: {state.board[storeOf(player)]}
							</span>
						))}
						<span className="text-(--sea-ink-soft)">
							{turnStatus(winner, state.turn, versus.playerName)}
						</span>
					</span>
					<span className="min-h-5 text-sm font-semibold text-(--sea-ink-soft)">
						{lastNote}
					</span>
				</span>
			}
			onNewGame={reset}
			controls={<VersusControls {...versus} />}
		>
			<div className="w-full max-w-2xl">
				<p className="mt-0 mb-1 text-center text-xs font-bold uppercase tracking-wide text-(--sea-ink-soft)">
					{versus.playerName(1)}
				</p>
				<div
					className="grid grid-cols-[1fr_repeat(6,_minmax(0,_1fr))_1fr] grid-rows-2 gap-1.5 rounded-[2rem] border border-(--game-line) p-2 sm:gap-2.5 sm:p-3"
					style={{
						background:
							"color-mix(in srgb, var(--sea-ink-soft) 10%, var(--game-surface))",
					}}
				>
					{store(1)}
					{/* Player 2's pits run right to left along the top. */}
					{Array.from({ length: PITS }, (_, i) => pit(1, PITS - 1 - i))}
					{store(0)}
					{Array.from({ length: PITS }, (_, i) => pit(0, i))}
				</div>
				<p className="mt-1 mb-0 text-center text-xs font-bold uppercase tracking-wide text-(--sea-ink-soft)">
					{versus.playerName(0)}
				</p>
			</div>
		</GameShell>
	);
}
