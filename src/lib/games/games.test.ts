import { describe, expect, it } from "vitest";
import { concentration } from "./concentration";
import { connectFour } from "./connect-four";
import { dotsAndBoxes, horizontalLine, verticalLine } from "./dots-and-boxes";
import { chooseMove, createRng, type Game, type TwoPlayerGame } from "./engine";
import { MATH_FRENZY_MS, makeProblem, mathFrenzy } from "./math-frenzy";
import { ticTacToe } from "./tic-tac-toe";

const play = <S, A>(game: Game<S, A>, actions: A[], state = game.setup(1)) =>
	actions.reduce((s, a) => game.apply(s, a), state);

/** Plays the computer against itself to the end of a game. */
function selfPlay<S, M>(game: TwoPlayerGame<S, M>, depth: number) {
	let state = game.setup(1);
	const rng = createRng(7);
	while (!game.isOver(state)) {
		const move = chooseMove(game, state, { depth, rng });
		if (move === null) throw new Error("no move in an unfinished game");
		state = game.apply(state, move);
	}
	return state;
}

describe("engine", () => {
	it("gives the same numbers for the same seed", () => {
		const a = createRng(42);
		const b = createRng(42);
		expect([a(), a(), a()]).toEqual([b(), b(), b()]);
	});
});

describe("tic-tac-toe", () => {
	it("detects a win and stops accepting moves", () => {
		const state = play(ticTacToe, [0, 3, 1, 4, 2]);
		expect(ticTacToe.winner(state)).toBe(0);
		expect(ticTacToe.apply(state, 8)).toBe(state);
		expect(ticTacToe.legalMoves(state)).toEqual([]);
	});

	it("ignores moves on taken cells", () => {
		const state = play(ticTacToe, [4]);
		expect(ticTacToe.apply(state, 4)).toBe(state);
	});

	it("computer takes a win and blocks a loss", () => {
		// O to move with 3-4 lined up: wins at 5.
		const winning = play(ticTacToe, [0, 3, 1, 4, 8]);
		expect(chooseMove(ticTacToe, winning, { depth: 9 })).toBe(5);
		// O to move, X threatens 0-1-2: must block at 2.
		const blocking = play(ticTacToe, [0, 4, 1]);
		expect(chooseMove(ticTacToe, blocking, { depth: 9 })).toBe(2);
	});

	it("perfect play is a draw", () => {
		expect(ticTacToe.winner(selfPlay(ticTacToe, 9))).toBe("draw");
	});
});

describe("connect four", () => {
	it("stacks discs and finds a vertical four", () => {
		const state = play(connectFour, [0, 1, 0, 1, 0, 1, 0]);
		expect(state.board[5][0]).toBe(0);
		expect(state.board[5][1]).toBe(1);
		expect(connectFour.winner(state)).toBe(0);
		expect(state.winningCells).toHaveLength(4);
	});

	it("finds a diagonal four", () => {
		const state = play(connectFour, [0, 1, 1, 2, 2, 3, 2, 3, 3, 6, 3]);
		expect(connectFour.winner(state)).toBe(0);
	});

	it("refuses a full column", () => {
		const full = play(connectFour, [0, 0, 0, 0, 0, 0]);
		expect(connectFour.apply(full, 0)).toBe(full);
		expect(connectFour.legalMoves(full)).not.toContain(0);
	});

	it("computer blocks three in a row", () => {
		const state = play(connectFour, [0, 6, 1, 6, 2]);
		expect(chooseMove(connectFour, state, { depth: 4 })).toBe(3);
	});

	it("computer plays a whole game", () => {
		expect(connectFour.isOver(selfPlay(connectFour, 3))).toBe(true);
	});
});

describe("dots and boxes", () => {
	const box = [
		horizontalLine(0, 0),
		horizontalLine(1, 0),
		verticalLine(0, 0),
		verticalLine(0, 1),
	];

	it("switches turns until a box is closed, then gives another turn", () => {
		let state = play(dotsAndBoxes, box.slice(0, 3));
		expect(state.turn).toBe(1);
		state = dotsAndBoxes.apply(state, box[3]);
		expect(state.boxes[0]).toBe(1);
		expect(state.scores).toEqual([0, 1]);
		expect(state.turn).toBe(1);
	});

	it("computer takes a box that's ready", () => {
		const state = play(dotsAndBoxes, box.slice(0, 3));
		expect(chooseMove(dotsAndBoxes, state, { depth: 1 })).toBe(box[3]);
	});

	it("computer plays a whole game and every box is claimed", () => {
		const end = selfPlay(dotsAndBoxes, 2);
		expect(end.scores[0] + end.scores[1]).toBe(end.boxes.length);
		expect(end.boxes.every((owner) => owner !== null)).toBe(true);
	});
});

describe("concentration", () => {
	it("deals 8 pairs, the same way for the same seed", () => {
		const state = concentration.setup(5);
		expect(state.cards).toHaveLength(16);
		expect(concentration.setup(5)).toEqual(state);
	});

	it("matches pairs, hides mismatches and counts moves", () => {
		const start = concentration.setup(5);
		const first = start.cards[0].symbol;
		const pair = start.cards.findIndex((c, i) => i > 0 && c.symbol === first);
		const other = start.cards.findIndex((c) => c.symbol !== first);

		const mismatch = play(
			concentration,
			[
				{ type: "flip", index: 0 },
				{ type: "flip", index: other },
			],
			start,
		);
		expect(mismatch.faceUp).toEqual([0, other]);
		expect(mismatch.moves).toBe(1);
		expect(concentration.apply(mismatch, { type: "hide" }).faceUp).toEqual([]);

		const matched = play(
			concentration,
			[
				{ type: "flip", index: 0 },
				{ type: "flip", index: pair },
			],
			start,
		);
		expect(matched.cards[0].matched && matched.cards[pair].matched).toBe(true);
		expect(matched.faceUp).toEqual([]);
	});

	it("is over once every pair is found", () => {
		const start = concentration.setup(9);
		const flips = start.cards.flatMap((card, i) => {
			const j = start.cards.findIndex(
				(c, k) => k > i && c.symbol === card.symbol,
			);
			return j === -1
				? []
				: [
						{ type: "flip" as const, index: i },
						{ type: "flip" as const, index: j },
					];
		});
		const end = play(concentration, flips, start);
		expect(concentration.isOver(end)).toBe(true);
		expect(end.moves).toBe(8);
	});
});

describe("math frenzy", () => {
	it("makes problems with whole, non-negative answers that match the text", () => {
		const rng = createRng(3);
		for (let ops = 1; ops <= 3; ops++) {
			for (let i = 0; i < 300; i++) {
				const { text, answer } = makeProblem(rng, ops);
				expect(Number.isInteger(answer)).toBe(true);
				expect(answer).toBeGreaterThanOrEqual(0);
				const js = text
					.replaceAll("×", "*")
					.replaceAll("÷", "/")
					.replaceAll("−", "-");
				// biome-ignore lint/security/noGlobalEval: checking our own generated arithmetic
				expect(eval(js)).toBe(answer);
			}
		}
	});

	it("scores answers and ends when time runs out", () => {
		let state = mathFrenzy.setup(1);
		expect(mathFrenzy.apply(state, { type: "answer", value: 1 })).toBe(state);

		state = mathFrenzy.apply(state, { type: "start" });
		const right = state.problems[0].answer;
		state = mathFrenzy.apply(state, { type: "answer", value: right });
		state = mathFrenzy.apply(state, { type: "answer", value: null });
		expect(state.correct).toBe(1);
		expect(state.missed).toBe(1);
		expect(state.index).toBe(2);

		state = mathFrenzy.apply(state, { type: "tick", ms: MATH_FRENZY_MS });
		expect(mathFrenzy.isOver(state)).toBe(true);
	});
});
