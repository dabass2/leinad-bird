import {
	otherPlayer,
	type Player,
	type TwoPlayerGame,
	type Winner,
} from "./engine";

/** Size of the board in boxes; there is one more row and column of dots. */
export const BOX_ROWS = 4;
export const BOX_COLS = 4;

/**
 * Lines are numbered horizontal first (row by row across the dot rows), then
 * vertical. `lines[id]` is the player who drew it, so the board can color it.
 */
export type DotsAndBoxesState = {
	lines: (Player | null)[];
	/** Who completed each box, row by row. */
	boxes: (Player | null)[];
	scores: [number, number];
	turn: Player;
};

/** A move is the id of the line to draw. */
export type DotsAndBoxesMove = number;

const H_LINES = (BOX_ROWS + 1) * BOX_COLS;
const TOTAL_LINES = H_LINES + BOX_ROWS * (BOX_COLS + 1);

export const horizontalLine = (row: number, col: number) =>
	row * BOX_COLS + col;
export const verticalLine = (row: number, col: number) =>
	H_LINES + row * (BOX_COLS + 1) + col;

/** The four line ids around each box. */
const BOX_SIDES = Array.from({ length: BOX_ROWS * BOX_COLS }, (_, i) => {
	const r = Math.floor(i / BOX_COLS);
	const c = i % BOX_COLS;
	return [
		horizontalLine(r, c),
		horizontalLine(r + 1, c),
		verticalLine(r, c),
		verticalLine(r, c + 1),
	];
});

/** The one or two boxes each line borders. */
const LINE_BOXES: number[][] = Array.from({ length: TOTAL_LINES }, () => []);
BOX_SIDES.forEach((sides, box) => {
	for (const line of sides) LINE_BOXES[line].push(box);
});

const sidesDrawn = (state: DotsAndBoxesState, box: number) =>
	BOX_SIDES[box].filter((line) => state.lines[line] !== null).length;

function winner(state: DotsAndBoxesState): Winner {
	if (state.lines.some((line) => line === null)) return null;
	const [a, b] = state.scores;
	return a === b ? "draw" : a > b ? 0 : 1;
}

/**
 * Score lead, plus a nudge for boxes left with three sides: whoever moves next
 * can take them.
 */
function evaluate(state: DotsAndBoxesState, player: Player) {
	const lead = state.scores[player] - state.scores[otherPlayer(player)];
	let takeable = 0;
	state.boxes.forEach((owner, box) => {
		if (owner === null && sidesDrawn(state, box) === 3) takeable++;
	});
	return lead + (state.turn === player ? takeable : -takeable) * 0.9;
}

export const dotsAndBoxes: TwoPlayerGame<DotsAndBoxesState, DotsAndBoxesMove> =
	{
		setup: () => ({
			lines: Array(TOTAL_LINES).fill(null),
			boxes: Array(BOX_ROWS * BOX_COLS).fill(null),
			scores: [0, 0],
			turn: 0,
		}),
		currentPlayer: (state) => state.turn,
		winner,
		isOver: (state) => winner(state) !== null,
		evaluate,
		legalMoves: (state) =>
			state.lines.flatMap((owner, id) => (owner === null ? [id] : [])),
		apply(state, line) {
			if (state.lines[line] !== null || line < 0 || line >= TOTAL_LINES)
				return state;

			const next: DotsAndBoxesState = {
				lines: [...state.lines],
				boxes: [...state.boxes],
				scores: [...state.scores],
				turn: state.turn,
			};
			next.lines[line] = state.turn;

			let completed = 0;
			for (const box of LINE_BOXES[line]) {
				if (sidesDrawn(next, box) === 4) {
					next.boxes[box] = state.turn;
					completed++;
				}
			}
			next.scores[state.turn] += completed;
			// Completing a box earns another turn.
			if (completed === 0) next.turn = otherPlayer(state.turn);
			return next;
		},
	};
