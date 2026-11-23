import { createServerFn } from "@tanstack/react-start";
import z from "zod";
import { getPaintCanvas, upsertPaintCanvas } from "#/db/queries";
import type { TPaintState } from "#/types/paint";

const canvasIdSchema = z.uuid();

const pointsSchema = z.array(z.number()).max(20_000);
const colorSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/);

const paintStateSchema = z.object({
	strokes: z
		.array(
			z.object({
				id: z.string().max(64),
				regionId: z.string().max(64),
				points: pointsSchema,
				color: colorSchema,
				strokeWidth: z.number().positive().max(500),
				isEraser: z.boolean().optional(),
			}),
		)
		.max(5_000),
	fills: z.record(z.string().max(64), colorSchema),
	regions: z
		.array(
			z.object({
				id: z.string().max(64),
				number: z.number(),
				labelPosition: z.object({ x: z.number(), y: z.number() }),
				points: pointsSchema,
			}),
		)
		.max(1_000),
}) satisfies z.ZodType<TPaintState>;

export const getPaintState = createServerFn({ method: "GET" })
	.inputValidator(z.object({ canvasId: canvasIdSchema }))
	.handler(async ({ data }): Promise<TPaintState | null> => {
		const raw = await getPaintCanvas(data.canvasId);
		if (!raw) return null;

		const parsed = paintStateSchema.safeParse(JSON.parse(raw));
		if (!parsed.success) {
			console.warn(`Discarding invalid paint state for ${data.canvasId}`);
			return null;
		}
		return parsed.data;
	});

export const savePaintState = createServerFn({ method: "POST" })
	.inputValidator(
		z.object({ canvasId: canvasIdSchema, state: paintStateSchema }),
	)
	.handler(async ({ data }) => {
		await upsertPaintCanvas(data.canvasId, JSON.stringify(data.state));
		return { success: true };
	});
