import { createFileRoute } from "@tanstack/react-router";
import { PaintCanvasPicker } from "#/components/paint/PaintCanvasPicker";

export const Route = createFileRoute("/paint/")({
	component: PaintCanvasPicker,
	ssr: false,
});
