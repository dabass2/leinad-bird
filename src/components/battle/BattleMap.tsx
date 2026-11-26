import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Application, Container } from "pixi.js";
import { useEffect, useRef, useState } from "react";
import { drawTerrain, type TerrainRules } from "#/lib/battle/terrain";
import { parseTiledMap, type TiledMapJson } from "#/lib/battle/tiled";

const MAP_URL = "/battle/maps/test-map.tmj";
const TERRAIN_URL = "/battle/terrain.json";

async function fetchJson<T>(url: string): Promise<T> {
	const res = await fetch(url);
	if (!res.ok) throw new Error(`Couldn't load ${url} (${res.status}).`);
	return res.json();
}

export function BattleMap() {
	const hostRef = useRef<HTMLDivElement>(null);
	const [mapName, setMapName] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const host = hostRef.current;
		if (!host) return;
		const app = new Application();
		const ready = app.init({
			resizeTo: host,
			backgroundAlpha: 0,
			antialias: true,
			autoDensity: true,
			resolution: window.devicePixelRatio || 1,
		});
		let cancelled = false;

		(async () => {
			const [mapJson, rules] = await Promise.all([
				fetchJson<TiledMapJson>(MAP_URL),
				fetchJson<TerrainRules>(TERRAIN_URL),
				ready,
			]);
			if (cancelled) return;
			host.appendChild(app.canvas);

			const map = parseTiledMap(mapJson);
			// Everything in the map lives in `world`; moving or scaling it is
			// the camera. For now it just fits the whole map on screen.
			const world = new Container();
			world.addChild(drawTerrain(map, rules));
			app.stage.addChild(world);

			const mapWidth = map.width * map.tileSize;
			const mapHeight = map.height * map.tileSize;
			const fitToScreen = () => {
				const { width, height } = app.screen;
				const scale = Math.min(width / mapWidth, height / mapHeight);
				world.scale.set(scale);
				world.position.set(
					(width - mapWidth * scale) / 2,
					(height - mapHeight * scale) / 2,
				);
			};
			fitToScreen();
			app.renderer.on("resize", fitToScreen);
			setMapName(map.name);
		})().catch((e: unknown) => {
			if (!cancelled) setError(e instanceof Error ? e.message : String(e));
		});

		return () => {
			cancelled = true;
			// Pixi can't be destroyed mid-init, so wait for init to settle first.
			ready.then(
				() => app.destroy(true, { children: true }),
				() => {},
			);
		};
	}, []);

	return (
		<main className="page-wrap px-4 pt-6 pb-10">
			<Link
				to="/games"
				className="inline-flex items-center gap-1 text-sm font-semibold text-(--sea-ink-soft)! no-underline hover:underline"
			>
				<ArrowLeft className="size-4" /> All games
			</Link>

			<h1 className="mt-3 mb-4 text-4xl font-extrabold tracking-tight text-(--sea-ink)">
				{mapName ?? "Battle"}
			</h1>

			{error && (
				<p className="mt-0 mb-4 rounded-lg border border-(--danger-line) bg-(--danger-soft) px-3 py-2 text-sm text-(--sea-ink)">
					{error}
				</p>
			)}

			<div
				ref={hostRef}
				className="h-[70vh] min-h-80 w-full overflow-hidden rounded-2xl border border-(--game-line)"
			/>
		</main>
	);
}
