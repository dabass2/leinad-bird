export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "theme";

/**
 * Runs inline in <head> before first paint so the page never flashes the wrong
 * palette. An explicit choice in localStorage wins; otherwise follow the OS.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var s=localStorage.getItem('${THEME_STORAGE_KEY}');var t=(s==='light'||s==='dark')?s:(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');var r=document.documentElement;r.classList.remove('light','dark');r.classList.add(t);r.style.colorScheme=t;}catch(e){}})();`;

export function getStoredTheme(): Theme | null {
	try {
		const stored = localStorage.getItem(THEME_STORAGE_KEY);
		return stored === "light" || stored === "dark" ? stored : null;
	} catch {
		return null;
	}
}

export function getSystemTheme(): Theme {
	return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function getAppliedTheme(): Theme {
	return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export function applyTheme(theme: Theme) {
	const root = document.documentElement;
	root.classList.remove("light", "dark");
	root.classList.add(theme);
	root.style.colorScheme = theme;
}

export function storeTheme(theme: Theme) {
	try {
		localStorage.setItem(THEME_STORAGE_KEY, theme);
	} catch {
		// Private mode or blocked storage: the toggle still works for this visit.
	}
}
