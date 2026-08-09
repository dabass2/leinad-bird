export type TFallingWord = {
	text: string;
	x: number;
	y: number;
	size: number;
};

export type TTypersSettings = {
	wordFontSize: number;
	minWordSpacing: number;
	gameOverFontSize: number;
	speedMultiplier: number;
	numWordsToSpawnCap: number;
	maxWordLength: number;
};
