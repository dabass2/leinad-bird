import { generate } from "random-words";
import { useCallback, useEffect, useRef, useState } from "react";
import {
	findSpawnPosition,
	GAME_OVER_MISS_RATIO,
	getFallDelta,
	getNumWordsToSpawn,
	getTypersSettings,
} from "#/lib/typers-settings";
import type { TFallingWord } from "#/types/typers";

export type TTypersGameLoopParams = {
	width: number;
	height: number;
	scale: number;
};

export type TTypersGameLoop = {
	words: TFallingWord[];
	numCorrect: number;
	numMissed: number;
	gameOver: boolean;
	elapsedSeconds: number;
	submitTypedWord: (word: string) => boolean;
	reset: () => void;
};

export function useTypersGameLoop({
	width,
	height,
	scale,
}: TTypersGameLoopParams): TTypersGameLoop {
	const wordsRef = useRef<TFallingWord[]>([]);
	const startTimeRef = useRef(Date.now());
	const [numCorrect, setNumCorrect] = useState(0);
	const [numMissed, setNumMissed] = useState(0);
	const [gameOver, setGameOver] = useState(false);
	const [elapsedSeconds, setElapsedSeconds] = useState(0);

	const submitTypedWord = useCallback((word: string) => {
		const trimmed = word.trim();
		const initLength = wordsRef.current.length;
		wordsRef.current = wordsRef.current.filter((w) => w.text !== trimmed);
		const matched = wordsRef.current.length < initLength;
		if (matched) {
			setNumCorrect((c) => c + 1);
		}
		return matched;
	}, []);

	const reset = useCallback(() => {
		setNumCorrect(0);
		setNumMissed(0);
		wordsRef.current = [];
		startTimeRef.current = Date.now();
		setElapsedSeconds(0);
		setGameOver(false);
	}, []);

	useEffect(() => {
		if (
			numMissed > 0 &&
			numMissed > Math.floor((numMissed + numCorrect) * GAME_OVER_MISS_RATIO)
		) {
			setGameOver(true);
		}
	}, [numMissed, numCorrect]);

	useEffect(() => {
		if (gameOver || width === 0 || height === 0) return;
		let rafId = 0;
		const step = () => {
			const elapsed = (Date.now() - startTimeRef.current) / 1000;
			const settings = getTypersSettings(scale, elapsed, numCorrect);

			wordsRef.current = wordsRef.current
				.map((w) => {
					const newY = w.y + getFallDelta(w.size, settings.speedMultiplier);
					if (newY > height) {
						setNumMissed((m) => m + 1);
						return null;
					}
					return { ...w, y: newY };
				})
				.filter((w): w is TFallingWord => w !== null);

			const numWordsToSpawn = getNumWordsToSpawn(
				elapsed,
				numCorrect,
				settings.numWordsToSpawnCap,
			);

			if (wordsRef.current.length < numWordsToSpawn) {
				const text = generate({
					exactly: 1,
					maxLength: settings.maxWordLength,
				})[0];
				const wordScreenSize = (settings.wordFontSize * text.length) / 2;
				const pos = findSpawnPosition(
					width,
					wordScreenSize,
					settings.minWordSpacing,
					wordsRef.current,
				);
				if (pos !== null) {
					wordsRef.current.push({
						text,
						x: pos,
						y: 0,
						size: settings.wordFontSize,
					});
				}
			}

			setElapsedSeconds(elapsed);
			rafId = requestAnimationFrame(step);
		};
		rafId = requestAnimationFrame(step);
		return () => cancelAnimationFrame(rafId);
	}, [gameOver, width, height, numCorrect, scale]);

	return {
		words: wordsRef.current,
		numCorrect,
		numMissed,
		gameOver,
		elapsedSeconds,
		submitTypedWord,
		reset,
	};
}
