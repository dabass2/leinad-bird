import { useCallback, useSyncExternalStore } from "react";
import {
	applyTheme,
	getAppliedTheme,
	getStoredTheme,
	getSystemTheme,
	storeTheme,
	type Theme,
} from "#/lib/theme";

// The <html> class is the source of truth (the init script sets it before
// hydration), so subscribe to it rather than mirroring it in React state.
function subscribe(onChange: () => void) {
	const observer = new MutationObserver(onChange);
	observer.observe(document.documentElement, {
		attributes: true,
		attributeFilter: ["class"],
	});

	// With no explicit choice saved, keep following the OS setting live.
	const media = matchMedia("(prefers-color-scheme: dark)");
	const onSystemChange = () => {
		if (!getStoredTheme()) applyTheme(getSystemTheme());
	};
	media.addEventListener("change", onSystemChange);

	return () => {
		observer.disconnect();
		media.removeEventListener("change", onSystemChange);
	};
}

export function useTheme() {
	const theme = useSyncExternalStore<Theme>(
		subscribe,
		getAppliedTheme,
		() => "light",
	);

	const setTheme = useCallback((next: Theme) => {
		applyTheme(next);
		storeTheme(next);
	}, []);

	const toggleTheme = useCallback(() => {
		setTheme(getAppliedTheme() === "dark" ? "light" : "dark");
	}, [setTheme]);

	return { theme, setTheme, toggleTheme };
}
