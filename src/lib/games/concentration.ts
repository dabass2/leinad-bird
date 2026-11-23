import { createRng, type Game, shuffle } from "./engine";

export const CONCENTRATION_PAIRS = 8;

export type ConcentrationCard = {
	/** Cards with the same symbol are a pair. The UI picks what each one looks like. */
	symbol: number;
	matched: boolean;
};

export type ConcentrationState = {
	cards: ConcentrationCard[];
	/** Indices of unmatched cards showing their face: at most two. */
	faceUp: number[];
	/** One move is one pair of cards turned over. */
	moves: number;
};

export type ConcentrationAction =
	| { type: "flip"; index: number }
	/** Turns a mismatched pair back over. */
	| { type: "hide" };

const hide = (state: ConcentrationState): ConcentrationState =>
	state.faceUp.length === 2 ? { ...state, faceUp: [] } : state;

export const concentration: Game<ConcentrationState, ConcentrationAction> = {
	setup(seed) {
		const symbols = Array.from({ length: CONCENTRATION_PAIRS }, (_, i) => [
			i,
			i,
		]).flat();
		return {
			cards: shuffle(symbols, createRng(seed)).map((symbol) => ({
				symbol,
				matched: false,
			})),
			faceUp: [],
			moves: 0,
		};
	},

	apply(state, action) {
		if (action.type === "hide") return hide(state);

		const card = state.cards[action.index];
		if (!card || card.matched || state.faceUp.includes(action.index))
			return state;

		// Picking a third card turns the last mismatched pair back over right away.
		const current = hide(state);
		if (current.faceUp.length === 0) {
			return { ...current, faceUp: [action.index] };
		}

		const first = current.faceUp[0];
		const moves = current.moves + 1;
		if (current.cards[first].symbol !== card.symbol) {
			return { ...current, faceUp: [first, action.index], moves };
		}
		return {
			cards: current.cards.map((c, i) =>
				i === first || i === action.index ? { ...c, matched: true } : c,
			),
			faceUp: [],
			moves,
		};
	},

	isOver: (state) => state.cards.every((card) => card.matched),
};
