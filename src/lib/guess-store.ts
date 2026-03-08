import { Store } from "@tanstack/store";

export type TGuess = {
	word: string;
	status: "correct" | "close" | "wrong";
};

export const guessStore = new Store<{ guesses: TGuess[]; hintsUsed: number }>({
	guesses: [],
	hintsUsed: 0,
});

export const addGuess = (guess: TGuess) => {
	guessStore.setState((prev) => ({
		...prev,
		guesses: [...prev.guesses, guess],
	}));
};

export const increaseHintsUsed = () => {
	guessStore.setState((prev) => ({
		...prev,
		hintsUsed: prev.hintsUsed + 1,
	}));
};
