import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({ component: App });

function App() {
	return (
		<main className="page-wrap px-4 pb-8 pt-14">
			<section className="island-shell rise-in relative overflow-hidden rounded-[2rem] px-6 py-10 sm:px-10 sm:py-14">
				<div className="pointer-events-none absolute -left-20 -top-24 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(79,184,178,0.32),transparent_66%)]" />
				<div className="pointer-events-none absolute -bottom-20 -right-20 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(47,106,74,0.18),transparent_66%)]" />
				<p className="island-kicker mb-3">I haven't done anything here yet</p>
				<h1 className="display-title mb-5 max-w-3xl text-4xl leading-[1.02] font-bold tracking-tight text-[var(--sea-ink)] sm:text-6xl">
					This is the home page and will have more stuff
				</h1>
				<p className="mb-8 max-w-2xl text-base text-[var(--sea-ink-soft)] sm:text-lg">
					Please leave the page there really isn't anything here I need to
					actually migrate bird and all the other random things I've made to
					this new repo
				</p>
			</section>

			<section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				{[
					[
						"Type-Safe Routing",
						"Routes and links stay in sync across every page.",
					],
					[
						"Server Functions",
						"Call server code from your UI without creating API boilerplate.",
					],
					[
						"Streaming by Default",
						"Ship progressively rendered responses for faster experiences.",
					],
					[
						"Tailwind Native",
						"Design quickly with utility-first styling and custom tokens.",
					],
				].map(([title, desc], index) => (
					<article
						key={title}
						className="island-shell feature-card rise-in rounded-2xl p-5"
						style={{ animationDelay: `${index * 90 + 80}ms` }}
					>
						<h2 className="mb-2 text-base font-semibold text-[var(--sea-ink)]">
							{title}
						</h2>
						<p className="m-0 text-sm text-[var(--sea-ink-soft)]">{desc}</p>
					</article>
				))}
			</section>

			<section className="island-shell mt-8 rounded-2xl p-6">
				<p className="island-kicker mb-2">Quick Start</p>
				<ul className="m-0 list-disc space-y-2 pl-5 text-sm text-[var(--sea-ink-soft)]">
					<li>Check out bird</li>
					<li>Check out defy</li>
					<li>Check out the other stuff</li>
				</ul>
			</section>
		</main>
	);
}
