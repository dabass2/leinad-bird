import { useStore } from "@tanstack/react-store";
import { generate } from "random-words";
import { useCallback, useEffect, useRef, useState } from "react";
import {
	BASE_MISS_DAMAGE,
	DAMAGE_PER_CHAR,
	findSpawnPosition,
	getFallDelta,
	getNumWordsToSpawn,
	getTypersSettings,
	HEALTH_MAX,
	POINTS_PER_CHAR,
	type TDifficulty,
} from "#/lib/typers-settings";
import { typersSettingsStore } from "#/lib/typers-settings-store";
import type { TFallingWord } from "#/types/typers";

export type TTypersGameLoopParams = {
	width: number;
	height: number;
	scale: number;
};

export type TTypersGameLoop = {
	words: TFallingWord[];
	points: number;
	health: number;
	maxHealth: number;
	wordsCaught: number;
	gameOver: boolean;
	elapsedSeconds: number;
	timeRemainingSeconds: number | null;
	difficulty: TDifficulty;
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
	// tracks words successfully caught; drives difficulty pacing only, not displayed
	const [wordsCaught, setWordsCaught] = useState(0);
	const [points, setPoints] = useState(0);
	const [health, setHealth] = useState(HEALTH_MAX);
	const [gameOver, setGameOver] = useState(false);
	const [elapsedSeconds, setElapsedSeconds] = useState(0);
	const difficulty = useStore(typersSettingsStore, (s) => s.difficulty);
	const timeLengthSeconds = useStore(
		typersSettingsStore,
		(s) => s.timeLengthSeconds,
	);
	const endlessMode = useStore(typersSettingsStore, (s) => s.endlessMode);

	const submitTypedWord = useCallback((word: string) => {
		const trimmed = word.trim();
		const initLength = wordsRef.current.length;
		wordsRef.current = wordsRef.current.filter((w) => w.text !== trimmed);
		const matched = wordsRef.current.length < initLength;
		if (matched) {
			setWordsCaught((c) => c + 1);
			setPoints((p) => p + trimmed.length * POINTS_PER_CHAR);
		}
		return matched;
	}, []);

	const reset = useCallback(() => {
		setWordsCaught(0);
		setPoints(0);
		setHealth(HEALTH_MAX);
		wordsRef.current = [];
		startTimeRef.current = Date.now();
		setElapsedSeconds(0);
		setGameOver(false);
	}, []);

	useEffect(() => {
		if (health <= 0) {
			setGameOver(true);
		}
	}, [health]);

	const timeRemainingSeconds = endlessMode
		? null
		: Math.max(0, Math.ceil(timeLengthSeconds - elapsedSeconds));

	useEffect(() => {
		if (!endlessMode && elapsedSeconds >= timeLengthSeconds) {
			setGameOver(true);
		}
	}, [elapsedSeconds, endlessMode, timeLengthSeconds]);

	useEffect(() => {
		if (gameOver || width === 0 || height === 0) return;
		let rafId = 0;
		const step = () => {
			const elapsed = (Date.now() - startTimeRef.current) / 1000;
			const settings = getTypersSettings(
				scale,
				elapsed,
				wordsCaught,
				difficulty,
			);

			wordsRef.current = wordsRef.current
				.map((w) => {
					const newY = w.y + getFallDelta(w.size, settings.speedMultiplier);
					if (newY > height) {
						const damage = BASE_MISS_DAMAGE + w.text.length * DAMAGE_PER_CHAR;
						setHealth((h) => Math.max(0, h - damage));
						return null;
					}
					return { ...w, y: newY };
				})
				.filter((w): w is TFallingWord => w !== null);

			const numWordsToSpawn = getNumWordsToSpawn(
				elapsed,
				wordsCaught,
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
	}, [gameOver, width, height, wordsCaught, scale, difficulty]);

	return {
		words: wordsRef.current,
		points,
		health,
		maxHealth: HEALTH_MAX,
		wordsCaught,
		gameOver,
		elapsedSeconds,
		timeRemainingSeconds,
		difficulty,
		submitTypedWord,
		reset,
	};
}
