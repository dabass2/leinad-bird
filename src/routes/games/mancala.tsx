import { createFileRoute } from "@tanstack/react-router";
import { Mancala } from "#/components/games/Mancala";

export const Route = createFileRoute("/games/mancala")({
	component: Mancala,
	ssr: false,
});
