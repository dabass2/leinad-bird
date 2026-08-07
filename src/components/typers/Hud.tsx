import { Text } from "react-konva";

export type THud = {
	numCorrect: number;
	numMissed: number;
	fontSize: number;
};

export function Hud({ numCorrect, numMissed, fontSize }: THud) {
	return (
		<>
			<Text
				text={`Correct: ${numCorrect}`}
				x={20}
				y={30}
				fontSize={fontSize}
				fill="white"
				listening={false}
			/>
			<Text
				text={`Missed: ${numMissed}`}
				x={20}
				y={50}
				fontSize={fontSize}
				fill="white"
				listening={false}
			/>
		</>
	);
}
