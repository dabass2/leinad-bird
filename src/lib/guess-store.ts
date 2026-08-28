import { Store } from "@tanstack/store";
import type { TGuess } from "#/types/defy";
import { getCurrentFormattedDate } from "./utils";

export type TGuessStore = {
	guesses: TGuess[];
	hintsUsed: number;
	gameOver: boolean;
	gameOverDate?: string;
	gameWon: boolean;
	streak: number;
};

const defaultState: TGuessStore = {
	guesses: [],
	hintsUsed: 0,
	gameOver: false,
	gameOverDate: undefined,
	gameWon: false,
	streak: 0,
};

export const guessStore = new Store<TGuessStore>(defaultState);

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

export const setGameOver = (won: boolean) => {
	guessStore.setState((prev) => ({
		...prev,
		gameOver: true,
		gameWon: won,
		gameOverDate: getCurrentFormattedDate(),
		streak: won ? prev.streak + 1 : 0,
	}));
};

export const clearGameState = () => {
	guessStore.setState((prev) => ({ ...defaultState, streak: prev.streak }));
};

// Sync changes to localStorage whenever the store updates
guessStore.subscribe(() => {
	localStorage.setItem("defy-game-state", JSON.stringify(guessStore.state));
});

// To rehydrate on load (before the app mounts)
if (typeof window !== "undefined") {
	const storedState = localStorage.getItem("defy-game-state") as string;
	const parsedState = JSON.parse(storedState);
	const oldSate = parsedState?.gameOverDate !== getCurrentFormattedDate();
	if (parsedState && !oldSate) {
		guessStore.setState(parsedState);
	} else if (oldSate) {
		clearGameState();
	}
}
