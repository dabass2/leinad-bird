import { Text } from "react-konva";

export type TTypedWordDisplay = {
	typedWord: string;
	width: number;
	height: number;
	fontSize: number;
};

export function TypedWordDisplay({
	typedWord,
	width,
	height,
	fontSize,
}: TTypedWordDisplay) {
	return (
		<Text
			text={typedWord}
			x={width / 2}
			y={height - 20}
			fontSize={fontSize}
			fill="white"
			width={width}
			offsetX={width / 2}
			offsetY={fontSize / 2}
			align="center"
			wrap="none"
			listening={false}
		/>
	);
}
