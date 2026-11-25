import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import ProjectCard from "#/components/ProjectCard";
import { useInView } from "#/hooks/useInView";
import { PROJECTS } from "#/lib/projects";

export const Route = createFileRoute("/")({ component: App });

const CARD_COLORS = [
	"var(--tile-1)",
	"var(--tile-2)",
	"var(--tile-3)",
	"var(--tile-4)",
];

const NAMES = ["Leinad", "Daniel"];

// Icons are Simple Icons svgs in public/brand-icons.
const SOCIALS = [
	{ label: "GitHub", href: "https://github.com/dabass2", icon: "github" },
	{
		label: "LinkedIn",
		href: "https://www.linkedin.com/in/daniel-bass-16204617b/",
		icon: "linkedin",
	},
];

function NameSwap() {
	const [swaps, setSwaps] = useState(0);

	useEffect(() => {
		const id = setInterval(() => setSwaps((n) => n + 1), 6000);
		return () => clearInterval(id);
	}, []);

	const name = NAMES[swaps % NAMES.length];

	return (
		<h1
			aria-label="Leinad"
			className="m-0 text-7xl leading-[0.85] font-extrabold tracking-tighter sm:text-9xl"
		>
			{/* Keyed by name so every letter remounts and replays the flip on each swap. */}
			{[...name].map((letter, i) => (
				<span
					key={`${name}-${i}`}
					aria-hidden
					// No flip on first paint; the hero already rises in.
					className={swaps === 0 ? "inline-block" : "letter-flip"}
					style={{ animationDelay: `${i * 110}ms` }}
				>
					{letter}
				</span>
			))}
		</h1>
	);
}

function App() {
	const [headingRef, headingInView] = useInView<HTMLHeadingElement>();

	return (
		<main className="page-wrap px-4 pb-8 pt-8">
			<section className="rise-in relative flex min-h-72 flex-col justify-between overflow-hidden rounded-3xl bg-(--hero-shade) px-6 py-6 text-(--hero-text) sm:min-h-96 sm:px-10 sm:py-8">
				<img
					src={`${import.meta.env.BASE_URL}home/home.webp`}
					alt=""
					decoding="async"
					className="absolute inset-0 h-full w-full object-cover"
				/>
				<div className="absolute inset-0 bg-linear-to-t from-(--hero-shade) via-(--hero-shade)/40 to-transparent" />

				<div className="relative flex justify-end gap-2">
					{SOCIALS.map(({ label, href, icon }) => (
						<button
							key={label}
							type="button"
							onClick={() => window.open(href, "_blank", "noopener,noreferrer")}
							className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-(--hero-text) bg-(--hero-text) px-4 py-2 text-sm font-bold text-(--hero-shade) hover:brightness-110"
						>
							<img
								src={`${import.meta.env.BASE_URL}brand-icons/${icon}.svg`}
								alt=""
								className="size-4"
							/>
							{label}
						</button>
					))}
				</div>

				<div className="relative mt-16 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
					<NameSwap />
					<p className="m-0 max-w-64 text-sm font-medium text-(--hero-text)/85">
						Software engineer in Chicago, building whatever comes to mind.
					</p>
				</div>
			</section>

			<h2
				ref={headingRef}
				className={`reveal ${headingInView ? "is-visible" : ""} mt-8 mb-3 text-3xl font-extrabold tracking-tight text-(--sea-ink)`}
			>
				Projects
			</h2>

			<section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
				{PROJECTS.map((project, index) => (
					<ProjectCard
						key={project.title}
						{...project}
						color={CARD_COLORS[index % CARD_COLORS.length]}
						className={project.wide ? "lg:col-span-2" : undefined}
					/>
				))}
			</section>
		</main>
	);
}
