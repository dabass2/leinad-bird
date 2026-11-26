import { createFileRoute } from "@tanstack/react-router";
import { BattleMap } from "#/components/battle/BattleMap";

export const Route = createFileRoute("/games/battle")({
	component: BattleMap,
	ssr: false,
});
