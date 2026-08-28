import { TypersSettingsDialog } from "./TypersSettingsDialog";

export type TTypersHeader = {
	points: number;
	health: number;
	maxHealth: number;
	timeRemainingSeconds: number | null;
};

export function TypersHeader({
	points,
	health,
	maxHealth,
	timeRemainingSeconds,
}: TTypersHeader) {
	const healthPct = Math.max(0, Math.min(100, (health / maxHealth) * 100));
	const barColor =
		healthPct > 50
			? "bg-green-500"
			: healthPct > 20
				? "bg-yellow-500"
				: "bg-red-500";

	return (
		<div className="relative flex w-full items-center justify-center gap-6 py-2 text-sm font-semibold sm:text-base">
			<span>Points: {points}</span>
			<span>
				Time: {timeRemainingSeconds === null ? "∞" : `${timeRemainingSeconds}s`}
			</span>
			<div className="h-3 w-40 overflow-hidden rounded-full bg-neutral-700">
				<div
					className={`h-full rounded-full transition-all ${barColor}`}
					style={{ width: `${healthPct}%` }}
				/>
			</div>
			<div className="absolute right-2">
				<TypersSettingsDialog />
			</div>
		</div>
	);
}
