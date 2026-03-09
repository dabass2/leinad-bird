import { Store } from "@tanstack/store";

export type TGuessStore = {
	guesses: TGuess[];
	hintsUsed: number;
	gameOver: boolean;
};

export type TGuess = {
	word: string;
	status: "correct" | "close" | "wrong";
};

export const guessStore = new Store<TGuessStore>({
	guesses: [],
	hintsUsed: 0,
	gameOver: false,
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

export const setGameOver = () => {
	guessStore.setState((prev) => ({
		...prev,
		gameOver: true,
	}));
};

// Sync changes to localStorage whenever the store updates
guessStore.subscribe(() => {
	localStorage.setItem("defy-user-state", JSON.stringify(guessStore.state));
});

// To rehydrate on load (before the app mounts)
const storedState = localStorage.getItem("defy-user-state");
if (storedState) {
	guessStore.setState(JSON.parse(storedState));
}
