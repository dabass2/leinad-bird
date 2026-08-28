import type Konva from "konva";
import { Text } from "react-konva";

export type TGameOverOverlay = {
	gameOver: boolean;
	score: number;
	width: number;
	height: number;
	fontSize: number;
	color: string;
	onReset: () => void;
};

export function GameOverOverlay({
	gameOver,
	score,
	width,
	height,
	fontSize,
	color,
	onReset,
}: TGameOverOverlay) {
	if (!gameOver) return null;

	// reset button font stays at the same 30/50 ratio to the game-over text as before
	const resetFontSize = fontSize * 0.6;

	const setCursor = (e: Konva.KonvaEventObject<Event>, cursor: string) => {
		const stage = e.target.getStage();
		if (stage) stage.container().style.cursor = cursor;
	};

	return (
		<>
			<Text
				text={`GAME OVER\nScore: ${score}`}
				x={width / 2}
				y={height / 2}
				fontSize={fontSize}
				fill={color}
				width={width}
				offsetX={width / 2}
				offsetY={fontSize}
				align="center"
				listening={false}
			/>
			<Text
				text="Reset"
				x={width / 2}
				y={height / 2 + 150}
				fontSize={resetFontSize}
				fill={color}
				width={120}
				offsetX={60}
				height={30}
				offsetY={15}
				align="center"
				wrap="none"
				onClick={onReset}
				onTap={onReset}
				onMouseEnter={(e) => setCursor(e, "pointer")}
				onMouseLeave={(e) => setCursor(e, "default")}
			/>
		</>
	);
}
