import type { QueryClient } from "@tanstack/react-query";
import {
	createRootRouteWithContext,
	HeadContent,
	Scripts,
} from "@tanstack/react-router";
import Footer from "../components/Footer";
import Header from "../components/Header";
import TanStackQueryProvider from "../integrations/tanstack-query/root-provider";
import { THEME_INIT_SCRIPT } from "../lib/theme";
import appCss from "../styles.css?url";

interface MyRouterContext {
	queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			{
				title: "Leinad",
			},
		],
		links: [
			{
				rel: "stylesheet",
				href: appCss,
			},
			{
				rel: "icon",
				href: `${import.meta.env.BASE_URL}favicon.ico`,
				sizes: "48x48",
			},
			{
				rel: "icon",
				href: `${import.meta.env.BASE_URL}favicon.svg`,
				type: "image/svg+xml",
			},
			{
				rel: "apple-touch-icon",
				href: `${import.meta.env.BASE_URL}apple-touch-icon.png`,
			},
			{ rel: "manifest", href: `${import.meta.env.BASE_URL}manifest.json` },
		],
	}),
	shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				{/** biome-ignore lint/security/noDangerouslySetInnerHtml: static script that sets the theme class before first paint to avoid a flash */}
				<script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
				<HeadContent />
			</head>
			<body className="flex flex-col font-sans antialiased wrap-anywhere selection:bg-(--selection)">
				<TanStackQueryProvider>
					<Header />
					<div className="flex-1">{children}</div>
					<Footer />
				</TanStackQueryProvider>
				<Scripts />
			</body>
		</html>
	);
}
