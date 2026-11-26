import { Graphics } from "pixi.js";
import type { TerrainMap } from "./tiled";

/** The contents of terrain.json: everything the game knows about each terrain. */
export type TerrainRules = Record<string, { name: string; color: string }>;

/**
 * Draws the map as one solid-colored square per cell, in map pixels (one
 * tile is `tileSize` px). Pixi keeps the shapes on the GPU after this, so it
 * only runs again if the map changes.
 */
export function drawTerrain(map: TerrainMap, rules: TerrainRules): Graphics {
	const g = new Graphics();
	const size = map.tileSize;
	map.cells.forEach((terrain, i) => {
		const rule = rules[terrain];
		if (!rule) throw new Error(`terrain.json has no "${terrain}".`);
		const x = (i % map.width) * size;
		const y = Math.floor(i / map.width) * size;
		g.rect(x, y, size, size).fill(rule.color);
	});
	return g;
}
