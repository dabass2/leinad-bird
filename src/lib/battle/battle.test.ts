import { describe, expect, it } from "vitest";
import {
	createBattle,
	formationSize,
	unitAt,
	unitCorners,
	unitTypeIndex,
} from "./battle";
import { fitCamera, screenToWorld, worldToScreen, zoomAt } from "./camera";
import { cannae } from "./scenarios/cannae";
import type { UnitState, UnitType } from "./types";

const SCENARIOS = [cannae];

const infantry: UnitType = {
	id: "inf",
	name: "Infantry",
	category: "heavy-infantry",
	fileWidth: 1,
	rankDepth: 2,
	speed: 1,
};

const unit = (facing: number): UnitState => ({
	id: "u",
	sideId: "a",
	typeId: "inf",
	name: "Unit",
	men: 100,
	ranks: 5,
	position: { x: 100, y: 100 },
	facing,
});

describe("scenarios", () => {
	for (const scenario of SCENARIOS) {
		it(`${scenario.id} references only sides and types it defines`, () => {
			const sides = new Set(scenario.sides.map((s) => s.id));
			const types = new Set(scenario.unitTypes.map((t) => t.id));
			for (const u of scenario.units) {
				expect(sides, u.id).toContain(u.sideId);
				expect(types, u.id).toContain(u.typeId);
			}
		});

		it(`${scenario.id} has unique unit ids`, () => {
			const ids = scenario.units.map((u) => u.id);
			expect(new Set(ids).size).toBe(ids.length);
		});

		it(`${scenario.id} keeps every unit on the map`, () => {
			const types = unitTypeIndex(scenario);
			const { width, height } = scenario.map;
			for (const u of createBattle(scenario).units) {
				const type = types.get(u.typeId);
				if (!type) throw new Error(`missing type ${u.typeId}`);
				for (const c of unitCorners(u, type)) {
					expect(c.x, u.id).toBeGreaterThanOrEqual(0);
					expect(c.x, u.id).toBeLessThanOrEqual(width);
					expect(c.y, u.id).toBeGreaterThanOrEqual(0);
					expect(c.y, u.id).toBeLessThanOrEqual(height);
				}
			}
		});
	}

	it("createBattle copies positions so the scenario stays untouched", () => {
		const battle = createBattle(cannae);
		battle.units[0].position.x += 50;
		expect(cannae.units[0].position.x).not.toBe(battle.units[0].position.x);
	});
});

describe("formations", () => {
	it("sizes a formation from men, ranks and spacing", () => {
		expect(formationSize(unit(0), infantry)).toEqual({
			frontage: 20,
			depth: 10,
		});
	});

	it("puts the front edge on the side the unit faces", () => {
		// Facing south (+y): the front corners are the lower ones.
		const [fl, fr, br, bl] = unitCorners(unit(Math.PI / 2), infantry);
		expect(fl.y).toBeCloseTo(105);
		expect(fr.y).toBeCloseTo(105);
		expect(br.y).toBeCloseTo(95);
		expect(bl.y).toBeCloseTo(95);
		// Its left is east when facing south.
		expect(fl.x).toBeCloseTo(110);
	});

	it("finds the unit under a point, respecting its rotation", () => {
		const state = { scenarioId: "t", time: 0, units: [unit(Math.PI / 2)] };
		const types = new Map([["inf", infantry]]);
		// 20 m wide along x, 10 m deep along y.
		expect(unitAt(state, types, { x: 109, y: 104 })).not.toBeNull();
		expect(unitAt(state, types, { x: 104, y: 109 })).toBeNull();
		expect(unitAt(state, types, { x: 104, y: 109 }, 5)).not.toBeNull();
	});
});

describe("camera", () => {
	const view = { width: 800, height: 600 };

	it("converts between screen and world and back", () => {
		const cam = { center: { x: 1000, y: 500 }, zoom: 0.5 };
		const p = { x: 1234, y: 567 };
		const back = screenToWorld(cam, view, worldToScreen(cam, view, p));
		expect(back.x).toBeCloseTo(p.x);
		expect(back.y).toBeCloseTo(p.y);
	});

	it("keeps the point under the cursor still while zooming", () => {
		const cam = { center: { x: 1000, y: 500 }, zoom: 0.5 };
		const anchor = { x: 200, y: 450 };
		const before = screenToWorld(cam, view, anchor);
		const after = screenToWorld(zoomAt(cam, view, anchor, 2.5), view, anchor);
		expect(after.x).toBeCloseTo(before.x);
		expect(after.y).toBeCloseTo(before.y);
	});

	it("fits a map inside the viewport", () => {
		const cam = fitCamera(view, { x: 0, y: 0, width: 5000, height: 3400 }, 0);
		expect(cam.zoom).toBeCloseTo(800 / 5000);
		expect(cam.center).toEqual({ x: 2500, y: 1700 });
	});
});
