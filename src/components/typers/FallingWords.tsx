import { Text } from "react-konva";
import type { TFallingWord } from "#/types/typers";

export type TFallingWords = {
	words: TFallingWord[];
	width: number;
};

export function FallingWords({ words, width }: TFallingWords) {
	return (
		<>
			{words.map((w, i) => (
				<Text
					key={`${w.text}-${i}`}
					text={w.text}
					x={w.x}
					y={w.y}
					fontSize={w.size}
					fill="white"
					width={width}
					offsetX={width / 2}
					offsetY={w.size / 2}
					align="center"
					wrap="none"
					listening={false}
				/>
			))}
		</>
	);
}
