/**
 * The battle data model. Everything is plain, serializable data in world
 * units (meters) so a scenario can live in a .ts file today and a JSON file
 * or database row later without changes.
 *
 * Coordinates: x grows east, y grows south (the same way as the screen), so
 * the renderer never has to flip anything. Angles are radians measured the
 * same way as Math.atan2(dy, dx): 0 faces east, PI/2 faces south.
 */

export type Vec2 = { x: number; y: number };

// ---- Map -------------------------------------------------------------------

/** Areas that change how units move and fight. */
export type AreaKind = "hill" | "forest" | "marsh" | "town" | "camp";

export interface TerrainArea {
	kind: AreaKind;
	/** Closed polygon; the last point joins back to the first. */
	points: Vec2[];
	label?: string;
}

/** Lines on the map. Width is in meters so it scales with zoom. */
export type LineKind = "river" | "road";

export interface TerrainLine {
	kind: LineKind;
	points: Vec2[];
	width: number;
	label?: string;
}

export interface BattleMap {
	width: number;
	height: number;
	areas: TerrainArea[];
	lines: TerrainLine[];
}

// ---- Armies ----------------------------------------------------------------

export interface Side {
	id: string;
	name: string;
	/** Fill for this side's units. The renderer derives outlines from it. */
	color: string;
}

export type UnitCategory = "heavy-infantry" | "light-infantry" | "cavalry";

/**
 * What kind of troops a unit is. Shared between every unit of that type, so
 * balancing happens in one place and units only store what's unique to them.
 */
export interface UnitType {
	id: string;
	name: string;
	category: UnitCategory;
	/** Meters of frontage each file (column of men) takes up. */
	fileWidth: number;
	/** Meters between ranks (rows of men). */
	rankDepth: number;
	/** Marching speed in meters per second. */
	speed: number;
}

/** A unit as a scenario places it at the start of the battle. */
export interface UnitSetup {
	id: string;
	sideId: string;
	typeId: string;
	name: string;
	men: number;
	/** How many men deep the formation is. Frontage follows from men / ranks. */
	ranks: number;
	/** Center of the formation. */
	position: Vec2;
	/** Direction the front rank faces. */
	facing: number;
}

export interface Scenario {
	id: string;
	name: string;
	/** Negative for BC. */
	year: number;
	summary: string;
	map: BattleMap;
	sides: Side[];
	unitTypes: UnitType[];
	units: UnitSetup[];
}

// ---- Live battle -----------------------------------------------------------

/**
 * The parts of a unit that change while the battle runs. Kept apart from the
 * scenario so a battle can be restarted, replayed or saved by copying this.
 */
export interface UnitState {
	id: string;
	sideId: string;
	typeId: string;
	name: string;
	men: number;
	ranks: number;
	position: Vec2;
	facing: number;
}

export interface BattleState {
	scenarioId: string;
	/** Seconds since the battle started. */
	time: number;
	units: UnitState[];
}
