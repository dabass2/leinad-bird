import { Moon, Sun } from "lucide-react";
import { useTheme } from "#/hooks/useTheme";

export default function ThemeToggle() {
	const { theme, toggleTheme } = useTheme();
	const isDark = theme === "dark";
	const label = isDark ? "Switch to light mode" : "Switch to dark mode";

	return (
		<button
			type="button"
			onClick={toggleTheme}
			aria-label={label}
			aria-pressed={isDark}
			title={label}
			className="inline-flex size-9 cursor-pointer items-center justify-center rounded-full border border-(--chip-line) bg-(--chip-bg) text-(--sea-ink) shadow-(--chip-shadow) transition hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--ring)"
		>
			{isDark ? (
				<Sun className="size-4" aria-hidden />
			) : (
				<Moon className="size-4" aria-hidden />
			)}
		</button>
	);
}
