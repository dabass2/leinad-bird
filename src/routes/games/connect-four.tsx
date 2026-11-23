import { createFileRoute } from "@tanstack/react-router";
import { ConnectFour } from "#/components/games/ConnectFour";

export const Route = createFileRoute("/games/connect-four")({
	component: ConnectFour,
	// Boards are shuffled or seeded on load, so render on the client only.
	ssr: false,
});
