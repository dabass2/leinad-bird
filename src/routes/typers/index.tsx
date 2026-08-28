import { createFileRoute } from "@tanstack/react-router";
import { TypersGame } from "#/components/typers/TypersGame";
import { useViewportSize } from "#/hooks/useViewportSize";
import { HEADER_FOOTER_CHROME_PX } from "#/lib/typers-settings";

export const Route = createFileRoute("/typers/")({
	component: RouteComponent,
	ssr: false,
});

function RouteComponent() {
	const { width, height } = useViewportSize(HEADER_FOOTER_CHROME_PX);
	return <TypersGame width={width} height={height} />;
}
