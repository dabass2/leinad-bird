export type TFallingWord = {
	id: string;
	text: string;
	x: number;
	y: number;
	size: number;
	rotation: number;
	variant: number;
};

export type TImpact = {
	id: string;
	x: number;
	y: number;
	size: number;
	startedAt: number;
};

export type TTypersSettings = {
	wordFontSize: number;
	minWordSpacing: number;
	gameOverFontSize: number;
	speedMultiplier: number;
	numWordsToSpawnCap: number;
	maxWordLength: number;
};
