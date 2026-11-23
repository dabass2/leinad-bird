import { Link, useNavigate } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "#/components/ui/alert-dialog";
import { Button } from "#/components/ui/button";
import { Spinner } from "#/components/ui/spinner";
import { diagramGenerators } from "#/lib/paint-diagrams";
import { forgetCanvasId, getKnownCanvasIds } from "#/lib/paint-storage";
import {
	deletePaintState,
	listPaintStates,
} from "#/routes/paint/-paint.functions";
import type { TSavedCanvas } from "#/types/paint";
import { PaintThumbnail } from "./PaintThumbnail";

// Size the template previews are generated at; the SVG scales them down
const PREVIEW_SIZE = { width: 600, height: 400 };

const relativeTime = new Intl.RelativeTimeFormat(undefined, {
	numeric: "auto",
});
const TIME_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
	["day", 86_400_000],
	["hour", 3_600_000],
	["minute", 60_000],
];

function formatUpdatedAt(updatedAt: number) {
	const diff = updatedAt - Date.now();
	for (const [unit, ms] of TIME_UNITS) {
		if (Math.abs(diff) >= ms)
			return relativeTime.format(Math.round(diff / ms), unit);
	}
	return "just now";
}

function DeleteCanvasButton({ onDelete }: { onDelete: () => void }) {
	return (
		<AlertDialog>
			<AlertDialogTrigger asChild>
				<Button size="icon-sm" variant="ghost" aria-label="Delete canvas">
					<Trash2 />
				</Button>
			</AlertDialogTrigger>
			<AlertDialogContent size="sm">
				<AlertDialogHeader>
					<AlertDialogTitle>Delete this canvas?</AlertDialogTitle>
					<AlertDialogDescription>This can't be undone.</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<AlertDialogAction variant="destructive" onClick={onDelete}>
						Delete
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}

export function PaintCanvasPicker() {
	const navigate = useNavigate();
	const [templates] = useState(() =>
		diagramGenerators.map((generator) => ({
			generator,
			regions: generator.generate(PREVIEW_SIZE.width, PREVIEW_SIZE.height),
		})),
	);
	const [canvases, setCanvases] = useState<TSavedCanvas[] | null>(null);
	const [loadError, setLoadError] = useState(false);

	useEffect(() => {
		let cancelled = false;
		listPaintStates({ data: { canvasIds: getKnownCanvasIds() } })
			.then((list) => !cancelled && setCanvases(list))
			.catch((err) => {
				console.error("Failed to list paint canvases", err);
				if (!cancelled) setLoadError(true);
			});
		return () => {
			cancelled = true;
		};
	}, []);

	const handleDelete = async (canvasId: string) => {
		try {
			await deletePaintState({ data: { canvasId } });
			forgetCanvasId(canvasId);
			setCanvases((prev) => prev?.filter((c) => c.id !== canvasId) ?? null);
		} catch (err) {
			console.error("Failed to delete paint canvas", err);
		}
	};

	return (
		<main className="page-wrap px-4 pb-8 pt-8">
			<h1 className="m-0 mb-3 text-3xl font-extrabold tracking-tight text-(--sea-ink)">
				New canvas
			</h1>
			<section className="grid gap-3 sm:grid-cols-3">
				{templates.map(({ generator, regions }) => (
					<button
						key={generator.id}
						type="button"
						onClick={() =>
							navigate({
								to: "/paint/$canvasId",
								params: { canvasId: crypto.randomUUID() },
								search: { template: generator.id },
							})
						}
						className="group cursor-pointer overflow-hidden rounded-2xl border border-(--line) bg-(--surface) text-left transition hover:-translate-y-0.5 hover:shadow-md"
					>
						<div className="aspect-3/2 border-b border-(--line)">
							<PaintThumbnail regions={regions} />
						</div>
						<div className="px-4 py-3 font-bold">{generator.name}</div>
					</button>
				))}
			</section>

			<h2 className="mt-8 mb-3 text-3xl font-extrabold tracking-tight text-(--sea-ink)">
				Your canvases
			</h2>
			{loadError ? (
				<p className="text-sm">Couldn't load your saved canvases.</p>
			) : canvases === null ? (
				<Spinner />
			) : canvases.length === 0 ? (
				<p className="text-sm text-(--sea-ink-soft)">
					Nothing saved yet. Canvases you save show up here.
				</p>
			) : (
				<section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
					{canvases.map(({ id, state, updatedAt }) => (
						<div
							key={id}
							className="overflow-hidden rounded-2xl border border-(--line) bg-(--surface) transition hover:-translate-y-0.5 hover:shadow-md"
						>
							<Link
								to="/paint/$canvasId"
								params={{ canvasId: id }}
								className="block aspect-3/2 border-b border-(--line)"
								aria-label={`Open canvas updated ${formatUpdatedAt(updatedAt)}`}
							>
								<PaintThumbnail {...state} />
							</Link>
							<div className="flex items-center justify-between gap-2 py-2 pr-2 pl-4 text-sm">
								<span>
									{state.regions.length} regions · {formatUpdatedAt(updatedAt)}
								</span>
								<DeleteCanvasButton onDelete={() => handleDelete(id)} />
							</div>
						</div>
					))}
				</section>
			)}
		</main>
	);
}
