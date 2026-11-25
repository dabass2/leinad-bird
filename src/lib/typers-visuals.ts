export const ASTEROID_PATHS = [
	"M50,10 C65,8 85,20 88,38 C92,55 80,70 68,82 C55,92 35,90 22,78 C10,66 8,45 15,30 C22,15 38,12 50,10 Z",
	"M48,5 C62,10 80,15 90,32 C98,48 90,65 78,75 C68,88 48,95 32,85 C18,77 5,62 8,45 C10,28 22,15 35,10 C40,8 44,6 48,5 Z",
	"M55,8 C70,12 88,25 85,42 C95,55 85,72 70,80 C58,90 40,88 28,80 C15,72 5,58 10,42 C12,28 25,18 35,12 C42,8 48,6 55,8 Z",
] as const;

// asteroid path coordinates span roughly this box, used to center/scale the path
export const ASTEROID_PATH_VIEWBOX = 100;

// fraction of the path's bounding box that's safely "rock" at every rotation
// (the authored blobs aren't perfect circles, so this is a conservative
// inscribed-circle estimate, not the full bounding box)
export const ASTEROID_INSCRIBED_FRACTION = 0.7;

// fixed (theme-independent) so contrast against the text is predictable
export const ASTEROID_ROCK_COLOR = "#9c8f7d";
export const ASTEROID_ROCK_HIGHLIGHT_COLOR = "#b8ac9a";
export const ASTEROID_ROCK_SHADOW_COLOR = "#7a6e5f";
export const ASTEROID_RIM_COLOR = "#5e5448";
export const ASTEROID_CRATER_COLOR = "#6b6052";

// Words always sit on the fixed rock color, so their ink is fixed too.
export const ASTEROID_TEXT_COLOR = "#000000";
export const ASTEROID_TEXT_STROKE_LIGHT = "#fdf8ec";

// Game-over text sits on the page background; matches --sea-ink per theme.
export const GAME_OVER_TEXT_COLORS = {
	light: "#000000",
	dark: "#f3eedb",
} as const;

let measureContext: CanvasRenderingContext2D | null | undefined;

function getMeasureContext(): CanvasRenderingContext2D | null {
	if (measureContext === undefined) {
		measureContext =
			typeof document === "undefined"
				? null
				: (document.createElement("canvas").getContext("2d") ?? null);
	}
	return measureContext;
}

export function measureTextWidth(text: string, fontSize: number): number {
	const ctx = getMeasureContext();
	if (!ctx) return text.length * fontSize * 0.55;
	ctx.font = `${fontSize}px Arial`;
	return ctx.measureText(text).width;
}

export function getAsteroidDiameter(text: string, fontSize: number): number {
	const textWidth = measureTextWidth(text, fontSize);
	const textHeight = fontSize * 1.15;
	const diagonal = Math.sqrt(textWidth ** 2 + textHeight ** 2);
	return Math.max(diagonal / ASTEROID_INSCRIBED_FRACTION, fontSize * 2);
}

// simple deterministic PRNG so seeded visuals look stable across renders
export function createSeededRandom(seed: number): () => number {
	let a = seed;
	return () => {
		a |= 0;
		a = (a + 0x6d2b79f5) | 0;
		let t = Math.imul(a ^ (a >>> 15), 1 | a);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

export function hashStringToInt(value: string): number {
	let hash = 0;
	for (let i = 0; i < value.length; i++) {
		hash = (hash * 31 + value.charCodeAt(i)) | 0;
	}
	return Math.abs(hash);
}

export const TOWN_HEIGHT_RATIO = 0.12;
export const TOWN_BUILDING_COUNT_RANGE = { min: 6, max: 14 } as const;

export const TOWN_DAMAGE_THRESHOLDS = {
	light: 0.66,
	heavy: 0.33,
	rubble: 0.1,
} as const;

export type TTownDamageTier = "pristine" | "light" | "heavy" | "rubble";

export function getTownDamageTier(
	health: number,
	maxHealth: number,
): TTownDamageTier {
	const pct = maxHealth > 0 ? health / maxHealth : 0;
	if (pct < TOWN_DAMAGE_THRESHOLDS.rubble) return "rubble";
	if (pct < TOWN_DAMAGE_THRESHOLDS.heavy) return "heavy";
	if (pct < TOWN_DAMAGE_THRESHOLDS.light) return "light";
	return "pristine";
}

// share of buildings (least sturdy first) that are broken at each tier
export const TOWN_DAMAGED_SHARE: Record<TTownDamageTier, number> = {
	pristine: 0,
	light: 0.35,
	heavy: 0.7,
	rubble: 1,
};

export const TOWN_BUILDING_COLORS = [
	"#6f7f8c",
	"#7b8994",
	"#66747f",
	"#828f99",
] as const;
export const TOWN_ROOF_COLOR = "#55616b";
export const TOWN_GROUND_COLOR = "#55616b";
export const TOWN_RUBBLE_COLOR = "#5b5651";
export const TOWN_WINDOW_LIT_COLOR = "#ffdd88";
export const TOWN_WINDOW_DARK_COLOR = "#2a303566";
export const TOWN_SMOKE_COLOR = "#8c8c8c";

export const IMPACT_DURATION_MS = 400;
export const IMPACT_COLOR = "#ff6b35";
