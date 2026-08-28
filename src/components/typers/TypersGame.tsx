import { useCallback, useEffect, useMemo, useState } from "react";
import { Layer, Rect, Stage } from "react-konva";
import {
	getClampedScale,
	getTypersSettings,
	TYPED_INPUT_BAR_HEIGHT,
	TYPERS_HEADER_HEIGHT,
} from "#/lib/typers-settings";
import {
	ASTEROID_TEXT_STROKE_DARK,
	ASTEROID_TEXT_STROKE_LIGHT,
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

function playSound(url: string) {
	new Audio(url).play();
}

function getCssColor(property: string, fallback: string): string {
	return (
		getComputedStyle(document.documentElement)
			.getPropertyValue(property)
			.trim() || fallback
	);
}

export function TypersGame({ width, height }: TTypersGame) {
	const [soundOn, setSoundOn] = useState(false);
	const [wordColor] = useState(() => getCssColor("--sea-ink", "black"));
	const wordStrokeColor =
		wordColor === "black"
			? ASTEROID_TEXT_STROKE_LIGHT
			: ASTEROID_TEXT_STROKE_DARK;
	const stageHeight = Math.max(
		height - TYPED_INPUT_BAR_HEIGHT - TYPERS_HEADER_HEIGHT,
		0,
	);
	const scale = useMemo(
		() => getClampedScale(width, stageHeight),
		[width, stageHeight],
	);
	const gameLoop = useTypersGameLoop({ width, height: stageHeight, scale });

	const handleSubmit = useCallback(
		(word: string) => {
			const matched = gameLoop.submitTypedWord(word);
			if (matched && soundOn) {
				const num = Math.ceil(Math.random() * 5);
				playSound(`https://leinad.dev/bird/correct_${num}.mp3`);
			}
		},
		[gameLoop.submitTypedWord, soundOn],
	);

	const handleCheatReset = useCallback(() => {
		setSoundOn(true);
		gameLoop.reset();
	}, [gameLoop.reset]);

	const { typedWord, inputRef, clearTypedWord, handleChange, handleKeyDown } =
		useTypedWordInput({
			disabled: gameLoop.gameOver,
			onSubmit: handleSubmit,
			onCheatReset: handleCheatReset,
		});

	const handleReset = useCallback(() => {
		setSoundOn(false);
		clearTypedWord();
		gameLoop.reset();
	}, [clearTypedWord, gameLoop.reset]);

	useEffect(() => {
		if (gameLoop.gameOver && soundOn) {
			playSound("https://leinad.dev/bird/game_over.mp3");
		}
	}, [gameLoop.gameOver, soundOn]);

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
						{soundOn && (
							<Rect
								x={0}
								y={0}
								width={width}
								height={stageHeight}
								fill="#964b00"
								listening={false}
							/>
						)}
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
								color={wordColor}
								strokeColor={wordStrokeColor}
							/>
						)}
						<Impacts impacts={gameLoop.impacts} />
						<GameOverOverlay
							gameOver={gameLoop.gameOver}
							score={gameLoop.points}
							width={width}
							height={stageHeight}
							fontSize={settings.gameOverFontSize}
							color={wordColor}
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
