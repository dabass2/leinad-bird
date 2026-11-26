import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseTiledMap, type TiledMapJson } from "./tiled";

const readJson = (path: string) =>
	JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"));

const testMap: TiledMapJson = readJson(
	"../../../public/battle/maps/test-map.tmj",
);
const terrainRules = readJson("../../../public/battle/terrain.json");

/** A 2x1 map whose tileset maps tile 0 to grass and tile 1 to water. */
const tinyMap = (data: number[] | string): TiledMapJson => ({
	width: 2,
	height: 1,
	tilewidth: 32,
	tileheight: 32,
	infinite: false,
	layers: [{ type: "tilelayer", name: "terrain", width: 2, height: 1, data }],
	tilesets: [
		{
			firstgid: 1,
			tiles: [
				{
					id: 0,
					properties: [{ name: "terrain", type: "string", value: "grass" }],
				},
				{
					id: 1,
					properties: [{ name: "terrain", type: "string", value: "water" }],
				},
			],
		},
	],
});

describe("parseTiledMap", () => {
	it("reads the Test Map, and every terrain in it has rules", () => {
		const map = parseTiledMap(testMap);
		expect(map.name).toBe("Test Map");
		expect(map.cells).toHaveLength(map.width * map.height);
		for (const terrain of new Set(map.cells)) {
			expect(terrainRules).toHaveProperty(terrain);
		}
	});

	it("turns tile ids into terrain ids, row by row", () => {
		expect(parseTiledMap(tinyMap([2, 1])).cells).toEqual(["water", "grass"]);
	});

	it("ignores flipped and rotated tiles' flag bits", () => {
		const flippedWater = (2 | 0x80000000) >>> 0;
		expect(parseTiledMap(tinyMap([flippedWater, 1])).cells[0]).toBe("water");
	});

	it("explains export settings it can't read", () => {
		expect(() => parseTiledMap(tinyMap("eJxjYGBgAAAABAAB"))).toThrow(/CSV/);
		expect(() => parseTiledMap({ ...tinyMap([1, 1]), infinite: true })).toThrow(
			/Infinite/,
		);
		expect(() => parseTiledMap(tinyMap([0, 1]))).toThrow(/\(0, 0\)/);
	});
});
