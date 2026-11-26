import { describe, expect, it } from "vitest";
import { terrainLayers } from "./terrain";
import type { TerrainMap } from "./tiled";

const ORDER = ["grass", "water"];

/** Builds a map from rows of letters: "." is grass, "w" is water. */
const mapOf = (...rows: string[]): TerrainMap => ({
	name: "t",
	width: rows[0].length,
	height: rows.length,
	tileSize: 10,
	cells: rows.flatMap((r) =>
		[...r].map((c) => (c === "w" ? "water" : "grass")),
	),
});

const waterShapes = (map: TerrainMap) => {
	const layers = terrainLayers(map, ORDER);
	expect(layers.map((l) => l.terrain)).toEqual(["water"]);
	return layers[0].shapes;
};

const area = (flat: number[]) => {
	let s = 0;
	for (let i = 0; i < flat.length; i += 2) {
		const j = (i + 2) % flat.length;
		s += flat[i] * flat[j + 1] - flat[j] * flat[i + 1];
	}
	return Math.abs(s) / 2;
};

const points = (flat: number[]) =>
	flat
		.map((_, i) => (i % 2 === 0 ? { x: flat[i], y: flat[i + 1] } : null))
		.filter((p) => p !== null);

describe("terrainLayers", () => {
	it("skips terrain the map doesn't use", () => {
		expect(terrainLayers(mapOf("..", ".."), ORDER)).toEqual([]);
	});

	it("keeps a straight edge within a fifth of a tile of the boundary", () => {
		// Left half water on a 10x10 tile map (tiles are 10 px).
		const [shape] = waterShapes(mapOf(...Array(10).fill("wwwww.....")));
		// Inside the map, the only part of the outline is the edge at x = 50.
		const onMap = points(shape.outline).filter(
			(p) => p.x > 0 && p.y > 0 && p.y < 100,
		);
		expect(onMap.length).toBeGreaterThan(0);
		const worst = Math.max(...onMap.map((p) => Math.abs(p.x - 50)));
		expect(worst).toBeLessThan(2);
	});

	it("turns a lone tile into a round blob about its own size", () => {
		const [shape] = waterShapes(
			mapOf(".....", ".....", "..w..", ".....", "....."),
		);
		const a = area(shape.outline);
		expect(a).toBeCloseTo(100, 0);
		for (const p of points(shape.outline)) {
			const r = Math.hypot(p.x - 25, p.y - 25);
			expect(r).toBeGreaterThan(4);
			expect(r).toBeLessThan(7);
		}
	});

	it("cuts holes for gaps inside a region", () => {
		const shapes = waterShapes(
			mapOf("wwwww", "wwwww", "ww.ww", "wwwww", "wwwww"),
		);
		expect(shapes).toHaveLength(1);
		expect(shapes[0].holes).toHaveLength(1);
	});

	it("keeps tiles that only touch at a corner apart", () => {
		const shapes = waterShapes(mapOf(".....", ".w...", "..w..", "....."));
		expect(shapes).toHaveLength(2);
	});

	it("rejects terrain missing from the rules", () => {
		expect(() => terrainLayers(mapOf("w"), ["grass"])).toThrow(/water/);
	});
});
