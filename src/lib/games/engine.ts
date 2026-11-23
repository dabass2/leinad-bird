/**
 * The shared game engine. Every game is a set of pure functions over a plain
 * state object: `setup` builds the starting state and `apply` returns the next
 * state for an action (or the same state when the action isn't allowed).
 * Anything random is decided in `setup` from a seed, so `apply` never needs it.
 */
export interface Game<S, A> {
	setup(seed: number): S;
	apply(state: S, action: A): S;
	isOver(state: S): boolean;
}

export type Player = 0 | 1;
export type Winner = Player | "draw" | null;

/** A two-player, turn-based game. The computer opponent works with any of these. */
export interface TwoPlayerGame<S, M> extends Game<S, M> {
	currentPlayer(state: S): Player;
	legalMoves(state: S): M[];
	winner(state: S): Winner;
	/** Score of an unfinished position from `player`'s view. Defaults to 0. */
	evaluate?(state: S, player: Player): number;
}

export const otherPlayer = (player: Player): Player => (player === 0 ? 1 : 0);

export const randomSeed = () => Math.floor(Math.random() * 2 ** 32);

/** mulberry32: a tiny seeded random number generator returning [0, 1). */
export function createRng(seed: number) {
	let t = seed >>> 0;
	return () => {
		t = (t + 0x6d2b79f5) >>> 0;
		let r = Math.imul(t ^ (t >>> 15), 1 | t);
		r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
		return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
	};
}

export type Rng = ReturnType<typeof createRng>;

/** Random integer from min to max, both inclusive. */
export const randomInt = (rng: Rng, min: number, max: number) =>
	min + Math.floor(rng() * (max - min + 1));

export function shuffle<T>(items: readonly T[], rng: Rng): T[] {
	const out = [...items];
	for (let i = out.length - 1; i > 0; i--) {
		const j = Math.floor(rng() * (i + 1));
		[out[i], out[j]] = [out[j], out[i]];
	}
	return out;
}

const WIN_SCORE = 1_000_000;

export interface AiOptions {
	/** How many moves ahead to look. */
	depth: number;
	/** Chance (0 to 1) of playing a random move instead, to make it beatable. */
	mistakeChance?: number;
	rng?: Rng;
}

/**
 * Picks a move with minimax and alpha-beta pruning. It asks the game whose
 * turn it is at every step rather than assuming turns alternate, so games
 * with extra turns (Dots and Boxes) work too.
 */
export function chooseMove<S, M>(
	game: TwoPlayerGame<S, M>,
	state: S,
	{ depth, mistakeChance = 0, rng = Math.random }: AiOptions,
): M | null {
	const moves = game.legalMoves(state);
	if (moves.length === 0) return null;
	if (rng() < mistakeChance) return moves[Math.floor(rng() * moves.length)];

	const me = game.currentPlayer(state);

	const search = (s: S, d: number, alpha: number, beta: number): number => {
		const winner = game.winner(s);
		// Prefer quicker wins and slower losses: unspent depth adds to the score.
		if (winner === me) return WIN_SCORE + d;
		if (winner === "draw") return 0;
		if (winner !== null) return -WIN_SCORE - d;
		if (d === 0) return game.evaluate?.(s, me) ?? 0;

		const maximizing = game.currentPlayer(s) === me;
		let best = maximizing ? -Infinity : Infinity;
		for (const move of game.legalMoves(s)) {
			const score = search(game.apply(s, move), d - 1, alpha, beta);
			if (maximizing) {
				best = Math.max(best, score);
				alpha = Math.max(alpha, score);
			} else {
				best = Math.min(best, score);
				beta = Math.min(beta, score);
			}
			if (beta <= alpha) break;
		}
		return best;
	};

	let bestScore = -Infinity;
	let bestMoves: M[] = [];
	for (const move of moves) {
		const score = search(
			game.apply(state, move),
			depth - 1,
			-Infinity,
			Infinity,
		);
		if (score > bestScore) {
			bestScore = score;
			bestMoves = [move];
		} else if (score === bestScore) {
			bestMoves.push(move);
		}
	}
	// Break ties at random so the computer doesn't play the same game every time.
	return bestMoves[Math.floor(rng() * bestMoves.length)];
}
