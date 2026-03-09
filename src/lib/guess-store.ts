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

// Sync changes to localStorage whenever the store updates
guessStore.subscribe(() => {
	localStorage.setItem("defy-user-state", JSON.stringify(guessStore.state));
});

// To rehydrate on load (before the app mounts)
const storedState = localStorage.getItem("defy-user-state");
if (storedState) {
	guessStore.setState(JSON.parse(storedState));
}
