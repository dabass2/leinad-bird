import { useCallback, useEffect, useState } from "react";
import {
	type AiOptions,
	chooseMove,
	type Game,
	type Player,
	randomSeed,
	type TwoPlayerGame,
} from "#/lib/games/engine";

/** Holds a game's state and runs actions through its `apply`. */
export function useGame<S, A>(game: Game<S, A>) {
	const [state, setState] = useState(() => game.setup(randomSeed()));

	const dispatch = useCallback(
		(action: A) => setState((current) => game.apply(current, action)),
		[game],
	);
	const reset = useCallback(() => setState(game.setup(randomSeed())), [game]);

	return { state, dispatch, reset, isOver: game.isOver(state) };
}

export type Difficulty = "easy" | "hard";

/**
 * Plays `player`'s turns with the minimax opponent. The short delay makes the
 * computer's move readable instead of instant.
 */
export function useComputerOpponent<S, M>(
	game: TwoPlayerGame<S, M>,
	state: S,
	dispatch: (move: M) => void,
	{
		player,
		enabled,
		ai,
		delayMs = 450,
	}: { player: Player; enabled: boolean; ai: AiOptions; delayMs?: number },
) {
	const isComputersTurn =
		enabled && !game.isOver(state) && game.currentPlayer(state) === player;

	useEffect(() => {
		if (!isComputersTurn) return;
		const id = setTimeout(() => {
			const move = chooseMove(game, state, ai);
			if (move !== null) dispatch(move);
		}, delayMs);
		return () => clearTimeout(id);
	}, [isComputersTurn, game, state, dispatch, ai, delayMs]);

	return isComputersTurn;
}

/** A best score kept in localStorage. Lower is better when `lowerIsBetter`. */
export function useBestScore(key: string, lowerIsBetter = false) {
	const storageKey = `games:best:${key}`;
	const [best, setBest] = useState<number | null>(() => {
		try {
			const saved = localStorage.getItem(storageKey);
			return saved === null ? null : Number(saved);
		} catch {
			return null;
		}
	});

	const submit = useCallback(
		(score: number) => {
			setBest((current) => {
				const isBetter =
					current === null ||
					(lowerIsBetter ? score < current : score > current);
				if (!isBetter) return current;
				try {
					localStorage.setItem(storageKey, String(score));
				} catch {
					// Storage can be blocked; the best score just won't survive a reload.
				}
				return score;
			});
		},
		[storageKey, lowerIsBetter],
	);

	return [best, submit] as const;
}
