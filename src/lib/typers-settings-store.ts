import { Store } from "@tanstack/store";
import {
	DEFAULT_DIFFICULTY,
	DEFAULT_TIME_LENGTH_SECONDS,
	type TDifficulty,
} from "./typers-settings";

export type TTypersSettingsStore = {
	difficulty: TDifficulty;
	timeLengthSeconds: number;
	endlessMode: boolean;
};

export const typersSettingsStore = new Store<TTypersSettingsStore>({
	difficulty: DEFAULT_DIFFICULTY,
	timeLengthSeconds: DEFAULT_TIME_LENGTH_SECONDS,
	endlessMode: false,
});

export const setDifficulty = (difficulty: TDifficulty) => {
	typersSettingsStore.setState((prev) => ({
		...prev,
		difficulty,
	}));
};

export const setTimeLengthSeconds = (timeLengthSeconds: number) => {
	typersSettingsStore.setState((prev) => ({
		...prev,
		timeLengthSeconds,
	}));
};

export const setEndlessMode = (endlessMode: boolean) => {
	typersSettingsStore.setState((prev) => ({
		...prev,
		endlessMode,
	}));
};

// Sync changes to localStorage whenever the store updates
typersSettingsStore.subscribe(() => {
	localStorage.setItem(
		"typers-settings-state",
		JSON.stringify(typersSettingsStore.state),
	);
});

// To rehydrate on load (before the app mounts)
if (typeof window !== "undefined") {
	const storedState = localStorage.getItem("typers-settings-state");
	if (storedState) {
		typersSettingsStore.setState(JSON.parse(storedState));
	}
}
