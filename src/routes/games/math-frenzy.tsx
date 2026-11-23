import { createFileRoute } from "@tanstack/react-router";
import { MathFrenzy } from "#/components/games/MathFrenzy";

export const Route = createFileRoute("/games/math-frenzy")({
	component: MathFrenzy,
	// Boards are shuffled or seeded on load, so render on the client only.
	ssr: false,
});
