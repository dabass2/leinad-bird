import type { BattleState, Scenario, UnitState, UnitType, Vec2 } from "./types";

/** Builds the starting live state for a scenario. */
export function createBattle(scenario: Scenario): BattleState {
	return {
		scenarioId: scenario.id,
		time: 0,
		units: scenario.units.map((u) => ({
			...u,
			position: { ...u.position },
		})),
	};
}

export function unitTypeIndex(scenario: Scenario): Map<string, UnitType> {
	return new Map(scenario.unitTypes.map((t) => [t.id, t]));
}

/** Width and depth of a formation in meters. */
export function formationSize(unit: UnitState, type: UnitType) {
	const files = Math.ceil(unit.men / unit.ranks);
	return {
		frontage: files * type.fileWidth,
		depth: unit.ranks * type.rankDepth,
	};
}

/** Unit vectors pointing forward and to the unit's right. */
export function unitAxes(facing: number) {
	const forward = { x: Math.cos(facing), y: Math.sin(facing) };
	// With y pointing down, turning clockwise on screen is +90 degrees.
	const right = { x: -forward.y, y: forward.x };
	return { forward, right };
}

/** A point in the unit's own frame: +forward is ahead, +right is its right. */
export function toUnitFrame(unit: UnitState, point: Vec2) {
	const { forward, right } = unitAxes(unit.facing);
	const dx = point.x - unit.position.x;
	const dy = point.y - unit.position.y;
	return {
		forward: dx * forward.x + dy * forward.y,
		right: dx * right.x + dy * right.y,
	};
}

/** Corners of the formation: front-left, front-right, back-right, back-left. */
export function unitCorners(unit: UnitState, type: UnitType): Vec2[] {
	const { frontage, depth } = formationSize(unit, type);
	const { forward, right } = unitAxes(unit.facing);
	const at = (f: number, r: number) => ({
		x: unit.position.x + forward.x * f + right.x * r,
		y: unit.position.y + forward.y * f + right.y * r,
	});
	return [
		at(depth / 2, -frontage / 2),
		at(depth / 2, frontage / 2),
		at(-depth / 2, frontage / 2),
		at(-depth / 2, -frontage / 2),
	];
}

/**
 * The unit under a world point, or null. `slop` widens every unit by that
 * many meters so thin formations are still easy to click when zoomed out.
 */
export function unitAt(
	state: BattleState,
	types: Map<string, UnitType>,
	point: Vec2,
	slop = 0,
): UnitState | null {
	// Last drawn is on top, so search from the end.
	for (let i = state.units.length - 1; i >= 0; i--) {
		const unit = state.units[i];
		const type = types.get(unit.typeId);
		if (!type) continue;
		const { frontage, depth } = formationSize(unit, type);
		const local = toUnitFrame(unit, point);
		if (
			Math.abs(local.forward) <= depth / 2 + slop &&
			Math.abs(local.right) <= frontage / 2 + slop
		) {
			return unit;
		}
	}
	return null;
}
