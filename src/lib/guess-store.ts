import { Store } from "@tanstack/store";

export type TGuess = {
	word: string;
	status: "correct" | "close" | "wrong";
};

export const guessStore = new Store<{ guesses: TGuess[] }>({
	guesses: [],
});

export const addGuess = (guess: TGuess) => {
	guessStore.setState((prev) => ({
		guesses: [...prev.guesses, guess],
	}));
};
