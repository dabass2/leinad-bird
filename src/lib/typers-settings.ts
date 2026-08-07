import type { TFallingWord, TTypersSettings } from "#/types/typers";

export const VIEWPORT_BOUNDS = {
	minWidth: 360,
	minHeight: 640,
	maxWidth: 1920,
	maxHeight: 1080,
} as const;

export const SCALE_BOUNDS = { min: 0.75, max: 1.5 } as const;

export const HEADER_FOOTER_CHROME_PX = 100;
export const TYPED_INPUT_BAR_HEIGHT = 72;

export const BASE_WORD_FONT_SIZE = 70;
export const BASE_MIN_WORD_SPACING = 50;
export const BASE_HUD_FONT_SIZE = 20;
export const BASE_GAME_OVER_FONT_SIZE = 50;
// tuned so a word at BASE_WORD_FONT_SIZE falls ~2.8px/frame at speedMultiplier 1,
// matching the feel of the old height-based formula at a typical desktop height
export const BASE_FALL_SPEED_FACTOR = 0.04;
export const MAX_WORDS_TO_SPAWN_BASE = 12;
export const WORDS_TO_SPAWN_CAP_RANGE = { min: 6, max: 20 } as const;
export const GAME_OVER_MISS_RATIO = 0.5;
export const SPAWN_POSITION_ATTEMPTS = 10;

function clamp(value: number, min: number, max: number): number {
	return Math.min(Math.max(value, min), max);
}

export function getClampedScale(width: number, height: number): number {
	const wT =
		(clamp(width, VIEWPORT_BOUNDS.minWidth, VIEWPORT_BOUNDS.maxWidth) -
			VIEWPORT_BOUNDS.minWidth) /
		(VIEWPORT_BOUNDS.maxWidth - VIEWPORT_BOUNDS.minWidth);
	const hT =
		(clamp(height, VIEWPORT_BOUNDS.minHeight, VIEWPORT_BOUNDS.maxHeight) -
			VIEWPORT_BOUNDS.minHeight) /
		(VIEWPORT_BOUNDS.maxHeight - VIEWPORT_BOUNDS.minHeight);
	const t = Math.min(wT, hT);
	return SCALE_BOUNDS.min + t * (SCALE_BOUNDS.max - SCALE_BOUNDS.min);
}

export function getTypersSettings(
	scale: number,
	elapsedSeconds: number,
	numCorrect: number,
): TTypersSettings {
	return {
		wordFontSize: BASE_WORD_FONT_SIZE * scale,
		minWordSpacing: BASE_MIN_WORD_SPACING * scale,
		hudFontSize: BASE_HUD_FONT_SIZE * scale,
		gameOverFontSize: BASE_GAME_OVER_FONT_SIZE * scale,
		speedMultiplier: 1 + numCorrect * 0.03 + elapsedSeconds * 0.01,
		numWordsToSpawnCap: clamp(
			Math.round(MAX_WORDS_TO_SPAWN_BASE * scale),
			WORDS_TO_SPAWN_CAP_RANGE.min,
			WORDS_TO_SPAWN_CAP_RANGE.max,
		),
		maxWordLength: clamp(4 + Math.floor(numCorrect / 5), 4, 15),
	};
}

export function getFallDelta(
	wordSize: number,
	speedMultiplier: number,
): number {
	return wordSize * BASE_FALL_SPEED_FACTOR * speedMultiplier;
}

export function getNumWordsToSpawn(
	elapsedSeconds: number,
	numCorrect: number,
	cap: number,
): number {
	const difficultyFactor = numCorrect * 0.8 + elapsedSeconds * 0.15;
	return clamp(Math.floor(1 + difficultyFactor / 3), 1, cap);
}

export function findSpawnPosition(
	width: number,
	wordScreenSize: number,
	minSpacing: number,
	existingWords: TFallingWord[],
): number | null {
	let pos = Math.floor(Math.random() * width);
	let validPos = false;
	let attempts = 0;

	while (!validPos && attempts < SPAWN_POSITION_ATTEMPTS) {
		if (pos - wordScreenSize < 0) {
			pos = wordScreenSize * 0.5;
		} else if (pos + wordScreenSize > width) {
			pos = width - wordScreenSize * 0.5;
		}

		validPos = !existingWords.some((w) => {
			const distance = Math.abs(pos - w.x);
			const wWordScreenSize = (w.size * w.text.length) / 2;
			return distance < wordScreenSize + wWordScreenSize + minSpacing;
		});

		attempts++;
	}

	return validPos ? pos : null;
}
