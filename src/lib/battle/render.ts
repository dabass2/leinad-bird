import { formationSize, unitAxes, unitCorners } from "./battle";
import { type Camera, type Viewport, worldToScreen } from "./camera";
import type {
	AreaKind,
	BattleState,
	Scenario,
	Side,
	UnitState,
	UnitType,
	Vec2,
} from "./types";

/**
 * Draws a battle onto a 2D canvas. It's a pure function of its inputs: no
 * React, no DOM lookups, no state of its own, so the same call can draw the
 * live view, a thumbnail or a replay frame.
 */

export interface Palette {
	outside: string;
	ground: string;
	grid: string;
	water: string;
	waterBank: string;
	road: string;
	areas: Record<AreaKind, { fill: string; line: string }>;
	ink: string;
	halo: string;
	selection: string;
}

export const PALETTES: Record<"light" | "dark", Palette> = {
	light: {
		outside: "#d9d2bd",
		ground: "#efe6cc",
		grid: "rgba(60, 50, 30, 0.07)",
		water: "#8fb3c4",
		waterBank: "#6f93a4",
		road: "rgba(110, 85, 50, 0.55)",
		areas: {
			hill: {
				fill: "rgba(170, 140, 90, 0.28)",
				line: "rgba(130, 100, 60, 0.5)",
			},
			forest: {
				fill: "rgba(90, 130, 70, 0.35)",
				line: "rgba(60, 100, 50, 0.6)",
			},
			marsh: {
				fill: "rgba(110, 150, 140, 0.3)",
				line: "rgba(80, 120, 110, 0.5)",
			},
			town: {
				fill: "rgba(150, 110, 80, 0.55)",
				line: "rgba(100, 70, 45, 0.8)",
			},
			camp: {
				fill: "rgba(120, 100, 70, 0.12)",
				line: "rgba(100, 80, 50, 0.7)",
			},
		},
		ink: "#2a2417",
		halo: "rgba(239, 230, 204, 0.9)",
		selection: "#f2c14e",
	},
	dark: {
		outside: "#141412",
		ground: "#2a2a24",
		grid: "rgba(240, 230, 200, 0.05)",
		water: "#35566a",
		waterBank: "#24404f",
		road: "rgba(200, 175, 130, 0.35)",
		areas: {
			hill: {
				fill: "rgba(170, 140, 90, 0.18)",
				line: "rgba(190, 160, 110, 0.35)",
			},
			forest: {
				fill: "rgba(90, 140, 80, 0.25)",
				line: "rgba(110, 160, 90, 0.45)",
			},
			marsh: {
				fill: "rgba(100, 150, 140, 0.2)",
				line: "rgba(110, 160, 150, 0.4)",
			},
			town: {
				fill: "rgba(170, 130, 95, 0.4)",
				line: "rgba(200, 160, 120, 0.6)",
			},
			camp: {
				fill: "rgba(200, 180, 140, 0.06)",
				line: "rgba(200, 180, 140, 0.45)",
			},
		},
		ink: "#f3eedb",
		halo: "rgba(20, 20, 18, 0.85)",
		selection: "#f2c14e",
	},
};

export interface RenderInput {
	ctx: CanvasRenderingContext2D;
	view: Viewport;
	/** Device pixels per CSS pixel, so lines stay sharp on retina screens. */
	pixelRatio: number;
	camera: Camera;
	scenario: Scenario;
	state: BattleState;
	types: Map<string, UnitType>;
	palette: Palette;
	selectedId: string | null;
}

/** Below this zoom (px per meter) unit names are hidden to avoid clutter. */
const UNIT_LABEL_MIN_ZOOM = 0.25;
/** Above this zoom individual ranks are drawn inside formations. */
const RANK_LINES_MIN_ZOOM = 2.5;

export function renderBattle(input: RenderInput) {
	const { ctx, view, pixelRatio, camera, palette } = input;

	ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
	ctx.fillStyle = palette.outside;
	ctx.fillRect(0, 0, view.width, view.height);

	// World pass: one transform so everything below is drawn in meters.
	const origin = worldToScreen(camera, view, { x: 0, y: 0 });
	const s = camera.zoom * pixelRatio;
	ctx.setTransform(s, 0, 0, s, origin.x * pixelRatio, origin.y * pixelRatio);
	drawGround(input);
	drawAreas(input);
	drawLines(input);
	drawUnits(input);

	// Screen pass: text and overlays that keep a fixed pixel size.
	ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
	drawMapLabels(input);
	if (camera.zoom >= UNIT_LABEL_MIN_ZOOM) drawUnitLabels(input);
	drawScaleBar(input);
}

/** A world length that comes out as `px` screen pixels at the current zoom. */
const px = (camera: Camera, n: number) => n / camera.zoom;

function tracePath(ctx: CanvasRenderingContext2D, points: Vec2[]) {
	ctx.beginPath();
	ctx.moveTo(points[0].x, points[0].y);
	for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
}

function drawGround({ ctx, scenario, camera, palette }: RenderInput) {
	const { width, height } = scenario.map;
	ctx.fillStyle = palette.ground;
	ctx.fillRect(0, 0, width, height);

	// A 100 m grid, or 500 m once 100 m squares would be too small to read.
	const step = camera.zoom * 100 >= 12 ? 100 : 500;
	ctx.strokeStyle = palette.grid;
	ctx.lineWidth = px(camera, 1);
	ctx.beginPath();
	for (let x = step; x < width; x += step) {
		ctx.moveTo(x, 0);
		ctx.lineTo(x, height);
	}
	for (let y = step; y < height; y += step) {
		ctx.moveTo(0, y);
		ctx.lineTo(width, y);
	}
	ctx.stroke();
}

function drawAreas({ ctx, scenario, camera, palette }: RenderInput) {
	for (const area of scenario.map.areas) {
		const style = palette.areas[area.kind];
		tracePath(ctx, area.points);
		ctx.closePath();
		ctx.fillStyle = style.fill;
		ctx.fill();
		ctx.strokeStyle = style.line;
		ctx.lineWidth = px(camera, area.kind === "camp" ? 2 : 1.25);
		ctx.setLineDash(area.kind === "camp" ? [px(camera, 6), px(camera, 4)] : []);
		ctx.stroke();
	}
	ctx.setLineDash([]);
}

function drawLines({ ctx, scenario, camera, palette }: RenderInput) {
	ctx.lineJoin = "round";
	ctx.lineCap = "round";
	for (const line of scenario.map.lines) {
		tracePath(ctx, line.points);
		if (line.kind === "river") {
			// Bank first, slightly wider, then the water over it.
			ctx.strokeStyle = palette.waterBank;
			ctx.lineWidth = line.width + px(camera, 3);
			ctx.stroke();
			ctx.strokeStyle = palette.water;
			ctx.lineWidth = line.width;
			ctx.stroke();
		} else {
			ctx.strokeStyle = palette.road;
			ctx.lineWidth = Math.max(line.width, px(camera, 1.5));
			ctx.setLineDash([px(camera, 8), px(camera, 5)]);
			ctx.stroke();
			ctx.setLineDash([]);
		}
	}
}

/** Darkens a #rrggbb color by mixing it toward black. */
function shade(hex: string, amount: number) {
	const n = Number.parseInt(hex.slice(1), 16);
	const f = 1 - amount;
	const r = Math.round(((n >> 16) & 255) * f);
	const g = Math.round(((n >> 8) & 255) * f);
	const b = Math.round((n & 255) * f);
	return `rgb(${r}, ${g}, ${b})`;
}

function drawUnits(input: RenderInput) {
	const { ctx, scenario, state, types, camera, palette, selectedId } = input;
	const sides = new Map(scenario.sides.map((side) => [side.id, side]));

	for (const unit of state.units) {
		const type = types.get(unit.typeId);
		const side = sides.get(unit.sideId);
		if (!type || !side) continue;
		const corners = unitCorners(unit, type);

		if (unit.id === selectedId) {
			tracePath(ctx, corners);
			ctx.closePath();
			ctx.strokeStyle = palette.selection;
			ctx.lineWidth = px(camera, 6);
			ctx.lineJoin = "round";
			ctx.stroke();
		}

		drawFormation(ctx, unit, type, side, corners, camera);
	}
}

function drawFormation(
	ctx: CanvasRenderingContext2D,
	unit: UnitState,
	type: UnitType,
	side: Side,
	corners: Vec2[],
	camera: Camera,
) {
	const light = type.category === "light-infantry";
	const outline = shade(side.color, 0.45);

	// Body. Skirmishers are loose, so they're paler with a broken outline.
	tracePath(ctx, corners);
	ctx.closePath();
	ctx.globalAlpha = light ? 0.55 : 0.9;
	ctx.fillStyle = side.color;
	ctx.fill();
	ctx.globalAlpha = 1;
	ctx.strokeStyle = outline;
	ctx.lineWidth = px(camera, 1.25);
	ctx.lineJoin = "miter";
	ctx.setLineDash(light ? [px(camera, 3), px(camera, 2)] : []);
	ctx.stroke();
	ctx.setLineDash([]);

	// Rank lines when zoomed in close enough to tell them apart.
	if (camera.zoom * type.rankDepth >= RANK_LINES_MIN_ZOOM) {
		const [fl, fr, br, bl] = corners;
		ctx.strokeStyle = outline;
		ctx.globalAlpha = 0.35;
		ctx.lineWidth = px(camera, 0.75);
		ctx.beginPath();
		for (let r = 1; r < unit.ranks; r++) {
			const t = r / unit.ranks;
			ctx.moveTo(fl.x + (bl.x - fl.x) * t, fl.y + (bl.y - fl.y) * t);
			ctx.lineTo(fr.x + (br.x - fr.x) * t, fr.y + (br.y - fr.y) * t);
		}
		ctx.stroke();
		ctx.globalAlpha = 1;
	}

	// Category mark, in the spirit of map symbols: X for foot, / for horse.
	const [fl, fr, br, bl] = corners;
	ctx.strokeStyle = outline;
	ctx.lineWidth = px(camera, 1.25);
	ctx.beginPath();
	if (type.category === "cavalry") {
		ctx.moveTo(bl.x, bl.y);
		ctx.lineTo(fr.x, fr.y);
	} else if (type.category === "heavy-infantry") {
		ctx.moveTo(bl.x, bl.y);
		ctx.lineTo(fr.x, fr.y);
		ctx.moveTo(fl.x, fl.y);
		ctx.lineTo(br.x, br.y);
	}
	ctx.stroke();

	// A heavy front edge shows which way the unit faces at any zoom.
	ctx.strokeStyle = outline;
	ctx.lineWidth = px(camera, 3);
	ctx.lineCap = "butt";
	ctx.beginPath();
	ctx.moveTo(fl.x, fl.y);
	ctx.lineTo(fr.x, fr.y);
	ctx.stroke();
}

function haloText(
	ctx: CanvasRenderingContext2D,
	text: string,
	at: Vec2,
	palette: Palette,
	font: string,
) {
	ctx.font = font;
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";
	ctx.lineJoin = "round";
	ctx.lineWidth = 4;
	ctx.strokeStyle = palette.halo;
	ctx.strokeText(text, at.x, at.y);
	ctx.fillStyle = palette.ink;
	ctx.fillText(text, at.x, at.y);
}

function centroid(points: Vec2[]): Vec2 {
	const sum = points.reduce((a, p) => ({ x: a.x + p.x, y: a.y + p.y }), {
		x: 0,
		y: 0,
	});
	return { x: sum.x / points.length, y: sum.y / points.length };
}

function drawMapLabels({ ctx, scenario, camera, view, palette }: RenderInput) {
	for (const area of scenario.map.areas) {
		if (!area.label) continue;
		const at = worldToScreen(camera, view, centroid(area.points));
		haloText(
			ctx,
			area.label,
			at,
			palette,
			"italic 600 12px system-ui, sans-serif",
		);
	}
	for (const line of scenario.map.lines) {
		if (!line.label) continue;
		const mid = line.points[Math.floor(line.points.length / 2)];
		const at = worldToScreen(camera, view, mid);
		haloText(ctx, line.label, at, palette, "italic 600 13px Georgia, serif");
	}
}

function drawUnitLabels({
	ctx,
	state,
	types,
	camera,
	view,
	palette,
}: RenderInput) {
	for (const unit of state.units) {
		const type = types.get(unit.typeId);
		if (!type) continue;
		const { depth } = formationSize(unit, type);
		const { forward } = unitAxes(unit.facing);
		// Put the name behind the unit so it doesn't cover the gap to the enemy.
		const behind = depth / 2 + px(camera, 12);
		const at = worldToScreen(camera, view, {
			x: unit.position.x - forward.x * behind,
			y: unit.position.y - forward.y * behind,
		});
		haloText(ctx, unit.name, at, palette, "600 11px system-ui, sans-serif");
	}
}

const SCALE_STEPS = [10, 25, 50, 100, 250, 500, 1000, 2000, 5000];

function drawScaleBar({ ctx, camera, view, palette }: RenderInput) {
	// The longest round distance that fits in about 120 px.
	const meters =
		[...SCALE_STEPS].reverse().find((m) => m * camera.zoom <= 120) ??
		SCALE_STEPS[0];
	const width = meters * camera.zoom;
	const x = 16;
	const y = view.height - 20;

	ctx.strokeStyle = palette.halo;
	ctx.lineWidth = 5;
	ctx.lineCap = "round";
	ctx.beginPath();
	ctx.moveTo(x, y);
	ctx.lineTo(x + width, y);
	ctx.stroke();
	ctx.strokeStyle = palette.ink;
	ctx.lineWidth = 2;
	ctx.beginPath();
	ctx.moveTo(x, y - 4);
	ctx.lineTo(x, y);
	ctx.lineTo(x + width, y);
	ctx.lineTo(x + width, y - 4);
	ctx.stroke();

	const label = meters >= 1000 ? `${meters / 1000} km` : `${meters} m`;
	haloText(
		ctx,
		label,
		{ x: x + width / 2, y: y - 12 },
		palette,
		"600 11px system-ui, sans-serif",
	);
}
