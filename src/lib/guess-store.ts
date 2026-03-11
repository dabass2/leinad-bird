import type { TGuess } from "#/types/defy";
import { Store } from "@tanstack/store";
import { getCurrentFormattedDate } from "./utils";

export type TGuessStore = {
	guesses: TGuess[];
	hintsUsed: number;
	gameOver: boolean;
  gameOverDate?: string;
};

const defaultState = {
	guesses: [],
	hintsUsed: 0,
	gameOver: false,
  gameOverDate: undefined,
}

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

export const setGameOver = () => {
	guessStore.setState((prev) => ({
		...prev,
		gameOver: true,
    gameOverDate: getCurrentFormattedDate()
	}));
};

export const clearGameState = () => {
  guessStore.setState(() => defaultState)
}

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
    clearGameState()
  }
}
