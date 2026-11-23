import { createFileRoute } from "@tanstack/react-router";
import { PaintWorkspace } from "#/components/paint/PaintWorkspace";
import { useViewportSize } from "#/hooks/useViewportSize";
import { HEADER_FOOTER_CHROME_PX } from "#/lib/typers-settings";

export const Route = createFileRoute("/paint/")({
	component: RouteComponent,
	ssr: false,
});

function RouteComponent() {
	const { width, height } = useViewportSize(HEADER_FOOTER_CHROME_PX);
	return <PaintWorkspace width={width} height={height} />;
}
