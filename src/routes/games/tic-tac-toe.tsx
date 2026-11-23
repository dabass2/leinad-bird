import { createFileRoute } from "@tanstack/react-router";
import { TicTacToe } from "#/components/games/TicTacToe";

export const Route = createFileRoute("/games/tic-tac-toe")({
	component: TicTacToe,
	// Boards are shuffled or seeded on load, so render on the client only.
	ssr: false,
});
