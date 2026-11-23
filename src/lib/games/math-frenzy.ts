import { createRng, type Game, type Rng, randomInt } from "./engine";

export const MATH_FRENZY_MS = 60_000;
/** Far more than anyone can answer in a minute. */
const PROBLEM_COUNT = 300;
const MAX_ANSWER = 144;

type Op = "+" | "-" | "×" | "÷";
type Expr = number | { op: Op; left: Expr; right: Expr };

export type MathProblem = { text: string; answer: number };

export type MathFrenzyState = {
	problems: MathProblem[];
	index: number;
	correct: number;
	missed: number;
	timeLeftMs: number;
	status: "ready" | "playing" | "over";
	/** How the last answer went, for a quick flash in the UI. */
	last: "correct" | "missed" | null;
};

export type MathFrenzyAction =
	| { type: "start" }
	/** `value: null` skips the problem. */
	| { type: "answer"; value: number | null }
	| { type: "tick"; ms: number };

const OPS: Op[] = ["+", "-", "×", "÷"];
const precedence = (op: Op) => (op === "+" || op === "-" ? 1 : 2);

/** The value of an expression, or null if it has a remainder or goes negative. */
function evaluate(expr: Expr): number | null {
	if (typeof expr === "number") return expr;
	const left = evaluate(expr.left);
	const right = evaluate(expr.right);
	if (left === null || right === null) return null;
	switch (expr.op) {
		case "+":
			return left + right;
		case "-":
			return left - right >= 0 ? left - right : null;
		case "×":
			return left * right;
		case "÷":
			return right !== 0 && left % right === 0 ? left / right : null;
	}
}

/** Writes the expression with only the parentheses order of operations needs. */
function render(expr: Expr): string {
	if (typeof expr === "number") return String(expr);
	const side = (child: Expr, isRight: boolean) => {
		if (typeof child === "number") return render(child);
		const p = precedence(child.op);
		const parent = precedence(expr.op);
		const needsParens =
			p < parent ||
			(isRight && p === parent && (expr.op === "-" || expr.op === "÷"));
		return needsParens ? `(${render(child)})` : render(child);
	};
	const symbol = expr.op === "-" ? "−" : expr.op;
	return `${side(expr.left, false)} ${symbol} ${side(expr.right, true)}`;
}

function randomExpr(rng: Rng, ops: number): Expr {
	if (ops === 0) return randomInt(rng, 1, 12);
	const op = OPS[randomInt(rng, 0, OPS.length - 1)];
	const leftOps = randomInt(rng, 0, ops - 1);
	return {
		op,
		left: randomExpr(rng, leftOps),
		right:
			// Small divisors give whole answers far more often.
			op === "÷" && ops - 1 - leftOps === 0
				? randomInt(rng, 2, 9)
				: randomExpr(rng, ops - 1 - leftOps),
	};
}

/** Problems get longer the further you get: one operation, then two, then three. */
const opsForIndex = (index: number) => (index < 5 ? 1 : index < 15 ? 2 : 3);

export function makeProblem(rng: Rng, ops: number): MathProblem {
	for (let attempt = 0; attempt < 1000; attempt++) {
		const expr = randomExpr(rng, ops);
		const answer = evaluate(expr);
		if (answer !== null && answer <= MAX_ANSWER) {
			return { text: render(expr), answer };
		}
	}
	const a = randomInt(rng, 1, 12);
	const b = randomInt(rng, 1, 12);
	return { text: `${a} + ${b}`, answer: a + b };
}

export const mathFrenzy: Game<MathFrenzyState, MathFrenzyAction> = {
	setup(seed) {
		const rng = createRng(seed);
		return {
			problems: Array.from({ length: PROBLEM_COUNT }, (_, i) =>
				makeProblem(rng, opsForIndex(i)),
			),
			index: 0,
			correct: 0,
			missed: 0,
			timeLeftMs: MATH_FRENZY_MS,
			status: "ready",
			last: null,
		};
	},

	apply(state, action) {
		if (action.type === "start") {
			return state.status === "ready" ? { ...state, status: "playing" } : state;
		}
		if (state.status !== "playing") return state;

		if (action.type === "tick") {
			const timeLeftMs = Math.max(0, state.timeLeftMs - action.ms);
			return {
				...state,
				timeLeftMs,
				status: timeLeftMs > 0 ? "playing" : "over",
			};
		}

		const isRight = action.value === state.problems[state.index].answer;
		return {
			...state,
			index: (state.index + 1) % state.problems.length,
			correct: state.correct + (isRight ? 1 : 0),
			missed: state.missed + (isRight ? 0 : 1),
			last: isRight ? "correct" : "missed",
		};
	},

	isOver: (state) => state.status === "over",
};
