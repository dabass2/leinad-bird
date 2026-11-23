import { createFileRoute } from "@tanstack/react-router";
import { DotsAndBoxes } from "#/components/games/DotsAndBoxes";

export const Route = createFileRoute("/games/dots-and-boxes")({
	component: DotsAndBoxes,
	// Boards are shuffled or seeded on load, so render on the client only.
	ssr: false,
});
