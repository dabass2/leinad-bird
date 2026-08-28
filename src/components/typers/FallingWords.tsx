import type { TFallingWord } from "#/types/typers";
import { Asteroid } from "./Asteroid";

export type TFallingWords = {
	words: TFallingWord[];
	width: number;
	color: string;
	strokeColor: string;
};

export function FallingWords({
	words,
	width,
	color,
	strokeColor,
}: TFallingWords) {
	return (
		<>
			{words.map((w) => (
				<Asteroid
					key={w.id}
					word={w}
					width={width}
					textColor={color}
					strokeColor={strokeColor}
				/>
			))}
		</>
	);
}
