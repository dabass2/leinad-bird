import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({ component: App });

function App() {
	return (
		<main className="page-wrap px-4 pb-8 pt-14">
			<section className="island-shell rise-in relative overflow-hidden rounded-4xl px-6 py-10 sm:px-10 sm:py-14">
				<div className="pointer-events-none absolute -left-20 -top-24 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(79,184,178,0.32),transparent_66%)]" />
				<div className="pointer-events-none absolute -bottom-20 -right-20 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(47,106,74,0.18),transparent_66%)]" />
				<p className="island-kicker mb-3">bad ideas really dumb</p>
				<h1 className="display-title mb-5 max-w-3xl text-4xl leading-[1.02] font-bold tracking-tight text-(--sea-ink) sm:text-6xl">
					leinad bird
				</h1>
				<p className="mb-8 max-w-2xl text-base text-(--sea-ink-soft) sm:text-lg">
					Collection of side projects and experiments that I decide to build and
					open source for fun. Built with TanStack Router, React, Tailwind, and
					a bunch of other stuff.
				</p>
			</section>

			<section className="mt-8 grid gap-4 sm:grid-cols-2">
				{[
					[
						"defy",
						"A word game where you have to guess the word of the day from only its definitions and synonyms.",
					],
					[
						"typers",
						"A typing game where words fall from the top of the screen and you have to type them before they reach the bottom.",
					],
				].map(([title, desc], index) => (
					<article
						key={title}
						className="island-shell feature-card rise-in rounded-2xl p-5"
						style={{ animationDelay: `${index * 90 + 80}ms` }}
					>
						<h2 className="mb-2 text-base font-semibold text-(--sea-ink)">
							{title}
						</h2>
						<p className="m-0 text-sm text-(--sea-ink-soft)">{desc}</p>
					</article>
				))}
			</section>

			<section className="island-shell mt-8 rounded-2xl p-6">
				<p className="island-kicker mb-2">Quick Start</p>
				<ul className="m-0 list-disc space-y-2 pl-5 text-sm text-(--sea-ink-soft)">
					<li>Check out bird</li>
					<li>Check out defy</li>
					<li>Check out the other stuff</li>
				</ul>
			</section>
		</main>
	);
}
