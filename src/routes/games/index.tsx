import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Users } from "lucide-react";
import { GAMES } from "#/lib/games/catalog";

export const Route = createFileRoute("/games/")({ component: GamesIndex });

const CARD_COLORS = [
	"var(--tile-1)",
	"var(--tile-2)",
	"var(--tile-3)",
	"var(--tile-4)",
];

function GamesIndex() {
	return (
		<main className="page-wrap px-4 pt-8 pb-10">
			<h1 className="m-0 text-4xl font-extrabold tracking-tight text-(--sea-ink)">
				Games
			</h1>
			<p className="mt-1 mb-6 text-sm text-(--sea-ink-soft)">
				Small games for a quick break.
			</p>

			<section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
				{GAMES.map((game, i) => (
					<Link
						key={game.to}
						to={game.to}
						className="group flex min-h-40 flex-col justify-between rounded-2xl p-5 text-(--sea-ink)! no-underline transition hover:-translate-y-0.5"
						style={{ backgroundColor: CARD_COLORS[i % CARD_COLORS.length] }}
					>
						<div>
							<h2 className="m-0 text-xl font-extrabold tracking-tight">
								{game.title}
							</h2>
							<p className="mt-1 mb-0 text-sm text-(--sea-ink-soft)">
								{game.description}
							</p>
						</div>
						<div className="mt-4 flex items-center justify-between text-xs font-bold">
							<span className="inline-flex items-center gap-1.5 rounded-full border border-(--tile-chip-line) bg-(--tile-chip-bg) px-2 py-0.5">
								<Users className="size-3" /> {game.players}
							</span>
							<ArrowRight className="size-5 transition group-hover:translate-x-1" />
						</div>
					</Link>
				))}
			</section>
		</main>
	);
}
