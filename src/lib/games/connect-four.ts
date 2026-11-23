import {
	otherPlayer,
	type Player,
	type TwoPlayerGame,
	type Winner,
} from "./engine";

export const CONNECT_FOUR_ROWS = 6;
export const CONNECT_FOUR_COLS = 7;

export type ConnectFourState = {
	/** board[row][col], row 0 is the top. */
	board: (Player | null)[][];
	turn: Player;
	/** Cells of the four (or more) in a row, once someone has won. */
	winningCells: [number, number][] | null;
	moveCount: number;
};

/** A move is the column to drop a disc into. */
export type ConnectFourMove = number;

const DIRECTIONS = [
	[0, 1],
	[1, 0],
	[1, 1],
	[1, -1],
] as const;

const inBounds = (r: number, c: number) =>
	r >= 0 && r < CONNECT_FOUR_ROWS && c >= 0 && c < CONNECT_FOUR_COLS;

/** The line of 4+ through (row, col) for whoever just played there, if any. */
function findLine(board: ConnectFourState["board"], row: number, col: number) {
	const player = board[row][col];
	for (const [dr, dc] of DIRECTIONS) {
		const cells: [number, number][] = [[row, col]];
		for (const sign of [1, -1]) {
			let r = row + dr * sign;
			let c = col + dc * sign;
			while (inBounds(r, c) && board[r][c] === player) {
				cells.push([r, c]);
				r += dr * sign;
				c += dc * sign;
			}
		}
		if (cells.length >= 4) return cells;
	}
	return null;
}

function winner(state: ConnectFourState): Winner {
	if (state.winningCells) {
		const [r, c] = state.winningCells[0];
		return state.board[r][c];
	}
	return state.moveCount === CONNECT_FOUR_ROWS * CONNECT_FOUR_COLS
		? "draw"
		: null;
}

// Try the middle columns first: they're usually best, which helps pruning.
const COLUMN_ORDER = [3, 2, 4, 1, 5, 0, 6];

/** Scores every 4-cell window: more of your discs in an open window is better. */
function evaluate(state: ConnectFourState, player: Player) {
	const { board } = state;
	const opponent = otherPlayer(player);
	let score = 0;

	for (let r = 0; r < CONNECT_FOUR_ROWS; r++) {
		if (board[r][3] === player) score += 3;
		if (board[r][3] === opponent) score -= 3;
	}

	for (let r = 0; r < CONNECT_FOUR_ROWS; r++) {
		for (let c = 0; c < CONNECT_FOUR_COLS; c++) {
			for (const [dr, dc] of DIRECTIONS) {
				if (!inBounds(r + dr * 3, c + dc * 3)) continue;
				let mine = 0;
				let theirs = 0;
				for (let i = 0; i < 4; i++) {
					const cell = board[r + dr * i][c + dc * i];
					if (cell === player) mine++;
					else if (cell === opponent) theirs++;
				}
				if (theirs === 0) score += mine === 3 ? 5 : mine === 2 ? 2 : 0;
				if (mine === 0) score -= theirs === 3 ? 6 : theirs === 2 ? 2 : 0;
			}
		}
	}
	return score;
}

export const connectFour: TwoPlayerGame<ConnectFourState, ConnectFourMove> = {
	setup: () => ({
		board: Array.from({ length: CONNECT_FOUR_ROWS }, () =>
			Array(CONNECT_FOUR_COLS).fill(null),
		),
		turn: 0,
		winningCells: null,
		moveCount: 0,
	}),
	currentPlayer: (state) => state.turn,
	winner,
	isOver: (state) => winner(state) !== null,
	evaluate,
	legalMoves: (state) =>
		winner(state) !== null
			? []
			: COLUMN_ORDER.filter((col) => state.board[0][col] === null),
	apply(state, col) {
		if (winner(state) !== null || state.board[0][col] !== null) return state;
		let row = CONNECT_FOUR_ROWS - 1;
		while (state.board[row][col] !== null) row--;

		const board = state.board.map((cells, r) =>
			r === row
				? cells.map((cell, c) => (c === col ? state.turn : cell))
				: cells,
		);
		return {
			board,
			turn: otherPlayer(state.turn),
			winningCells: findLine(board, row, col),
			moveCount: state.moveCount + 1,
		};
	},
};

/** Row a disc dropped in `col` would land in, or -1 if the column is full. */
export function landingRow(state: ConnectFourState, col: number) {
	for (let r = CONNECT_FOUR_ROWS - 1; r >= 0; r--) {
		if (state.board[r][col] === null) return r;
	}
	return -1;
}
