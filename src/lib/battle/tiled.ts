/**
 * Reads maps exported from Tiled as JSON (.tmj) into a plain grid of terrain
 * ids. Only what the game uses is typed here; Tiled writes more fields.
 *
 * Each tile in the tileset carries a custom string property `terrain`
 * ("grass", "forest", ...). That id is the only link between the map and the
 * terrain rules, so the tileset's colors only matter while painting in Tiled.
 */

interface TiledProperty {
	name: string;
	type: string;
	value: unknown;
}

interface TiledTileLayer {
	type: "tilelayer";
	name: string;
	width: number;
	height: number;
	/** Tile ids row by row; set "Tile Layer Format" to CSV so this is an array. */
	data: number[] | string;
}

interface TiledTileset {
	firstgid: number;
	/** Set when the tileset is a separate .tsj file instead of embedded. */
	source?: string;
	tiles?: { id: number; properties?: TiledProperty[] }[];
}

export interface TiledMapJson {
	width: number;
	height: number;
	tilewidth: number;
	tileheight: number;
	infinite: boolean;
	properties?: TiledProperty[];
	layers: ({ type: string } | TiledTileLayer)[];
	tilesets: TiledTileset[];
}

export interface TerrainMap {
	name: string;
	/** Size in tiles. */
	width: number;
	height: number;
	/** Size of one tile in pixels, as drawn in Tiled. */
	tileSize: number;
	/** Terrain id for each cell, row by row: cell (x, y) is at y * width + x. */
	cells: string[];
}

// Tiled stores flip and rotation in the top bits of each tile id.
const FLIP_FLAGS = 0xf0000000;

export function parseTiledMap(json: TiledMapJson): TerrainMap {
	if (json.infinite) {
		throw new Error("Infinite Tiled maps aren't supported; turn off Infinite.");
	}
	if (json.tilewidth !== json.tileheight) {
		throw new Error("Tiles must be square.");
	}

	const layer = json.layers.find(
		(l): l is TiledTileLayer => l.type === "tilelayer",
	);
	if (!layer) throw new Error("The map has no tile layer.");
	if (!Array.isArray(layer.data)) {
		throw new Error("Save tile layers as CSV, not Base64.");
	}

	// Map every global tile id to its terrain property.
	const terrainByGid = new Map<number, string>();
	for (const tileset of json.tilesets) {
		if (tileset.source) {
			throw new Error(`Embed the tileset "${tileset.source}" in the map.`);
		}
		for (const tile of tileset.tiles ?? []) {
			const terrain = tile.properties?.find((p) => p.name === "terrain");
			if (typeof terrain?.value === "string") {
				terrainByGid.set(tileset.firstgid + tile.id, terrain.value);
			}
		}
	}

	const cells = layer.data.map((raw, i) => {
		const gid = (raw & ~FLIP_FLAGS) >>> 0;
		const terrain = terrainByGid.get(gid);
		if (!terrain) {
			const x = i % layer.width;
			const y = Math.floor(i / layer.width);
			throw new Error(`Cell (${x}, ${y}) has no terrain.`);
		}
		return terrain;
	});

	const name = json.properties?.find((p) => p.name === "name")?.value;
	return {
		name: typeof name === "string" ? name : "Untitled map",
		width: layer.width,
		height: layer.height,
		tileSize: json.tilewidth,
		cells,
	};
}
