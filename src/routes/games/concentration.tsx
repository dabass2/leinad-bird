import { createFileRoute } from "@tanstack/react-router";
import { Concentration } from "#/components/games/Concentration";

export const Route = createFileRoute("/games/concentration")({
	component: Concentration,
	// Boards are shuffled or seeded on load, so render on the client only.
	ssr: false,
});
