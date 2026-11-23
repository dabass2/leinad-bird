import { Delaunay } from "d3-delaunay";
import type { TDiagramGenerator, TRegion } from "#/types/paint";

const randomNumber = () => Math.floor(Math.random() * 5) + 1;

export const voronoiGenerator: TDiagramGenerator = {
	id: "voronoi",
	name: "Voronoi",
	generate: (width, height) => {
		const numPoints = 50;
		const padding = 50;
		const innerWidth = Math.max(100, width - padding * 2);
		const innerHeight = Math.max(100, height - padding * 2);

		const seeds = Array.from(
			{ length: numPoints },
			() =>
				[
					padding + Math.random() * innerWidth,
					padding + Math.random() * innerHeight,
				] as [number, number],
		);

		const voronoi = Delaunay.from(seeds).voronoi([
			padding,
			padding,
			padding + innerWidth,
			padding + innerHeight,
		]);

		const stamp = Date.now();
		const regions: TRegion[] = [];
		for (let i = 0; i < numPoints; i++) {
			const polygon = voronoi.cellPolygon(i);
			if (!polygon) continue;

			// cellPolygon repeats the first point at the end; drop it
			const points: number[] = [];
			for (let j = 0; j < polygon.length - 1; j++) {
				points.push(polygon[j][0], polygon[j][1]);
			}

			regions.push({
				id: `voronoi-${stamp}-${i}`,
				number: randomNumber(),
				labelPosition: { x: seeds[i][0], y: seeds[i][1] },
				points,
			});
		}
		return regions;
	},
};

export const gridGenerator: TDiagramGenerator = {
	id: "grid",
	name: "Grid",
	generate: (width, height) => {
		const cols = 8;
		const rows = 6;
		const cellWidth = width / cols;
		const cellHeight = height / rows;

		const stamp = Date.now();
		const regions: TRegion[] = [];
		for (let row = 0; row < rows; row++) {
			for (let col = 0; col < cols; col++) {
				const x = col * cellWidth;
				const y = row * cellHeight;
				regions.push({
					id: `grid-${stamp}-${row * cols + col}`,
					number: randomNumber(),
					labelPosition: { x: x + cellWidth / 2, y: y + cellHeight / 2 },
					points: [
						x,
						y,
						x + cellWidth,
						y,
						x + cellWidth,
						y + cellHeight,
						x,
						y + cellHeight,
					],
				});
			}
		}
		return regions;
	},
};

export const diagramGenerators: TDiagramGenerator[] = [
	voronoiGenerator,
	gridGenerator,
];

export const defaultDiagramGenerator = voronoiGenerator;

export const PAINT_MAX_DIAGRAM_SIZE = { width: 1200, height: 800 } as const;
export const PAINT_BRUSH_BOUNDS = { min: 5, max: 100, step: 5 } as const;
export const PAINT_OUTLINE_COLOR = "#404945";
