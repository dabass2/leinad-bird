import { Container, Graphics } from "pixi.js";
import type { TerrainMap } from "./tiled";

/**
 * The contents of terrain.json: everything the game knows about each terrain.
 * The order of the entries is the drawing order: the first terrain is the
 * ground everywhere, and each later one is drawn on top of the ones before it.
 */
export type TerrainRules = Record<string, { name: string; color: string }>;

/** How many times outlines are smoothed. More gives gentler curves. */
const SMOOTHING_PASSES = 6;
/** Corner-cutting rounds after smoothing, so curves have no visible facets. */
const ROUNDING_PASSES = 2;
/** Tiles copied past the map edge, so shapes run off it instead of curving. */
const PAD = 4;

/** A filled region: its outline and any holes, as flat [x0, y0, ...] lists. */
export interface TerrainShape {
	outline: number[];
	holes: number[][];
}

export interface TerrainLayer {
	terrain: string;
	shapes: TerrainShape[];
}

/**
 * Turns the tile grid into smooth outlines, one layer per terrain after the
 * ground, in drawing order and in map pixels. The grid itself is unchanged;
 * this only decides how it looks. Shapes can spill past the map edge, so
 * draw them clipped to the map.
 */
export function terrainLayers(
	map: TerrainMap,
	order: string[],
): TerrainLayer[] {
	const rank = new Map(order.map((t, i) => [t, i]));
	const ranks = map.cells.map((t) => {
		const r = rank.get(t);
		if (r === undefined) throw new Error(`terrain.json has no "${t}".`);
		return r;
	});

	const layers: TerrainLayer[] = [];
	for (let layer = 1; layer < order.length; layer++) {
		// A layer also covers the ground under every layer drawn above it, so
		// two terrains that touch never leave a sliver of ground between them.
		const inside = ranks.map((r) => r >= layer);
		if (!inside.includes(true)) continue;
		layers.push({
			terrain: order[layer],
			shapes: traceShapes(map, inside),
		});
	}
	return layers;
}

/** Draws the map's terrain with Pixi, in map pixels, clipped to the map. */
export function drawTerrain(map: TerrainMap, rules: TerrainRules): Container {
	const order = Object.keys(rules);
	const width = map.width * map.tileSize;
	const height = map.height * map.tileSize;

	const g = new Graphics();
	g.rect(0, 0, width, height).fill(rules[order[0]].color);
	for (const { terrain, shapes } of terrainLayers(map, order)) {
		const color = rules[terrain].color;
		for (const { outline, holes } of shapes) {
			g.poly(outline).fill(color);
			for (const hole of holes) g.poly(hole).cut();
		}
	}

	const clip = new Graphics().rect(0, 0, width, height).fill(0xffffff);
	const terrain = new Container();
	terrain.addChild(g, clip);
	g.mask = clip;
	return terrain;
}

// ---- Tracing ----------------------------------------------------------------

type Point = { x: number; y: number };

/**
 * A traced outline: the midpoints of its tile edges, and the area of the tile
 * outline itself (positive for outlines, negative for holes), in tiles.
 */
type Loop = { points: Point[]; area: number };

/** Finds the outlines of the inside tiles and smooths them into shapes. */
function traceShapes(map: TerrainMap, inside: boolean[]): TerrainShape[] {
	// Loops go clockwise on screen around inside tiles, so outlines have a
	// positive area and holes (inside tiles all around them) a negative one.
	const loops = traceLoops(map, inside);
	const shapes = loops
		.filter((l) => l.area > 0)
		.map((outline) => ({ outline, holes: [] as Loop[] }));

	for (const hole of loops.filter((l) => l.area < 0)) {
		// The hole belongs to the smallest outline that contains it.
		let owner: (typeof shapes)[number] | undefined;
		for (const shape of shapes) {
			if (
				contains(shape.outline.points, hole.points[0]) &&
				(!owner || shape.outline.area < owner.outline.area)
			) {
				owner = shape;
			}
		}
		owner?.holes.push(hole);
	}

	const toPixels = (loop: Loop) =>
		smooth(loop).flatMap((p) => [
			(p.x - PAD) * map.tileSize,
			(p.y - PAD) * map.tileSize,
		]);
	return shapes.map((s) => ({
		outline: toPixels(s.outline),
		holes: s.holes.map(toPixels),
	}));
}

/**
 * Walks the edges between inside and outside tiles into closed loops, in a
 * grid padded by PAD tiles that copy the map's edge. Each loop is returned as
 * the midpoints of its tile edges, which already turns 45-degree staircases
 * into straight diagonals.
 */
function traceLoops(map: TerrainMap, inside: boolean[]): Loop[] {
	const w = map.width + PAD * 2;
	const h = map.height + PAD * 2;
	const at = (x: number, y: number) => {
		if (x < 0 || y < 0 || x >= w || y >= h) return false;
		const mx = Math.min(map.width - 1, Math.max(0, x - PAD));
		const my = Math.min(map.height - 1, Math.max(0, y - PAD));
		return inside[my * map.width + mx];
	};

	// Every boundary edge, going clockwise on screen around its inside tile,
	// keyed by its start corner. A corner can start two edges where two
	// inside tiles touch only diagonally.
	const key = (x: number, y: number) => y * (w + 1) + x;
	const edges = new Map<number, Point[]>();
	const addEdge = (x0: number, y0: number, x1: number, y1: number) => {
		const list = edges.get(key(x0, y0)) ?? [];
		list.push({ x: x1 - x0, y: y1 - y0 });
		edges.set(key(x0, y0), list);
	};
	for (let y = 0; y < h; y++) {
		for (let x = 0; x < w; x++) {
			if (!at(x, y)) continue;
			if (!at(x, y - 1)) addEdge(x, y, x + 1, y);
			if (!at(x + 1, y)) addEdge(x + 1, y, x + 1, y + 1);
			if (!at(x, y + 1)) addEdge(x + 1, y + 1, x, y + 1);
			if (!at(x - 1, y)) addEdge(x, y + 1, x, y);
		}
	}

	const loops: Loop[] = [];
	for (const [startKey, starts] of edges) {
		while (starts.length > 0) {
			let x = startKey % (w + 1);
			let y = Math.floor(startKey / (w + 1));
			let dir = starts.pop() as Point;
			const points: Point[] = [];
			let area = 0;
			for (;;) {
				points.push({ x: x + dir.x / 2, y: y + dir.y / 2 });
				area += (x * (y + dir.y) - (x + dir.x) * y) / 2;
				x += dir.x;
				y += dir.y;
				if (key(x, y) === startKey) break;
				const next = edges.get(key(x, y));
				if (!next || next.length === 0) break;
				// Where two edges leave a corner, turn right to hug the
				// current tile, so diagonal neighbors stay separate shapes.
				const right = { x: -dir.y, y: dir.x };
				const i = next.findIndex((d) => d.x === right.x && d.y === right.y);
				dir = next.splice(i >= 0 ? i : next.length - 1, 1)[0];
			}
			loops.push({ points, area });
		}
	}
	return loops;
}

// ---- Smoothing --------------------------------------------------------------

/**
 * Averages each point with its neighbors to take out leftover steps, cuts
 * corners so the curve is round, then pushes the outline out evenly until it
 * covers the same area as its tiles, so small shapes don't shrink away.
 */
function smooth({ points: loop, area }: Loop): Point[] {
	let points = loop;
	for (let pass = 0; pass < SMOOTHING_PASSES; pass++) {
		points = points.map((p, i) => {
			const a = points[(i - 1 + points.length) % points.length];
			const b = points[(i + 1) % points.length];
			return { x: (a.x + 2 * p.x + b.x) / 4, y: (a.y + 2 * p.y + b.y) / 4 };
		});
	}

	for (let pass = 0; pass < ROUNDING_PASSES; pass++) {
		points = points.flatMap((p, i) => {
			const q = points[(i + 1) % points.length];
			return [
				{ x: 0.75 * p.x + 0.25 * q.x, y: 0.75 * p.y + 0.25 * q.y },
				{ x: 0.25 * p.x + 0.75 * q.x, y: 0.25 * p.y + 0.75 * q.y },
			];
		});
	}

	// Push every point along its normal until the area is back. An outline
	// pushed out by d gains about perimeter * d + PI * d^2, so solve for d.
	// Holes are traced the other way round, so they grow by pushing inward.
	const sign = Math.sign(area);
	for (let pass = 0; pass < 2; pass++) {
		const p = perimeter(points);
		const gap = Math.abs(area) - Math.abs(signedArea(points));
		const d =
			(sign * (-p + Math.sqrt(Math.max(0, p * p + 4 * Math.PI * gap)))) /
			(2 * Math.PI);
		points = points.map((pt, i) => {
			const a = points[(i - 1 + points.length) % points.length];
			const b = points[(i + 1) % points.length];
			const tx = b.x - a.x;
			const ty = b.y - a.y;
			const len = Math.hypot(tx, ty) || 1;
			// (ty, -tx) points away from the inside tiles.
			return { x: pt.x + (ty / len) * d, y: pt.y - (tx / len) * d };
		});
	}
	return points;
}

function perimeter(points: Point[]) {
	let sum = 0;
	for (let i = 0; i < points.length; i++) {
		const p = points[i];
		const q = points[(i + 1) % points.length];
		sum += Math.hypot(q.x - p.x, q.y - p.y);
	}
	return sum;
}

/** Shoelace area; positive for loops that go clockwise on screen. */
function signedArea(points: Point[]) {
	let sum = 0;
	for (let i = 0; i < points.length; i++) {
		const p = points[i];
		const q = points[(i + 1) % points.length];
		sum += p.x * q.y - q.x * p.y;
	}
	return sum / 2;
}

/** Even-odd point-in-polygon test. */
function contains(polygon: Point[], p: Point) {
	let inside = false;
	for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
		const a = polygon[i];
		const b = polygon[j];
		if (a.y > p.y !== b.y > p.y) {
			const x = a.x + ((p.y - a.y) / (b.y - a.y)) * (b.x - a.x);
			if (p.x < x) inside = !inside;
		}
	}
	return inside;
}
