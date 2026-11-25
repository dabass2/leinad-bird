import { Link } from "@tanstack/react-router";
import { Code, Globe, Tag } from "lucide-react";
import { useInView } from "#/hooks/useInView";
import { cn } from "#/lib/utils";

// Simple Icons slugs (svgs in p`ublic/brand-icons). Tech without one falls back to a tag.
const TECH_ICONS: Record<string, string> = {
	React: "react",
	TanStack: "tanstack",
	Tailwind: "tailwindcss",
	"Node.js": "nodedotjs",
	Express: "express",
	MongoDB: "mongodb",
	"Discord.js": "discorddotjs",
	Konva: "konva",
	JavaScript: "javascript",
	Vue: "vuedotjs",
	Vuetify: "vuetify",
	"p5.js": "p5dotjs",
	MySQL: "mysql",
};

function TechIcon({ tech }: { tech: string }) {
	const slug = TECH_ICONS[tech];
	if (!slug) return <Tag className="size-3" aria-hidden />;

	// Masked instead of <img> so the icon takes the chip's text color on light and image cards.
	const url = `url(${import.meta.env.BASE_URL}brand-icons/${slug}.svg)`;
	return (
		<span
			aria-hidden
			className="size-3 bg-current"
			style={{
				maskImage: url,
				maskSize: "contain",
				maskRepeat: "no-repeat",
				maskPosition: "center",
			}}
		/>
	);
}

interface ProjectCardProps {
	title: string;
	description: string;
	color: string;
	tech: string[];
	siteUrl?: string;
	sourceUrl?: string;
	image?: string;
	className?: string;
}

export default function ProjectCard({
	title,
	description,
	color,
	tech,
	siteUrl,
	sourceUrl,
	image,
	className,
}: ProjectCardProps) {
	const [ref, inView] = useInView<HTMLElement>();
	// Image cards get a dark scrim, so everything on them flips to light text.
	const onImage = Boolean(image);
	// Text colors are `!important` because the unlayered global `a` color in
	// styles.css otherwise wins over Tailwind's layered utilities.
	const pill =
		"inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold no-underline [text-shadow:none] transition hover:-translate-y-px";
	const solidPill = onImage
		? "bg-white text-black! shadow-md hover:bg-white/90"
		: "bg-(--tile-solid-bg) text-(--tile-solid-ink)! hover:bg-(--tile-solid-hover)";
	const outlinePill = onImage
		? "border border-white/70 bg-black/50 text-white! hover:bg-black/70"
		: "border border-(--tile-outline-line) text-(--sea-ink)! hover:bg-(--tile-outline-hover)";

	return (
		<article
			ref={ref}
			className={cn(
				"reveal relative flex min-h-64 flex-col justify-end overflow-hidden rounded-2xl p-5",
				inView && "is-visible",
				onImage ? "bg-black text-white" : "text-(--sea-ink)",
				className,
			)}
			style={onImage ? undefined : { backgroundColor: color }}
		>
			{image && (
				<>
					{/* Only fetched once the card scrolls into view. */}
					<img
						src={inView ? image : undefined}
						alt=""
						decoding="async"
						className="absolute inset-0 h-full w-full object-cover"
					/>
					<div className="absolute inset-0 bg-linear-to-t from-black via-black/40 to-transparent" />
				</>
			)}

			<div
				className={cn(
					"relative",
					// Soft shadow lifts the text off busy, light screenshots.
					onImage && "[text-shadow:0_1px_6px_rgb(0_0_0/0.45)]",
				)}
			>
				<h3 className="m-0 text-xl font-extrabold tracking-tight">{title}</h3>
				<p
					className={cn(
						"mt-1 mb-3 max-w-md text-sm",
						onImage ? "text-white" : "text-(--sea-ink-soft)",
					)}
				>
					{description}
				</p>

				<ul className="m-0 mb-4 flex list-none flex-wrap gap-1.5 p-0">
					{tech.map((t) => (
						<li
							key={t}
							className={cn(
								"inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[0.7rem] font-semibold",
								onImage
									? "border-white/40 bg-black/50"
									: "border-(--tile-chip-line) bg-(--tile-chip-bg)",
							)}
						>
							<TechIcon tech={t} />
							{t}
						</li>
					))}
				</ul>

				<div className="flex flex-wrap gap-2">
					{siteUrl &&
						(siteUrl.startsWith("/") ? (
							<Link to={siteUrl} className={cn(pill, solidPill)}>
								<Globe className="size-3.5" aria-hidden />
								Visit site
							</Link>
						) : (
							<a
								href={siteUrl}
								target="_blank"
								rel="noreferrer"
								className={cn(pill, solidPill)}
							>
								<Globe className="size-3.5" aria-hidden />
								Visit site
							</a>
						))}
					{sourceUrl && (
						<a
							href={sourceUrl}
							target="_blank"
							rel="noreferrer"
							className={cn(pill, outlinePill)}
						>
							<Code className="size-3.5" aria-hidden />
							Code
						</a>
					)}
				</div>
			</div>
		</article>
	);
}
