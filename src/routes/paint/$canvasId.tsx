import { createFileRoute } from "@tanstack/react-router";
import { PaintWorkspace } from "#/components/paint/PaintWorkspace";
import { useViewportSize } from "#/hooks/useViewportSize";
import { HEADER_FOOTER_CHROME_PX } from "#/lib/typers-settings";

export const Route = createFileRoute("/paint/$canvasId")({
	component: RouteComponent,
	ssr: false,
	validateSearch: (search): { template?: string } => ({
		template: typeof search.template === "string" ? search.template : undefined,
	}),
});

function RouteComponent() {
	const { canvasId } = Route.useParams();
	const { template } = Route.useSearch();
	const { width, height } = useViewportSize(HEADER_FOOTER_CHROME_PX);
	return (
		<PaintWorkspace
			// Remount so switching canvases starts from fresh tool/view state
			key={canvasId}
			canvasId={canvasId}
			template={template}
			width={width}
			height={height}
		/>
	);
}
