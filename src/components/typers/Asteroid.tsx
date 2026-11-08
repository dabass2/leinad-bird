import { useMemo } from "react";
import { Circle, Group, Path, Text } from "react-konva";
import {
	ASTEROID_CRATER_COLOR,
	ASTEROID_INSCRIBED_FRACTION,
	ASTEROID_PATH_VIEWBOX,
	ASTEROID_PATHS,
	ASTEROID_RIM_COLOR,
	ASTEROID_ROCK_COLOR,
	ASTEROID_ROCK_HIGHLIGHT_COLOR,
	ASTEROID_ROCK_SHADOW_COLOR,
	createSeededRandom,
	getAsteroidDiameter,
	hashStringToInt,
} from "#/lib/typers-visuals";
import type { TFallingWord } from "#/types/typers";

export type TAsteroid = {
	word: TFallingWord;
	width: number;
	textColor: string;
	strokeColor: string;
};

const VIEWBOX_CENTER = ASTEROID_PATH_VIEWBOX / 2;

// light comes from the top-left; the gradient is in path (viewbox) units
const ROCK_GRADIENT = {
	fillRadialGradientStartPoint: {
		x: VIEWBOX_CENTER - 14,
		y: VIEWBOX_CENTER - 16,
	},
	fillRadialGradientStartRadius: 0,
	fillRadialGradientEndPoint: { x: VIEWBOX_CENTER, y: VIEWBOX_CENTER },
	fillRadialGradientEndRadius: VIEWBOX_CENTER * 1.1,
	fillRadialGradientColorStops: [
		0,
		ASTEROID_ROCK_HIGHLIGHT_COLOR,
		0.55,
		ASTEROID_ROCK_COLOR,
		1,
		ASTEROID_ROCK_SHADOW_COLOR,
	],
};

export function Asteroid({ word, width, textColor, strokeColor }: TAsteroid) {
	const rockDiameter = useMemo(
		() => getAsteroidDiameter(word.text, word.size),
		[word.size, word.text],
	);

	const scale = rockDiameter / ASTEROID_PATH_VIEWBOX;
	const rockPath = ASTEROID_PATHS[word.variant % ASTEROID_PATHS.length];

	// craters sit above/below the text band and stay inside the rock outline
	const craters = useMemo(() => {
		const rand = createSeededRandom(hashStringToInt(word.text));
		const count = 2 + Math.floor(rand() * 2);
		const safeRadius = (rockDiameter / 2) * ASTEROID_INSCRIBED_FRACTION;
		const startSide = rand() < 0.5 ? -1 : 1;
		return Array.from({ length: count }, (_, i) => {
			const side = (i % 2 === 0 ? startSide : -startSide) * (Math.PI / 2);
			const angle = side + (rand() - 0.5) * Math.PI * 0.9;
			const radius = safeRadius * (0.12 + rand() * 0.12);
			const distance = safeRadius * (0.5 + rand() * 0.2);
			return {
				x: Math.cos(angle) * distance,
				y: Math.sin(angle) * distance,
				radius: Math.min(radius, safeRadius - distance),
			};
		});
	}, [word.text, rockDiameter]);

	return (
		<Group x={word.x} y={word.y} rotation={word.rotation} listening={false}>
			<Path
				data={rockPath}
				offsetX={VIEWBOX_CENTER}
				offsetY={VIEWBOX_CENTER}
				scaleX={scale}
				scaleY={scale}
				{...ROCK_GRADIENT}
				stroke={ASTEROID_RIM_COLOR}
				strokeWidth={Math.max(1.5, rockDiameter * 0.015)}
				strokeScaleEnabled={false}
			/>
			{craters.map((crater, i) => (
				<Group key={`${word.id}-crater-${i}`} x={crater.x} y={crater.y}>
					<Circle
						radius={crater.radius}
						fill={ASTEROID_ROCK_HIGHLIGHT_COLOR}
						opacity={0.7}
					/>
					<Circle
						x={-crater.radius * 0.15}
						y={-crater.radius * 0.15}
						radius={crater.radius * 0.88}
						fill={ASTEROID_CRATER_COLOR}
						opacity={0.8}
					/>
				</Group>
			))}
			<Text
				text={word.text}
				fontSize={word.size}
				fill={textColor}
				stroke={strokeColor}
				strokeWidth={Math.max(1, word.size * 0.035)}
				lineJoin="round"
				fillAfterStrokeEnabled
				width={width}
				offsetX={width / 2}
				offsetY={word.size / 2}
				align="center"
				wrap="none"
				rotation={-word.rotation}
			/>
		</Group>
	);
}
