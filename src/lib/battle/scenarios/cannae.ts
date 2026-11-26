import type { Scenario, UnitSetup } from "../types";

/**
 * Cannae, 216 BC, as the two armies stood before contact. Numbers follow the
 * usual modern estimates; terrain and exact positions are a simplification.
 * The Aufidus river guards the west flank, Romans to the north facing south.
 */

const NORTH = -Math.PI / 2;
const SOUTH = Math.PI / 2;

// Roman legions: eight very deep blocks packed shoulder to shoulder.
const ROMAN_BLOCK_MEN = 8000;
const ROMAN_BLOCK_RANKS = 36;
const ROMAN_LINE_Y = 1300;
const romanBlockWidth = Math.ceil(ROMAN_BLOCK_MEN / ROMAN_BLOCK_RANKS) * 1;
const romanGap = 20;
const romanLineWidth = 8 * romanBlockWidth + 7 * romanGap;
const romanLeftEdge = 2500 - romanLineWidth / 2;

const romanLegions: UnitSetup[] = Array.from({ length: 8 }, (_, i) => ({
	id: `rome-legion-${i + 1}`,
	sideId: "rome",
	typeId: "legionary",
	name: i < 4 ? `Roman legion ${i + 1}` : `Allied legion ${i - 3}`,
	men: ROMAN_BLOCK_MEN,
	ranks: ROMAN_BLOCK_RANKS,
	position: {
		x: romanLeftEdge + romanBlockWidth / 2 + i * (romanBlockWidth + romanGap),
		y: ROMAN_LINE_Y,
	},
	facing: SOUTH,
}));

// Hannibal's center bows toward the Romans: five blocks set along an arc,
// each turned to face out from the arc's center.
const CRESCENT_RADIUS = 1500;
const CRESCENT_STEP = 0.18;
const CRESCENT_TIP = { x: 2500, y: 1730 };

const crescent: UnitSetup[] = [
	"Gallic warband 1",
	"Spanish infantry 1",
	"Gallic warband 2",
	"Spanish infantry 2",
	"Gallic warband 3",
].map((name, i) => {
	const angle = (i - 2) * CRESCENT_STEP;
	return {
		id: `carthage-center-${i + 1}`,
		sideId: "carthage",
		typeId: name.startsWith("Gallic") ? "gallic-warrior" : "spanish-infantry",
		name,
		men: 4000,
		ranks: 16,
		position: {
			x: CRESCENT_TIP.x + CRESCENT_RADIUS * Math.sin(angle),
			y: CRESCENT_TIP.y + CRESCENT_RADIUS * (1 - Math.cos(angle)),
		},
		facing: NORTH + angle,
	};
});

export const cannae: Scenario = {
	id: "cannae",
	name: "Cannae",
	year: -216,
	summary:
		"Hannibal's outnumbered army faces two Roman consuls on the plain by the Aufidus. His center is thin and bowed forward; his best infantry wait on the wings.",
	map: {
		width: 5000,
		height: 3400,
		areas: [
			{
				kind: "hill",
				points: [
					{ x: 1250, y: 2700 },
					{ x: 1650, y: 2620 },
					{ x: 1900, y: 2850 },
					{ x: 1750, y: 3150 },
					{ x: 1350, y: 3180 },
					{ x: 1150, y: 2950 },
				],
			},
			{
				kind: "town",
				label: "Cannae",
				points: [
					{ x: 1430, y: 2830 },
					{ x: 1600, y: 2810 },
					{ x: 1630, y: 2950 },
					{ x: 1450, y: 2970 },
				],
			},
			{
				kind: "camp",
				label: "Roman camp",
				points: [
					{ x: 2300, y: 300 },
					{ x: 2700, y: 300 },
					{ x: 2700, y: 600 },
					{ x: 2300, y: 600 },
				],
			},
			{
				kind: "camp",
				label: "Carthaginian camp",
				points: [
					{ x: 2050, y: 2700 },
					{ x: 2450, y: 2700 },
					{ x: 2450, y: 3000 },
					{ x: 2050, y: 3000 },
				],
			},
			{
				kind: "marsh",
				points: [
					{ x: 600, y: 1500 },
					{ x: 880, y: 1450 },
					{ x: 940, y: 1750 },
					{ x: 820, y: 2050 },
					{ x: 560, y: 1900 },
				],
			},
			{
				kind: "forest",
				points: [
					{ x: 4300, y: 2500 },
					{ x: 4850, y: 2400 },
					{ x: 4950, y: 3000 },
					{ x: 4400, y: 3250 },
					{ x: 4150, y: 2900 },
				],
			},
		],
		lines: [
			{
				kind: "river",
				label: "Aufidus",
				width: 60,
				points: [
					{ x: 700, y: 0 },
					{ x: 820, y: 500 },
					{ x: 760, y: 1000 },
					{ x: 920, y: 1500 },
					{ x: 860, y: 2100 },
					{ x: 980, y: 2600 },
					{ x: 900, y: 3400 },
				],
			},
			{
				kind: "road",
				width: 8,
				points: [
					{ x: 2500, y: 600 },
					{ x: 2600, y: 1000 },
					{ x: 3400, y: 2000 },
					{ x: 3600, y: 3400 },
				],
			},
			{
				kind: "road",
				width: 8,
				points: [
					{ x: 1600, y: 2830 },
					{ x: 2050, y: 2850 },
				],
			},
		],
	},
	sides: [
		{ id: "rome", name: "Rome", color: "#b5432f" },
		{ id: "carthage", name: "Carthage", color: "#2f5f8f" },
	],
	unitTypes: [
		{
			id: "legionary",
			name: "Legionaries",
			category: "heavy-infantry",
			fileWidth: 1,
			rankDepth: 1.2,
			speed: 1.2,
		},
		{
			id: "velites",
			name: "Velites",
			category: "light-infantry",
			fileWidth: 2,
			rankDepth: 2,
			speed: 1.6,
		},
		{
			id: "roman-cavalry",
			name: "Roman cavalry",
			category: "cavalry",
			fileWidth: 1.5,
			rankDepth: 3,
			speed: 3,
		},
		{
			id: "gallic-warrior",
			name: "Gallic warriors",
			category: "heavy-infantry",
			fileWidth: 1.2,
			rankDepth: 1.2,
			speed: 1.3,
		},
		{
			id: "spanish-infantry",
			name: "Spanish infantry",
			category: "heavy-infantry",
			fileWidth: 1,
			rankDepth: 1.2,
			speed: 1.3,
		},
		{
			id: "african-infantry",
			name: "African veterans",
			category: "heavy-infantry",
			fileWidth: 1,
			rankDepth: 1.2,
			speed: 1.2,
		},
		{
			id: "skirmisher",
			name: "Slingers and javelinmen",
			category: "light-infantry",
			fileWidth: 2,
			rankDepth: 2,
			speed: 1.6,
		},
		{
			id: "heavy-cavalry",
			name: "Spanish and Gallic cavalry",
			category: "cavalry",
			fileWidth: 1.5,
			rankDepth: 3,
			speed: 3,
		},
		{
			id: "numidian-cavalry",
			name: "Numidian light cavalry",
			category: "cavalry",
			fileWidth: 2,
			rankDepth: 3,
			speed: 3.5,
		},
	],
	units: [
		// ---- Rome ----
		...romanLegions,
		{
			id: "rome-cavalry",
			sideId: "rome",
			typeId: "roman-cavalry",
			name: "Roman cavalry (Paullus)",
			men: 2400,
			ranks: 8,
			position: { x: romanLeftEdge - romanGap - 225, y: ROMAN_LINE_Y },
			facing: SOUTH,
		},
		{
			id: "rome-allied-cavalry",
			sideId: "rome",
			typeId: "roman-cavalry",
			name: "Allied cavalry (Varro)",
			men: 4800,
			ranks: 10,
			position: {
				x: romanLeftEdge + romanLineWidth + romanGap + 360,
				y: ROMAN_LINE_Y,
			},
			facing: SOUTH,
		},
		{
			id: "rome-velites-1",
			sideId: "rome",
			typeId: "velites",
			name: "Velites (west)",
			men: 4000,
			ranks: 8,
			position: { x: 2000, y: 1400 },
			facing: SOUTH,
		},
		{
			id: "rome-velites-2",
			sideId: "rome",
			typeId: "velites",
			name: "Velites (east)",
			men: 4000,
			ranks: 8,
			position: { x: 3000, y: 1400 },
			facing: SOUTH,
		},

		// ---- Carthage ----
		...crescent,
		{
			id: "carthage-africans-west",
			sideId: "carthage",
			typeId: "african-infantry",
			name: "African veterans (west)",
			men: 5000,
			ranks: 16,
			position: { x: 1678, y: 1900 },
			facing: NORTH,
		},
		{
			id: "carthage-africans-east",
			sideId: "carthage",
			typeId: "african-infantry",
			name: "African veterans (east)",
			men: 5000,
			ranks: 16,
			position: { x: 3322, y: 1900 },
			facing: NORTH,
		},
		{
			id: "carthage-heavy-cavalry",
			sideId: "carthage",
			typeId: "heavy-cavalry",
			name: "Heavy cavalry (Hasdrubal)",
			men: 6500,
			ranks: 20,
			position: { x: 1257, y: 1900 },
			facing: NORTH,
		},
		{
			id: "carthage-numidians",
			sideId: "carthage",
			typeId: "numidian-cavalry",
			name: "Numidian cavalry (Maharbal)",
			men: 3500,
			ranks: 8,
			position: { x: 3937, y: 1900 },
			facing: NORTH,
		},
		{
			id: "carthage-skirmishers-1",
			sideId: "carthage",
			typeId: "skirmisher",
			name: "Balearic slingers",
			men: 4000,
			ranks: 8,
			position: { x: 2000, y: 1620 },
			facing: NORTH,
		},
		{
			id: "carthage-skirmishers-2",
			sideId: "carthage",
			typeId: "skirmisher",
			name: "Lonchophoroi",
			men: 4000,
			ranks: 8,
			position: { x: 3000, y: 1620 },
			facing: NORTH,
		},
	],
};
