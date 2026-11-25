import { ArrowLeft, ArrowRight, CircleHelp } from "lucide-react";
import { useEffect, useState } from "react";
import { GameShell } from "#/components/games/GameShell";
import { MancalaGuide } from "#/components/games/MancalaGuide";
import {
	PlayerDot,
	turnStatus,
	useVersusSettings,
	VersusControls,
} from "#/components/games/VersusControls";
import { Button } from "#/components/ui/button";
import { type Difficulty, useComputerOpponent, useGame } from "#/hooks/useGame";
import type { AiOptions, Player } from "#/lib/games/engine";
import {
	type MancalaState,
	mancala,
	PITS,
	pitOf,
	type SowFrame,
	sowFrames,
	storeOf,
} from "#/lib/games/mancala";
import { cn } from "#/lib/utils";

const AI: Record<Difficulty, AiOptions> = {
	easy: { depth: 2, mistakeChance: 0.3 },
	hard: { depth: 8 },
};

const playerColor = (player: Player) =>
	player === 0 ? "var(--game-p1)" : "var(--game-p2)";

/** Beyond this many, a pit just shows its count. */
const MAX_DRAWN_SEEDS = 12;

const GUIDE_SEEN_KEY = "games:mancala:guide-seen";

/** Long moves sow faster so no move takes much more than a few seconds. */
const stepMs = (frames: number) => Math.max(110, Math.min(280, 3000 / frames));
const CAPTURE_MS = 800;

/**
 * Replays each new move seed by seed. Returns the frame to show, or null once
 * the board has caught up with the real state. This runs even when the viewer
 * prefers reduced motion: the replay is how you follow a move, so only the
 * bounce and shake effects are turned off (in styles.css), not the steps.
 */
function useSowAnimation(state: MancalaState) {
	const [seen, setSeen] = useState(state);
	const [play, setPlay] = useState<{ frames: SowFrame[]; step: number } | null>(
		null,
	);

	// A new move: start replaying it from the board it was made on.
	if (seen !== state) {
		setSeen(state);
		setPlay(
			state.last
				? { frames: sowFrames(seen.board, state.last), step: 0 }
				: null,
		);
	}

	useEffect(() => {
		if (!play) return;
		const frame = play.frames[play.step];
		const id = setTimeout(
			() =>
				setPlay(
					play.step + 1 < play.frames.length
						? { ...play, step: play.step + 1 }
						: null,
				),
			frame.capturing.length > 0 ? CAPTURE_MS : stepMs(play.frames.length),
		);
		return () => clearTimeout(id);
	}, [play]);

	return play ? play.frames[play.step] : null;
}

function Seeds({ count, dropLast }: { count: number; dropLast: boolean }) {
	const shown = Math.min(count, MAX_DRAWN_SEEDS);
	return (
		<span
			aria-hidden
			className="hidden max-w-full flex-wrap content-center justify-center gap-0.5 sm:flex"
		>
			{Array.from({ length: shown }, (_, i) => (
				<span
					key={i}
					className={cn(
						"size-2 rounded-full bg-(--sea-ink-soft)",
						dropLast && i === shown - 1 && "mancala-seed-drop",
					)}
				/>
			))}
		</span>
	);
}

/** The seeds still to drop, riding along with the pit that just got one. */
function InHand({ count, player }: { count: number; player: Player }) {
	if (count === 0) return null;
	return (
		<span
			aria-hidden
			className="absolute -top-2 -right-1 z-10 flex size-6 items-center justify-center rounded-full text-xs font-extrabold text-(--sea-ink) shadow-md ring-2 ring-(--game-surface)"
			style={{ background: playerColor(player) }}
		>
			{count}
		</span>
	);
}

export function Mancala() {
	const { state, dispatch, reset } = useGame(mancala);
	const versus = useVersusSettings();
	const frame = useSowAnimation(state);
	const animating = frame !== null;
	const computerThinking = useComputerOpponent(mancala, state, dispatch, {
		player: 1,
		enabled: versus.vsComputer && !animating,
		ai: AI[versus.difficulty],
		delayMs: 500,
	});

	const [guideOpen, setGuideOpen] = useState(() => {
		try {
			return localStorage.getItem(GUIDE_SEEN_KEY) === null;
		} catch {
			return false;
		}
	});
	const onGuideOpenChange = (open: boolean) => {
		setGuideOpen(open);
		if (!open) {
			try {
				localStorage.setItem(GUIDE_SEEN_KEY, "1");
			} catch {
				// Blocked storage just means the guide opens again next visit.
			}
		}
	};

	const board = frame?.board ?? state.board;
	const mover = state.last?.player ?? state.turn;
	const winner = animating ? null : mancala.winner(state);
	const canPlay = winner === null && !computerThinking && !animating;
	const legal = new Set(canPlay ? mancala.legalMoves(state) : []);
	const firstMove = state.last === null && canPlay;
	// Once a move has played out, outline where it went until the next one.
	const sown = new Set(animating ? [] : (state.last?.sown ?? []));
	const capturing = new Set(frame?.capturing ?? []);

	const pit = (player: Player, i: number) => {
		const index = pitOf(player, i);
		const seeds = board[index];
		const playable = legal.has(index);
		const active = frame?.active === index;
		const picked = state.last?.pit === index;
		return (
			<button
				key={index}
				type="button"
				disabled={!playable}
				onClick={() => dispatch(index)}
				aria-label={`${versus.playerName(player)}, pit ${i + 1}: ${seeds} seed${seeds === 1 ? "" : "s"}`}
				className={cn(
					"relative flex aspect-square min-w-0 flex-col items-center justify-center gap-0.5 rounded-full border-2 p-1 transition-[box-shadow,border-color,background-color]",
					"bg-(--game-surface) disabled:cursor-default",
					playable
						? "cursor-pointer hover:shadow-md hover:brightness-95"
						: "border-transparent",
					firstMove && playable && "mancala-hint",
					sown.has(index) && "ring-2 ring-(--sea-ink-soft)/40",
					picked && "border-dashed",
					active && frame.capturing.length === 0 && "mancala-pop",
					capturing.has(index) && "mancala-capture bg-(--danger-soft)",
				)}
				style={{
					borderColor: capturing.has(index)
						? "var(--danger-line)"
						: active
							? playerColor(mover)
							: playable
								? playerColor(player)
								: picked
									? "var(--game-line)"
									: undefined,
					// A tint that doesn't rely on motion marks where the seed just landed.
					backgroundColor:
						active && !capturing.has(index)
							? `color-mix(in srgb, ${playerColor(mover)} 30%, var(--game-surface))`
							: undefined,
				}}
			>
				<Seeds count={seeds} dropLast={active} />
				<span className="text-base font-bold text-(--sea-ink) sm:text-sm">
					{seeds}
				</span>
				{active && <InHand count={frame.inHand} player={mover} />}
			</button>
		);
	};

	const store = (player: Player) => {
		const index = storeOf(player);
		const seeds = board[index];
		const active = frame?.active === index;
		return (
			<div
				role="img"
				aria-label={`${versus.playerName(player)}'s store: ${seeds}`}
				className={cn(
					"relative row-span-2 flex flex-col items-center justify-center gap-1 rounded-full px-1 py-3 transition-shadow",
					sown.has(index) && "ring-2 ring-(--sea-ink-soft)/40",
					active && "mancala-pop",
				)}
				style={{
					background: `color-mix(in srgb, ${playerColor(player)} ${active ? 65 : 35}%, var(--game-surface))`,
				}}
			>
				<span className="text-xl font-extrabold text-(--sea-ink) sm:text-2xl">
					{seeds}
				</span>
				<span className="text-[0.6rem] font-bold uppercase tracking-wide text-(--sea-ink-soft)">
					Store
				</span>
				{active && <InHand count={frame.inHand} player={mover} />}
			</div>
		);
	};

	const moverName = versus.playerName(mover);
	const note = (() => {
		if (animating) {
			if (frame.capturing.length > 0) return "Capture!";
			return `${moverName === "You" ? "You're" : `${moverName} is`} sowing…`;
		}
		if (firstMove)
			return `Tap one of ${versus.vsComputer ? "your" : "Player 1's"} outlined pits to sow its seeds.`;
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

	const sideLabel = (player: Player) => {
		const name = versus.playerName(player);
		const text = name === "You" ? "Your side" : `${name}'s side`;
		return (
			<p className="my-1 flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-wide text-(--sea-ink-soft)">
				{player === 1 && <ArrowLeft className="size-3.5" />}
				<PlayerDot player={player} />
				{text}
				{player === 0 && <ArrowRight className="size-3.5" />}
			</p>
		);
	};

	return (
		<>
			<GameShell
				title="Mancala"
				description="Sow seeds around the board and collect the most in your store."
				status={
					<span className="inline-flex flex-col items-center gap-1">
						<span className="inline-flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
							{([0, 1] as const).map((player) => (
								<span key={player} className="inline-flex items-center gap-1.5">
									<PlayerDot player={player} />
									{versus.playerName(player)}: {board[storeOf(player)]}
								</span>
							))}
							<span className="text-(--sea-ink-soft)">
								{animating
									? null
									: turnStatus(winner, state.turn, versus.playerName)}
							</span>
						</span>
						<span className="min-h-5 text-sm font-semibold text-(--sea-ink-soft)">
							{note}
						</span>
					</span>
				}
				onNewGame={reset}
				controls={
					<>
						<Button variant="outline" onClick={() => setGuideOpen(true)}>
							<CircleHelp /> How to play
						</Button>
						<VersusControls {...versus} />
					</>
				}
			>
				<div className="w-full max-w-2xl">
					{sideLabel(1)}
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
					{sideLabel(0)}
				</div>
			</GameShell>
			<MancalaGuide open={guideOpen} onOpenChange={onGuideOpenChange} />
		</>
	);
}
