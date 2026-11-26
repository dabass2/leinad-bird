import { createFileRoute } from "@tanstack/react-router";
import { BattleView } from "#/components/battle/BattleView";
import { cannae } from "#/lib/battle/scenarios/cannae";

export const Route = createFileRoute("/games/battle")({
	component: () => <BattleView scenario={cannae} />,
	ssr: false,
});
