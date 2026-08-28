import { useMemo } from "react";
import { Circle, Group, Path, Text } from "react-konva";
import {
	ASTEROID_CRATER_COLOR,
	ASTEROID_INSCRIBED_FRACTION,
	ASTEROID_PATH_VIEWBOX,
	ASTEROID_PATHS,
	ASTEROID_ROCK_COLOR,
	hashStringToInt,
	measureTextWidth,
} from "#/lib/typers-visuals";
import type { TFallingWord } from "#/types/typers";

export type TAsteroid = {
	word: TFallingWord;
	width: number;
	textColor: string;
	strokeColor: string;
};

// simple deterministic PRNG so a given word's craters look stable across renders
function mulberry32(seed: number): () => number {
	let a = seed;
	return () => {
		a |= 0;
		a = (a + 0x6d2b79f5) | 0;
		let t = Math.imul(a ^ (a >>> 15), 1 | a);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

export function Asteroid({ word, width, textColor, strokeColor }: TAsteroid) {
	const rockDiameter = useMemo(() => {
		const textWidth = measureTextWidth(word.text, word.size);
		const textHeight = word.size * 1.15;
		const diagonal = Math.sqrt(textWidth ** 2 + textHeight ** 2);
		const needed = diagonal / ASTEROID_INSCRIBED_FRACTION;
		return Math.max(needed, word.size * 2);
	}, [word.size, word.text]);

	const scale = rockDiameter / ASTEROID_PATH_VIEWBOX;
	const rockPath = ASTEROID_PATHS[word.variant % ASTEROID_PATHS.length];

	const craters = useMemo(() => {
		const rand = mulberry32(hashStringToInt(word.text));
		const count = 2 + Math.floor(rand() * 3);
		const radius = rockDiameter / 2;
		return Array.from({ length: count }, () => {
			const angle = rand() * Math.PI * 2;
			const distance = radius * (0.55 + rand() * 0.3);
			return {
				x: Math.cos(angle) * distance,
				y: Math.sin(angle) * distance,
				radius: radius * (0.1 + rand() * 0.1),
			};
		});
	}, [word.text, rockDiameter]);

	return (
		<Group x={word.x} y={word.y} rotation={word.rotation} listening={false}>
			<Path
				data={rockPath}
				offsetX={ASTEROID_PATH_VIEWBOX / 2}
				offsetY={ASTEROID_PATH_VIEWBOX / 2}
				scaleX={scale}
				scaleY={scale}
				fill={ASTEROID_ROCK_COLOR}
			/>
			{craters.map((crater, i) => (
				<Circle
					key={`${word.id}-crater-${i}`}
					x={crater.x}
					y={crater.y}
					radius={crater.radius}
					fill={ASTEROID_CRATER_COLOR}
					opacity={0.35}
				/>
			))}
			<Text
				text={word.text}
				fontSize={word.size}
				fill={textColor}
				stroke={strokeColor}
				strokeWidth={Math.max(1, word.size * 0.05)}
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
