import { Application, extend, useTick } from "@pixi/react";
import { createFileRoute } from "@tanstack/react-router";
import { Container, Graphics, Text } from "pixi.js";
import { generate } from "random-words";
import { useCallback, useEffect, useRef, useState } from "react";

extend({
	Container,
	Graphics,
	Text,
});

function Game({ width, height }: { width: number; height: number }) {
	const wordsRef = useRef<
		{ text: string; x: number; y: number; size: number }[]
	>([]);
	const [tick, setTick] = useState(0);
	const [typedWord, setTypedWord] = useState("");
	const [numCorrect, setNumCorrect] = useState(0);
	const [numMissed, setNumMissed] = useState(0);
	const [soundOn, setSoundOn] = useState(false);
	const [gameOver, setGameOver] = useState(false);

	const numWordsToSpawn = Math.max(
		Math.floor(3 * Math.log10(numMissed + numCorrect * (0.01 * width))),
		1,
	);

	const checkForMatches = useCallback(() => {
		const initLength = wordsRef.current.length;
		wordsRef.current = wordsRef.current.filter(
			(w) => w.text !== typedWord.trim(),
		);
		if (initLength > wordsRef.current.length) {
			setNumCorrect((c) => c + 1);
			if (soundOn) {
				const num = Math.ceil(Math.random() * 5);
				new Audio(`https://leinad.dev/bird/correct_${num}.mp3`).play();
			}
		}
	}, [typedWord, soundOn]);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (gameOver) return;

			if (e.key === "Enter") {
				checkForMatches();
				setTypedWord("");
			} else if (e.key === "Backspace") {
				setTypedWord((prev) => prev.slice(0, -1));
			} else if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
				setTypedWord((prev) => prev + e.key);
			}
			if (e.ctrlKey && e.shiftKey && e.key === "F") {
				setSoundOn(true);
				setTypedWord("");
				setNumCorrect(0);
				setNumMissed(0);
				wordsRef.current = [];
				setGameOver(false);
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [checkForMatches, gameOver]);

	useEffect(() => {
		if (
			numMissed > 0 &&
			numMissed > Math.floor((numMissed + numCorrect) * 0.5)
		) {
			setGameOver(true);
			if (soundOn) {
				new Audio("https://leinad.dev/bird/game_over.mp3").play();
			}
		}
	}, [numMissed, numCorrect, soundOn]);

	useTick(() => {
		if (gameOver) return;
		const speedMultiplier = 1 + numCorrect * 0.02;
		wordsRef.current = wordsRef.current
			.map((w) => {
				const newY = w.y + (w.size / (20 / (height * 0.001))) * speedMultiplier;
				if (newY > height) {
					setNumMissed((m) => m + 1);
					return null;
				}
				return { ...w, y: newY };
			})
			.filter(Boolean) as {
			text: string;
			x: number;
			y: number;
			size: number;
		}[];
		if (wordsRef.current.length < numWordsToSpawn) {
			const maxLength = Math.min(4 + Math.floor(numCorrect / 5), 15);
			const text = generate({ exactly: 1, maxLength })[0];
			const size = 70;
			const wordScreenSize = (size * text.length) / 2;
			const minSpacing = 50;

			let pos: number;
			let validPos = false;
			let attempts = 0;

			while (!validPos && attempts < 10) {
				pos = Math.floor(Math.random() * width);

				// Clamp position to keep word on screen
				if (pos - wordScreenSize < 0) {
					pos = wordScreenSize * 0.5;
				} else if (pos + wordScreenSize > width) {
					pos = width - wordScreenSize * 0.5;
				}

				// Check if this position overlaps with any existing word
				validPos = !wordsRef.current.some((w) => {
					const distance = Math.abs(pos - w.x);
					const wWordScreenSize = (w.size * w.text.length) / 2;
					return distance < wordScreenSize + wWordScreenSize + minSpacing;
				});

				attempts++;
			}

			if (validPos) {
				wordsRef.current.push({ text, x: pos, y: 0, size });
			}
		}
		setTick((t) => t + 1);
	});

	const resetGame = () => {
		setNumCorrect(0);
		setNumMissed(0);
		setTypedWord("");
		wordsRef.current = [];
		setSoundOn(false);
		setGameOver(false);
	};

	return (
		<pixiContainer>
			<pixiGraphics
				draw={(g: Graphics) => {
					g.clear();
					g.setFillStyle({ color: soundOn ? 0x964b00 : 0x000000 });
					g.rect(0, 0, width, height);
					g.fill();
				}}
			/>
			{!gameOver &&
				wordsRef.current.map((w, i) => (
					<pixiText
						key={`${w.text}-${i}`}
						text={w.text}
						x={w.x}
						y={w.y}
						style={{ fontSize: w.size, fill: "white" }}
						anchor={0.5}
					/>
				))}
			<pixiText
				text={typedWord}
				x={width / 2}
				y={height - 20}
				style={{ fontSize: 50, fill: "white" }}
				anchor={0.5}
			/>
			<pixiText
				text={`Correct: ${numCorrect}`}
				x={20}
				y={30}
				style={{ fontSize: 20, fill: "white" }}
			/>
			<pixiText
				text={`Missed: ${numMissed}`}
				x={20}
				y={50}
				style={{ fontSize: 20, fill: "white" }}
			/>
			{gameOver && (
				<>
					<pixiText
						text={`GAME OVER\nScore: ${numCorrect}`}
						x={width / 2}
						y={height / 2}
						style={{ fontSize: 50, fill: "white", align: "center" }}
						anchor={0.5}
					/>
					<pixiText
						text="Reset"
						x={width / 2}
						y={height / 2 + 150}
						style={{ fontSize: 30, fill: "white" }}
						anchor={0.5}
						interactive
						onPointerDown={resetGame}
					/>
				</>
			)}
		</pixiContainer>
	);
}

export const Route = createFileRoute("/typers/")({
	component: RouteComponent,
	ssr: false,
});

function RouteComponent() {
	const [width, setWidth] = useState(window?.innerWidth);
	const [height, setHeight] = useState(window?.innerHeight - 100);

	useEffect(() => {
		const handleResize = () => {
			setWidth(window?.innerWidth);
			setHeight(window?.innerHeight - 100);
		};
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);

	return (
		<Application width={width} height={height}>
			<Game width={width} height={height} />
		</Application>
	);
}
