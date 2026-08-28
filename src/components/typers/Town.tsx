import { useMemo } from "react";
import { Circle, Group, Line, Rect } from "react-konva";
import {
	getTownDamageTier,
	hashStringToInt,
	TOWN_BUILDING_COUNT_RANGE,
	TOWN_HEIGHT_RATIO,
	TOWN_TIER_COLORS,
	type TTownDamageTier,
} from "#/lib/typers-visuals";

export type TTown = {
	health: number;
	maxHealth: number;
	width: number;
	height: number;
};

type TBuilding = {
	x: number;
	buildingWidth: number;
	heightFactor: number;
	vulnerability: number;
	seed: number;
};

function clamp(value: number, min: number, max: number): number {
	return Math.min(Math.max(value, min), max);
}

function generateBuildingLayout(width: number): TBuilding[] {
	const count = clamp(
		Math.round(width / 140),
		TOWN_BUILDING_COUNT_RANGE.min,
		TOWN_BUILDING_COUNT_RANGE.max,
	);
	const spacing = width / count;
	return Array.from({ length: count }, (_, i) => {
		const seed = hashStringToInt(`town-building-${i}`);
		return {
			x: spacing * (i + 0.5),
			buildingWidth: spacing * 0.6,
			heightFactor: 0.55 + (seed % 45) / 100,
			vulnerability: seed % 3,
			seed,
		};
	});
}

function isDamagedAtTier(vulnerability: number, tier: TTownDamageTier) {
	if (tier === "pristine") return false;
	if (tier === "light") return vulnerability === 0;
	return vulnerability <= 1;
}

export function Town({ health, maxHealth, width, height }: TTown) {
	const townHeight = height * TOWN_HEIGHT_RATIO;
	const groundY = height;
	const tier = getTownDamageTier(health, maxHealth);
	const tierColor = TOWN_TIER_COLORS[tier];
	const buildings = useMemo(() => generateBuildingLayout(width), [width]);

	return (
		<Group y={0} listening={false}>
			{tier === "rubble"
				? buildings.map((b) => {
						const moundHeight = townHeight * 0.25;
						return (
							<Group key={b.seed}>
								<Line
									closed
									fill={tierColor}
									points={[
										b.x - b.buildingWidth / 2,
										groundY,
										b.x - b.buildingWidth * 0.2,
										groundY - moundHeight,
										b.x + b.buildingWidth * 0.15,
										groundY - moundHeight * 0.7,
										b.x + b.buildingWidth / 2,
										groundY,
									]}
								/>
								<Circle
									x={b.x - b.buildingWidth * 0.2}
									y={groundY - moundHeight * 0.6}
									radius={4}
									fill="#8a3a1f"
									opacity={0.7}
								/>
							</Group>
						);
					})
				: buildings.map((b) => {
						const damaged = isDamagedAtTier(b.vulnerability, tier);
						const damageFactor =
							tier === "heavy" && damaged ? 0.5 : damaged ? 0.75 : 1;
						const buildingHeight = townHeight * b.heightFactor * damageFactor;
						const top = groundY - buildingHeight;
						const windowCols = Math.max(1, Math.floor(b.buildingWidth / 14));
						const windowRows = Math.max(1, Math.floor(buildingHeight / 16));

						return (
							<Group key={b.seed}>
								{tier === "heavy" && damaged ? (
									<Line
										closed
										fill={tierColor}
										opacity={0.85}
										points={[
											b.x - b.buildingWidth / 2,
											groundY,
											b.x - b.buildingWidth / 2,
											top + 8,
											b.x - b.buildingWidth * 0.1,
											top,
											b.x + b.buildingWidth * 0.3,
											top + 10,
											b.x + b.buildingWidth / 2,
											top + 4,
											b.x + b.buildingWidth / 2,
											groundY,
										]}
									/>
								) : (
									<Rect
										x={b.x - b.buildingWidth / 2}
										y={top}
										width={b.buildingWidth}
										height={buildingHeight}
										fill={tierColor}
										opacity={damaged ? 0.85 : 1}
										rotation={damaged ? (b.seed % 5) - 2 : 0}
									/>
								)}
								{Array.from({ length: windowRows }, (_, row) =>
									Array.from({ length: windowCols }, (_, col) => {
										const windowSeed = b.seed + row * 7 + col * 13;
										const lit =
											!damaged && windowSeed % 4 !== 0
												? true
												: damaged && windowSeed % 3 === 0;
										return (
											<Rect
												key={`${row}-${col}`}
												x={b.x - b.buildingWidth / 2 + 6 + col * 14}
												y={top + 6 + row * 16}
												width={6}
												height={8}
												fill={lit ? "#ffdd88" : "#22222266"}
											/>
										);
									}),
								)}
								{tier === "light" && damaged && (
									<Line
										stroke="#2b2b2b"
										strokeWidth={1.5}
										points={[
											b.x - b.buildingWidth * 0.15,
											top + buildingHeight * 0.2,
											b.x + b.buildingWidth * 0.1,
											top + buildingHeight * 0.6,
											b.x - b.buildingWidth * 0.05,
											groundY - buildingHeight * 0.1,
										]}
									/>
								)}
								{tier === "heavy" && damaged && (
									<Circle
										x={b.x}
										y={top - 6}
										radius={8}
										fill="#999999"
										opacity={0.35}
									/>
								)}
							</Group>
						);
					})}
		</Group>
	);
}
