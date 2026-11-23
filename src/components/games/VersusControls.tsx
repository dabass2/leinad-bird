import { useState } from "react";
import { ToggleGroup, ToggleGroupItem } from "#/components/ui/toggle-group";
import type { Difficulty } from "#/hooks/useGame";
import type { Player } from "#/lib/games/engine";

export type Opponent = "computer" | "friend";

// The shared toggle items stretch and wrap by default; keep these on one line.
const ITEM = "flex-none whitespace-nowrap px-3";

/** Who's playing and how hard the computer tries, shared by the two-player games. */
export function useVersusSettings() {
	const [opponent, setOpponent] = useState<Opponent>("computer");
	const [difficulty, setDifficulty] = useState<Difficulty>("easy");

	const vsComputer = opponent === "computer";
	const playerName = (player: Player) =>
		vsComputer ? (player === 0 ? "You" : "Computer") : `Player ${player + 1}`;

	return {
		opponent,
		setOpponent,
		difficulty,
		setDifficulty,
		vsComputer,
		playerName,
	};
}

type VersusControlsProps = ReturnType<typeof useVersusSettings>;

export function VersusControls({
	opponent,
	setOpponent,
	difficulty,
	setDifficulty,
	vsComputer,
}: VersusControlsProps) {
	return (
		<>
			<ToggleGroup
				type="single"
				variant="outline"
				value={opponent}
				onValueChange={(value) => value && setOpponent(value as Opponent)}
				aria-label="Opponent"
			>
				<ToggleGroupItem value="computer" className={ITEM}>
					vs Computer
				</ToggleGroupItem>
				<ToggleGroupItem value="friend" className={ITEM}>
					2 Players
				</ToggleGroupItem>
			</ToggleGroup>
			{vsComputer && (
				<ToggleGroup
					type="single"
					variant="outline"
					value={difficulty}
					onValueChange={(value) => value && setDifficulty(value as Difficulty)}
					aria-label="Difficulty"
				>
					<ToggleGroupItem value="easy" className={ITEM}>
						Easy
					</ToggleGroupItem>
					<ToggleGroupItem value="hard" className={ITEM}>
						Hard
					</ToggleGroupItem>
				</ToggleGroup>
			)}
		</>
	);
}

/** "Your turn" style status for a two-player game. */
export function turnStatus(
	winner: Player | "draw" | null,
	turn: Player,
	playerName: (player: Player) => string,
) {
	if (winner === "draw") return "It's a draw.";
	if (winner !== null) {
		const name = playerName(winner);
		return name === "You" ? "You win!" : `${name} wins!`;
	}
	const name = playerName(turn);
	return name === "You" ? "Your turn" : `${name}'s turn`;
}

/** A small colored dot marking which player is which. */
export function PlayerDot({ player }: { player: Player }) {
	return (
		<span
			aria-hidden
			className="inline-block size-3 rounded-full align-middle"
			style={{ background: player === 0 ? "var(--game-p1)" : "var(--game-p2)" }}
		/>
	);
}
