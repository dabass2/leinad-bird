import { Store } from "@tanstack/store";

export type TGuess = {
	word: string;
	status: "correct" | "close" | "wrong";
};

export const guessStore = new Store<{ guesses: TGuess[] }>({
	guesses: [],
});

const addGuess = (guess: TGuess) => {
	guessStore.setState((prev) => ({
		guesses: [...prev.guesses, guess],
	}));
};

// LocalStorage persistence helpers
const LS_KEY = "defy-guesses";

function loadGuesses(): TGuess[] {
	const stored = localStorage.getItem(LS_KEY);
	if (stored) {
		try {
			return JSON.parse(stored);
		} catch (e) {
			console.error("Failed to parse stored guesses:", e);
		}
	}
	return [];
}

function saveGuesses(state: { guesses: TGuess[] }) {
	localStorage.setItem(LS_KEY, JSON.stringify(state.guesses));
}

/**
 * Initializes the guess store by hydrating it from localStorage and
 * wiring up a subscriber to persist any future changes.
 *
 * Returns the array of guesses that were loaded (empty if none).
 */
export function initializeGuessStore(): TGuess[] {
	const guesses = loadGuesses();
	if (guesses.length > 0) {
		guessStore.setState(() => ({ guesses }));
	}
	// subscribe will return an unsubscribe but we don't need it here
	guessStore.subscribe(saveGuesses);
	return guesses;
}

export const GuessStore = {
	store: guessStore,
	addGuess,
	initialize: initializeGuessStore,
};
