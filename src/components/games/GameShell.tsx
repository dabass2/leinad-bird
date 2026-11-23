import { Link } from "@tanstack/react-router";
import { ArrowLeft, RotateCcw } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "#/components/ui/button";

type GameShellProps = {
	title: string;
	description: string;
	/** Whose turn it is, the score, the result: one short line. */
	status: ReactNode;
	onNewGame: () => void;
	/** Extra controls next to "New game", like the opponent picker. */
	controls?: ReactNode;
	children: ReactNode;
};

/** The frame every game page shares: back link, title, status line and controls. */
export function GameShell({
	title,
	description,
	status,
	onNewGame,
	controls,
	children,
}: GameShellProps) {
	return (
		<main className="page-wrap px-4 pt-6 pb-10">
			<Link
				to="/games"
				className="inline-flex items-center gap-1 text-sm font-semibold text-(--sea-ink-soft)! no-underline hover:underline"
			>
				<ArrowLeft className="size-4" /> All games
			</Link>

			<header className="mt-3 mb-5 flex flex-wrap items-end justify-between gap-4">
				<div>
					<h1 className="m-0 text-4xl font-extrabold tracking-tight text-(--sea-ink)">
						{title}
					</h1>
					<p className="mt-1 mb-0 max-w-md text-sm text-(--sea-ink-soft)">
						{description}
					</p>
				</div>
				<div className="flex flex-wrap items-center gap-2">
					{controls}
					<Button variant="outline" onClick={onNewGame}>
						<RotateCcw /> New game
					</Button>
				</div>
			</header>

			<p
				aria-live="polite"
				className="mt-0 mb-4 min-h-7 text-center text-lg font-bold text-(--sea-ink)"
			>
				{status}
			</p>

			<div className="flex justify-center">{children}</div>
		</main>
	);
}
