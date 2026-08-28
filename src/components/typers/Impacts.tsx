import { Circle, Group } from "react-konva";
import {
	hashStringToInt,
	IMPACT_COLOR,
	IMPACT_DURATION_MS,
} from "#/lib/typers-visuals";
import type { TImpact } from "#/types/typers";

export type TImpacts = {
	impacts: TImpact[];
};

const DEBRIS_COUNT = 5;

export function Impacts({ impacts }: TImpacts) {
	return (
		<>
			{impacts.map((impact) => {
				const progress = Math.min(
					1,
					Math.max(0, (Date.now() - impact.startedAt) / IMPACT_DURATION_MS),
				);
				const ringRadius = impact.size * 0.4 * (1 + progress * 1.5);
				const opacity = 1 - progress;
				const seed = hashStringToInt(impact.id);

				return (
					<Group key={impact.id} x={impact.x} y={impact.y} listening={false}>
						<Circle
							radius={ringRadius}
							stroke={IMPACT_COLOR}
							strokeWidth={3}
							opacity={opacity}
						/>
						{Array.from({ length: DEBRIS_COUNT }, (_, i) => {
							const angle =
								((seed + i * 97) % 360) * (Math.PI / 180) - Math.PI / 2;
							const distance = ringRadius * 1.4;
							return (
								<Circle
									key={i}
									x={Math.cos(angle) * distance}
									y={Math.sin(angle) * distance}
									radius={3}
									fill={IMPACT_COLOR}
									opacity={opacity}
								/>
							);
						})}
					</Group>
				);
			})}
		</>
	);
}
