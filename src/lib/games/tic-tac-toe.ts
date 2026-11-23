import type { Player, TwoPlayerGame, Winner } from "./engine";

export type TicTacToeState = {
	/** 9 cells, row by row. */
	cells: (Player | null)[];
	turn: Player;
};

/** A move is the index of the cell to mark. */
export type TicTacToeMove = number;

export const TIC_TAC_TOE_LINES: [number, number, number][] = [
	[0, 1, 2],
	[3, 4, 5],
	[6, 7, 8],
	[0, 3, 6],
	[1, 4, 7],
	[2, 5, 8],
	[0, 4, 8],
	[2, 4, 6],
];

export function winningLine(state: TicTacToeState) {
	return (
		TIC_TAC_TOE_LINES.find(
			([a, b, c]) =>
				state.cells[a] !== null &&
				state.cells[a] === state.cells[b] &&
				state.cells[a] === state.cells[c],
		) ?? null
	);
}

function winner(state: TicTacToeState): Winner {
	const line = winningLine(state);
	if (line) return state.cells[line[0]];
	return state.cells.every((cell) => cell !== null) ? "draw" : null;
}

export const ticTacToe: TwoPlayerGame<TicTacToeState, TicTacToeMove> = {
	setup: () => ({ cells: Array(9).fill(null), turn: 0 }),
	currentPlayer: (state) => state.turn,
	winner,
	isOver: (state) => winner(state) !== null,
	legalMoves: (state) =>
		winner(state) !== null
			? []
			: state.cells.flatMap((cell, i) => (cell === null ? [i] : [])),
	apply(state, move) {
		if (winner(state) !== null || state.cells[move] !== null) return state;
		const cells = [...state.cells];
		cells[move] = state.turn;
		return { cells, turn: state.turn === 0 ? 1 : 0 };
	},
};
