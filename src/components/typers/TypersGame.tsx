import { useCallback, useEffect, useMemo, useState } from "react";
import { Layer, Rect, Stage } from "react-konva";
import { getClampedScale, getTypersSettings } from "#/lib/typers-settings";
import { FallingWords } from "./FallingWords";
import { GameOverOverlay } from "./GameOverOverlay";
import { Hud } from "./Hud";
import { TypedWordDisplay } from "./TypedWordDisplay";
import { useTypedWordInput } from "./useTypedWordInput";
import { useTypersGameLoop } from "./useTypersGameLoop";

export type TTypersGame = { width: number; height: number };

function playSound(url: string) {
	new Audio(url).play();
}

export function TypersGame({ width, height }: TTypersGame) {
	const [soundOn, setSoundOn] = useState(false);
	const scale = useMemo(() => getClampedScale(width, height), [width, height]);
	const gameLoop = useTypersGameLoop({ width, height, scale });

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

	const { typedWord, clearTypedWord } = useTypedWordInput({
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
		gameLoop.numCorrect,
	);

	return (
		<Stage width={width} height={height}>
			<Layer>
				<Rect
					x={0}
					y={0}
					width={width}
					height={height}
					fill={soundOn ? "#964b00" : "#000000"}
					listening={false}
				/>
				{!gameLoop.gameOver && (
					<FallingWords words={gameLoop.words} width={width} />
				)}
				<TypedWordDisplay
					typedWord={typedWord}
					width={width}
					height={height}
					fontSize={settings.typedWordFontSize}
				/>
				<Hud
					numCorrect={gameLoop.numCorrect}
					numMissed={gameLoop.numMissed}
					fontSize={settings.hudFontSize}
				/>
				<GameOverOverlay
					gameOver={gameLoop.gameOver}
					score={gameLoop.numCorrect}
					width={width}
					height={height}
					fontSize={settings.gameOverFontSize}
					onReset={handleReset}
				/>
			</Layer>
		</Stage>
	);
}
