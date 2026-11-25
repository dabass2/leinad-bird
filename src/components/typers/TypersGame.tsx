import { useCallback, useMemo } from "react";
import { Layer, Stage } from "react-konva";
import { useTheme } from "#/hooks/useTheme";
import {
	getClampedScale,
	getTypersSettings,
	TYPED_INPUT_BAR_HEIGHT,
	TYPERS_HEADER_HEIGHT,
} from "#/lib/typers-settings";
import {
	ASTEROID_TEXT_COLOR,
	ASTEROID_TEXT_STROKE_LIGHT,
	GAME_OVER_TEXT_COLORS,
} from "#/lib/typers-visuals";
import { FallingWords } from "./FallingWords";
import { GameOverOverlay } from "./GameOverOverlay";
import { Impacts } from "./Impacts";
import { Town } from "./Town";
import { TypedWordInput } from "./TypedWordInput";
import { TypersHeader } from "./TypersHeader";
import { useTypedWordInput } from "./useTypedWordInput";
import { useTypersGameLoop } from "./useTypersGameLoop";

export type TTypersGame = { width: number; height: number };

export function TypersGame({ width, height }: TTypersGame) {
	// Konva draws to canvas, so CSS variables can't reach it; pick per theme.
	const { theme } = useTheme();
	const gameOverColor = GAME_OVER_TEXT_COLORS[theme];
	const stageHeight = Math.max(
		height - TYPED_INPUT_BAR_HEIGHT - TYPERS_HEADER_HEIGHT,
		0,
	);
	const scale = useMemo(
		() => getClampedScale(width, stageHeight),
		[width, stageHeight],
	);
	const gameLoop = useTypersGameLoop({ width, height: stageHeight, scale });

	const { typedWord, inputRef, clearTypedWord, handleChange, handleKeyDown } =
		useTypedWordInput({
			disabled: gameLoop.gameOver,
			onSubmit: gameLoop.submitTypedWord,
		});

	const handleReset = useCallback(() => {
		clearTypedWord();
		gameLoop.reset();
	}, [clearTypedWord, gameLoop.reset]);

	const settings = getTypersSettings(
		scale,
		gameLoop.elapsedSeconds,
		gameLoop.wordsCaught,
		gameLoop.difficulty,
	);

	return (
		<div className="flex flex-col items-center" style={{ width, height }}>
			<TypersHeader
				points={gameLoop.points}
				health={gameLoop.health}
				maxHealth={gameLoop.maxHealth}
				timeRemainingSeconds={gameLoop.timeRemainingSeconds}
			/>
			<div className="border-y border-border">
				<Stage width={width} height={stageHeight}>
					<Layer>
						<Town
							health={gameLoop.health}
							maxHealth={gameLoop.maxHealth}
							width={width}
							height={stageHeight}
						/>
						{!gameLoop.gameOver && (
							<FallingWords
								words={gameLoop.words}
								width={width}
								color={ASTEROID_TEXT_COLOR}
								strokeColor={ASTEROID_TEXT_STROKE_LIGHT}
							/>
						)}
						<Impacts impacts={gameLoop.impacts} />
						<GameOverOverlay
							gameOver={gameLoop.gameOver}
							score={gameLoop.points}
							width={width}
							height={stageHeight}
							fontSize={settings.gameOverFontSize}
							color={gameOverColor}
							onReset={handleReset}
						/>
					</Layer>
				</Stage>
			</div>
			<div
				className="flex flex-1 items-center justify-center"
				style={{ height: TYPED_INPUT_BAR_HEIGHT }}
			>
				<TypedWordInput
					ref={inputRef}
					value={typedWord}
					onChange={handleChange}
					onKeyDown={handleKeyDown}
					disabled={gameLoop.gameOver}
				/>
			</div>
		</div>
	);
}
