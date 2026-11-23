import { useId } from "react";
import { PAINT_OUTLINE_COLOR } from "#/lib/paint-diagrams";
import type { TPaintState } from "#/types/paint";

const THUMBNAIL_BG = "#ffffff";

const toPath = (points: number[], closed: boolean) => {
	let d = "";
	for (let i = 0; i < points.length; i += 2) {
		d += `${i === 0 ? "M" : "L"}${points[i]} ${points[i + 1]}`;
	}
	return closed ? `${d}Z` : d;
};

/** Static SVG preview of a canvas, scaled to fit its container. */
export function PaintThumbnail({
	regions,
	strokes = [],
	fills = {},
}: Partial<Pick<TPaintState, "strokes" | "fills">> &
	Pick<TPaintState, "regions">) {
	const clipPrefix = useId();

	// Fit the view to the drawing itself; generators may leave margins
	let minX = Number.POSITIVE_INFINITY;
	let minY = Number.POSITIVE_INFINITY;
	let maxX = Number.NEGATIVE_INFINITY;
	let maxY = Number.NEGATIVE_INFINITY;
	for (const { points } of regions) {
		for (let i = 0; i < points.length; i += 2) {
			minX = Math.min(minX, points[i]);
			minY = Math.min(minY, points[i + 1]);
			maxX = Math.max(maxX, points[i]);
			maxY = Math.max(maxY, points[i + 1]);
		}
	}
	if (!Number.isFinite(minX)) {
		minX = minY = 0;
		maxX = maxY = 1;
	}
	const width = Math.max(1, maxX - minX);
	const height = Math.max(1, maxY - minY);
	const pad = Math.max(width, height) * 0.02;
	const viewBox = {
		x: minX - pad,
		y: minY - pad,
		width: width + pad * 2,
		height: height + pad * 2,
	};

	return (
		<svg
			viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
			preserveAspectRatio="xMidYMid meet"
			className="h-full w-full"
			aria-hidden="true"
		>
			<rect {...viewBox} fill={THUMBNAIL_BG} />
			{regions.map((region) => {
				const d = toPath(region.points, true);
				const clipId = `${clipPrefix}-${region.id}`;
				const regionStrokes = strokes.filter((s) => s.regionId === region.id);
				return (
					<g key={region.id}>
						{fills[region.id] && <path d={d} fill={fills[region.id]} />}
						{regionStrokes.length > 0 && (
							<>
								<clipPath id={clipId}>
									<path d={d} />
								</clipPath>
								<g clipPath={`url(#${clipId})`}>
									{regionStrokes.map((stroke) => (
										<path
											key={stroke.id}
											d={toPath(stroke.points, false)}
											fill="none"
											// The eraser cuts through fills too, down to the background
											stroke={stroke.isEraser ? THUMBNAIL_BG : stroke.color}
											strokeWidth={stroke.strokeWidth}
											strokeLinecap="round"
											strokeLinejoin="round"
										/>
									))}
								</g>
							</>
						)}
					</g>
				);
			})}
			{regions.map((region) => (
				<path
					key={`outline-${region.id}`}
					d={toPath(region.points, true)}
					fill="none"
					stroke={PAINT_OUTLINE_COLOR}
					strokeWidth={3}
					strokeLinejoin="round"
				/>
			))}
		</svg>
	);
}
