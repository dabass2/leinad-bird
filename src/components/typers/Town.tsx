import type { Context } from "konva/lib/Context";
import { useMemo } from "react";
import { Circle, Group, Line, Rect } from "react-konva";
import {
	createSeededRandom,
	getTownDamageTier,
	hashStringToInt,
	TOWN_BUILDING_COLORS,
	TOWN_BUILDING_COUNT_RANGE,
	TOWN_DAMAGED_SHARE,
	TOWN_GROUND_COLOR,
	TOWN_HEIGHT_RATIO,
	TOWN_ROOF_COLOR,
	TOWN_RUBBLE_COLOR,
	TOWN_SMOKE_COLOR,
	TOWN_WINDOW_DARK_COLOR,
	TOWN_WINDOW_LIT_COLOR,
	type TTownDamageTier,
} from "#/lib/typers-visuals";

export type TTown = {
	health: number;
	maxHealth: number;
	width: number;
	height: number;
};

type TRoof = "flat" | "ledge" | "antenna";

type TBuilding = {
	left: number;
	width: number;
	heightFactor: number;
	color: string;
	roof: TRoof;
	// 0..1, buildings with lower sturdiness break first
	sturdiness: number;
	seed: number;
};

const GROUND_HEIGHT = 3;
const WINDOW = { width: 5, height: 7, gapX: 5, gapY: 6, padding: 7 } as const;
const ROOFS: TRoof[] = ["flat", "flat", "ledge", "antenna"];

function clamp(value: number, min: number, max: number): number {
	return Math.min(Math.max(value, min), max);
}

function generateBuildingLayout(width: number): TBuilding[] {
	const rand = createSeededRandom(hashStringToInt("town"));
	const count = clamp(
		Math.round(width / 110),
		TOWN_BUILDING_COUNT_RANGE.min,
		TOWN_BUILDING_COUNT_RANGE.max,
	);
	const gap = clamp(width * 0.006, 3, 8);
	const weights = Array.from({ length: count }, () => 0.7 + rand() * 0.6);
	// evenly spread sturdiness so each tier breaks its intended share
	const sturdinessOrder = Array.from({ length: count }, (_, i) => i).sort(
		() => rand() - 0.5,
	);
	const weightSum = weights.reduce((sum, w) => sum + w, 0);
	const usable = width - gap * (count + 1);

	let left = gap;
	return weights.map((weight, i) => {
		const buildingWidth = (usable * weight) / weightSum;
		const building: TBuilding = {
			left,
			width: buildingWidth,
			heightFactor: 0.45 + rand() * 0.55,
			color: TOWN_BUILDING_COLORS[i % TOWN_BUILDING_COLORS.length],
			roof: ROOFS[Math.floor(rand() * ROOFS.length)],
			sturdiness: (sturdinessOrder[i] + 0.5) / count,
			seed: hashStringToInt(`town-building-${i}`),
		};
		left += buildingWidth + gap;
		return building;
	});
}

// jagged outline for a building whose top has been knocked off
function getBrokenOutline(
	b: TBuilding,
	groundY: number,
	brokenHeight: number,
	seed: number,
): number[] {
	const rand = createSeededRandom(seed);
	const steps = 6;
	const jag = brokenHeight * 0.3;
	const points = [b.left, groundY];
	for (let i = 0; i <= steps; i++) {
		// alternate peaks and notches so the break reads as shattered, not wavy
		const depth = i % 2 === 0 ? rand() * 0.3 : 0.6 + rand() * 0.4;
		points.push(
			b.left + (b.width * i) / steps,
			groundY - brokenHeight + depth * jag,
		);
	}
	points.push(b.left + b.width, groundY);
	return points;
}

function getRectOutline(b: TBuilding, groundY: number, top: number): number[] {
	return [
		b.left,
		groundY,
		b.left,
		top,
		b.left + b.width,
		top,
		b.left + b.width,
		groundY,
	];
}

function clipToOutline(points: number[]) {
	return (ctx: Context) => {
		ctx.beginPath();
		ctx.moveTo(points[0], points[1]);
		for (let i = 2; i < points.length; i += 2) {
			ctx.lineTo(points[i], points[i + 1]);
		}
		ctx.closePath();
	};
}

function Windows({
	b,
	top,
	groundY,
	damaged,
}: {
	b: TBuilding;
	top: number;
	groundY: number;
	damaged: boolean;
}) {
	const cols = Math.floor(
		(b.width - WINDOW.padding * 2 + WINDOW.gapX) / (WINDOW.width + WINDOW.gapX),
	);
	const rows = Math.floor(
		(groundY - top - WINDOW.padding * 2 + WINDOW.gapY) /
			(WINDOW.height + WINDOW.gapY),
	);
	if (cols < 1 || rows < 1) return null;

	const gridWidth = cols * WINDOW.width + (cols - 1) * WINDOW.gapX;
	const startX = b.left + (b.width - gridWidth) / 2;
	const rand = createSeededRandom(b.seed);
	const litChance = damaged ? 0.15 : 0.7;

	return (
		<>
			{Array.from({ length: rows }, (_, row) =>
				Array.from({ length: cols }, (_, col) => (
					<Rect
						key={`${row}-${col}`}
						x={startX + col * (WINDOW.width + WINDOW.gapX)}
						y={top + WINDOW.padding + row * (WINDOW.height + WINDOW.gapY)}
						width={WINDOW.width}
						height={WINDOW.height}
						fill={
							rand() < litChance
								? TOWN_WINDOW_LIT_COLOR
								: TOWN_WINDOW_DARK_COLOR
						}
					/>
				)),
			)}
		</>
	);
}

function Roof({ b, top }: { b: TBuilding; top: number }) {
	if (b.roof === "ledge") {
		return (
			<Rect
				x={b.left - 2}
				y={top - 3}
				width={b.width + 4}
				height={4}
				fill={TOWN_ROOF_COLOR}
			/>
		);
	}
	if (b.roof === "antenna") {
		const x = b.left + b.width * 0.7;
		return (
			<>
				<Line
					points={[x, top, x, top - 12]}
					stroke={TOWN_ROOF_COLOR}
					strokeWidth={2}
				/>
				<Circle x={x} y={top - 13} radius={2} fill="#e0605a" />
			</>
		);
	}
	return null;
}

function Smoke({ x, y, seed }: { x: number; y: number; seed: number }) {
	const rand = createSeededRandom(seed);
	return (
		<>
			{[0, 1, 2].map((i) => (
				<Circle
					key={i}
					x={x + (rand() - 0.5) * 10 + i * 4}
					y={y - 6 - i * 9}
					radius={5 + i * 2.5}
					fill={TOWN_SMOKE_COLOR}
					opacity={0.3 - i * 0.07}
				/>
			))}
		</>
	);
}

function Rubble({
	b,
	groundY,
	height,
}: {
	b: TBuilding;
	groundY: number;
	height: number;
}) {
	const rand = createSeededRandom(b.seed + 1);
	const steps = 6;
	const points = [b.left, groundY];
	for (let i = 1; i < steps; i++) {
		const t = i / steps;
		// mound peaks in the middle
		const peak = Math.sin(t * Math.PI) * height;
		points.push(b.left + b.width * t, groundY - peak * (0.6 + rand() * 0.4));
	}
	points.push(b.left + b.width, groundY);

	return (
		<>
			<Line closed fill={TOWN_RUBBLE_COLOR} points={points} />
			{[0, 1, 2].map((i) => (
				<Rect
					key={i}
					x={b.left + b.width * (0.2 + rand() * 0.6)}
					y={groundY - height * (0.3 + rand() * 0.4)}
					width={4 + rand() * 4}
					height={3 + rand() * 3}
					rotation={rand() * 40 - 20}
					fill={b.color}
				/>
			))}
		</>
	);
}

function Building({
	b,
	groundY,
	townHeight,
	tier,
	damaged,
}: {
	b: TBuilding;
	groundY: number;
	townHeight: number;
	tier: TTownDamageTier;
	damaged: boolean;
}) {
	const fullHeight = townHeight * b.heightFactor;
	const top = groundY - fullHeight;

	if (!damaged) {
		const outline = getRectOutline(b, groundY, top);
		return (
			<Group>
				<Roof b={b} top={top} />
				<Line closed fill={b.color} points={outline} />
				<Windows b={b} top={top} groundY={groundY} damaged={false} />
			</Group>
		);
	}

	const brokenHeight = fullHeight * (tier === "light" ? 0.75 : 0.5);
	const outline = getBrokenOutline(
		b,
		groundY,
		brokenHeight,
		b.seed + (tier === "light" ? 0 : 1),
	);

	return (
		<Group>
			<Line closed fill={b.color} points={outline} />
			<Group clipFunc={clipToOutline(outline)}>
				<Windows b={b} top={top} groundY={groundY} damaged />
			</Group>
			{tier === "heavy" && (
				<Smoke
					x={b.left + b.width / 2}
					y={groundY - brokenHeight}
					seed={b.seed}
				/>
			)}
		</Group>
	);
}

export function Town({ health, maxHealth, width, height }: TTown) {
	const townHeight = height * TOWN_HEIGHT_RATIO;
	const groundY = height - GROUND_HEIGHT;
	const tier = getTownDamageTier(health, maxHealth);
	const damagedShare = TOWN_DAMAGED_SHARE[tier];
	const buildings = useMemo(() => generateBuildingLayout(width), [width]);

	return (
		<Group listening={false}>
			{buildings.map((b) =>
				tier === "rubble" ? (
					<Rubble
						key={b.seed}
						b={b}
						groundY={groundY}
						height={townHeight * 0.25}
					/>
				) : (
					<Building
						key={b.seed}
						b={b}
						groundY={groundY}
						townHeight={townHeight}
						tier={tier}
						damaged={b.sturdiness < damagedShare}
					/>
				),
			)}
			<Rect
				x={0}
				y={groundY}
				width={width}
				height={GROUND_HEIGHT}
				fill={TOWN_GROUND_COLOR}
			/>
		</Group>
	);
}
