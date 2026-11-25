import {
	otherPlayer,
	type Player,
	type TwoPlayerGame,
	type Winner,
} from "./engine";

/** Pits per side and the seeds each starts with (Kalah rules). */
export const PITS = 6;
export const START_SEEDS = 4;

/**
 * The board runs counter-clockwise as one array: player 1's pits (0–5), their
 * store (6), player 2's pits (7–12), their store (13). Seeds are sown along it.
 */
const BOARD_SIZE = 2 * PITS + 2;

export const storeOf = (player: Player) => (player === 0 ? PITS : 2 * PITS + 1);
/** The board index of a player's pit, 0 to 5, counted in sowing order. */
export const pitOf = (player: Player, pit: number) =>
	player === 0 ? pit : PITS + 1 + pit;
const isOwnPit = (player: Player, index: number) =>
	index >= pitOf(player, 0) && index < storeOf(player);
/** The pit facing `index` across the board. */
const opposite = (index: number) => 2 * PITS - index;

export type MancalaState = {
	board: number[];
	turn: Player;
	/** What the last move did, so the board can show it. */
	last: {
		player: Player;
		pit: number;
		/** Every index a seed landed in, in order. */
		sown: number[];
		/** Seeds taken by landing in an empty pit. */
		captured: number;
		extraTurn: boolean;
	} | null;
};

/** A move is the board index of the pit to empty. */
export type MancalaMove = number;

const sideSeeds = (board: number[], player: Player) => {
	let total = 0;
	for (let i = 0; i < PITS; i++) total += board[pitOf(player, i)];
	return total;
};

function winner(state: MancalaState): Winner {
	if (sideSeeds(state.board, 0) > 0 && sideSeeds(state.board, 1) > 0)
		return null;
	const a = state.board[storeOf(0)];
	const b = state.board[storeOf(1)];
	return a === b ? "draw" : a > b ? 0 : 1;
}

/** Store lead, plus a little for seeds still on your side. */
function evaluate(state: MancalaState, player: Player) {
	const other = otherPlayer(player);
	const stores = state.board[storeOf(player)] - state.board[storeOf(other)];
	const sides = sideSeeds(state.board, player) - sideSeeds(state.board, other);
	return stores + sides * 0.25;
}

export const mancala: TwoPlayerGame<MancalaState, MancalaMove> = {
	setup: () => ({
		board: Array.from({ length: BOARD_SIZE }, (_, i) =>
			i === storeOf(0) || i === storeOf(1) ? 0 : START_SEEDS,
		),
		turn: 0,
		last: null,
	}),
	currentPlayer: (state) => state.turn,
	winner,
	isOver: (state) => winner(state) !== null,
	evaluate,
	legalMoves: (state) =>
		Array.from({ length: PITS }, (_, i) => pitOf(state.turn, i)).filter(
			(index) => state.board[index] > 0,
		),
	apply(state, pit) {
		const player = state.turn;
		if (
			winner(state) !== null ||
			!isOwnPit(player, pit) ||
			state.board[pit] === 0
		)
			return state;

		const board = [...state.board];
		let seeds = board[pit];
		board[pit] = 0;
		const sown: number[] = [];
		let index = pit;
		while (seeds > 0) {
			index = (index + 1) % BOARD_SIZE;
			// Skip the opponent's store.
			if (index === storeOf(otherPlayer(player))) continue;
			board[index]++;
			sown.push(index);
			seeds--;
		}

		// Ending in your own empty pit takes it and everything facing it.
		let captured = 0;
		if (
			isOwnPit(player, index) &&
			board[index] === 1 &&
			board[opposite(index)] > 0
		) {
			captured = board[index] + board[opposite(index)];
			board[storeOf(player)] += captured;
			board[index] = 0;
			board[opposite(index)] = 0;
		}

		// Once a side is empty, everyone keeps what's left on their own side.
		if (sideSeeds(board, 0) === 0 || sideSeeds(board, 1) === 0) {
			for (const p of [0, 1] as const) {
				for (let i = 0; i < PITS; i++) {
					board[storeOf(p)] += board[pitOf(p, i)];
					board[pitOf(p, i)] = 0;
				}
			}
		}

		// Ending in your own store earns another turn.
		const extraTurn = index === storeOf(player);
		return {
			board,
			turn: extraTurn ? player : otherPlayer(player),
			last: { player, pit, sown, captured, extraTurn },
		};
	},
};
