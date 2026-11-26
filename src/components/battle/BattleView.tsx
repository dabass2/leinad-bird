import { Link } from "@tanstack/react-router";
import { ArrowLeft, Maximize, Minus, Plus } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "#/components/ui/button";
import { useTheme } from "#/hooks/useTheme";
import {
	createBattle,
	formationSize,
	unitAt,
	unitTypeIndex,
} from "#/lib/battle/battle";
import {
	type Camera,
	fitCamera,
	pan,
	screenToWorld,
	type Viewport,
	zoomAt,
} from "#/lib/battle/camera";
import { PALETTES, renderBattle } from "#/lib/battle/render";
import type { Scenario, UnitState, UnitType, Vec2 } from "#/lib/battle/types";

/** Pointer travel (px) below which a press counts as a click, not a drag. */
const CLICK_SLOP = 5;
/** Extra screen pixels around each unit that still count as clicking it. */
const PICK_SLOP_PX = 6;

const formatYear = (year: number) => (year < 0 ? `${-year} BC` : `AD ${year}`);

/**
 * Hosts the canvas and wires input to the camera. React only owns the UI
 * around the map; the map itself is redrawn by `renderBattle` whenever
 * something it shows changes, without going through React renders.
 */
export function BattleView({ scenario }: { scenario: Scenario }) {
	const types = useMemo(() => unitTypeIndex(scenario), [scenario]);
	const state = useMemo(() => createBattle(scenario), [scenario]);
	const { theme } = useTheme();
	const [selectedId, setSelectedId] = useState<string | null>(null);

	const canvasRef = useRef<HTMLCanvasElement>(null);
	const viewRef = useRef<Viewport>({ width: 0, height: 0 });
	const cameraRef = useRef<Camera | null>(null);
	const frameRef = useRef(0);

	// Everything the draw needs, read fresh each frame.
	const drawInputs = useRef({ theme, selectedId });
	drawInputs.current = { theme, selectedId };

	const requestDraw = useCallback(() => {
		if (frameRef.current) return;
		frameRef.current = requestAnimationFrame(() => {
			frameRef.current = 0;
			const canvas = canvasRef.current;
			const camera = cameraRef.current;
			const ctx = canvas?.getContext("2d");
			if (!canvas || !camera || !ctx) return;
			renderBattle({
				ctx,
				view: viewRef.current,
				pixelRatio: window.devicePixelRatio || 1,
				camera,
				scenario,
				state,
				types,
				palette: PALETTES[drawInputs.current.theme],
				selectedId: drawInputs.current.selectedId,
			});
		});
	}, [scenario, state, types]);

	const setCamera = useCallback(
		(next: Camera) => {
			cameraRef.current = next;
			requestDraw();
		},
		[requestDraw],
	);

	const fitMap = useCallback(() => {
		setCamera(
			fitCamera(viewRef.current, {
				x: 0,
				y: 0,
				width: scenario.map.width,
				height: scenario.map.height,
			}),
		);
	}, [scenario, setCamera]);

	// Redraw when theme or selection changes.
	// biome-ignore lint/correctness/useExhaustiveDependencies: theme and selection are read through drawInputs, but a change to either needs a redraw.
	useEffect(() => {
		requestDraw();
	}, [theme, selectedId, requestDraw]);

	// Match the canvas backing store to its CSS size and the screen density.
	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const observer = new ResizeObserver(([entry]) => {
			const { width, height } = entry.contentRect;
			const ratio = window.devicePixelRatio || 1;
			canvas.width = Math.round(width * ratio);
			canvas.height = Math.round(height * ratio);
			viewRef.current = { width, height };
			if (!cameraRef.current) fitMap();
			else requestDraw();
		});
		observer.observe(canvas);
		return () => {
			observer.disconnect();
			cancelAnimationFrame(frameRef.current);
			frameRef.current = 0;
		};
	}, [fitMap, requestDraw]);

	// Wheel zoom needs a non-passive listener to stop the page scrolling.
	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const onWheel = (e: WheelEvent) => {
			e.preventDefault();
			if (!cameraRef.current) return;
			const rect = canvas.getBoundingClientRect();
			const anchor = { x: e.clientX - rect.left, y: e.clientY - rect.top };
			setCamera(
				zoomAt(
					cameraRef.current,
					viewRef.current,
					anchor,
					Math.exp(-e.deltaY * 0.0015),
				),
			);
		};
		canvas.addEventListener("wheel", onWheel, { passive: false });
		return () => canvas.removeEventListener("wheel", onWheel);
	}, [setCamera]);

	// Drag to pan, pinch to zoom, tap to select.
	const pointers = useRef(new Map<number, Vec2>());
	const dragDistance = useRef(0);

	const localPoint = (e: React.PointerEvent): Vec2 => {
		const rect = e.currentTarget.getBoundingClientRect();
		return { x: e.clientX - rect.left, y: e.clientY - rect.top };
	};

	const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
		e.currentTarget.setPointerCapture(e.pointerId);
		pointers.current.set(e.pointerId, localPoint(e));
		if (pointers.current.size === 1) dragDistance.current = 0;
	};

	const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
		const prev = pointers.current.get(e.pointerId);
		const camera = cameraRef.current;
		if (!prev || !camera) return;
		const next = localPoint(e);

		if (pointers.current.size === 1) {
			const dx = next.x - prev.x;
			const dy = next.y - prev.y;
			dragDistance.current += Math.hypot(dx, dy);
			pointers.current.set(e.pointerId, next);
			setCamera(pan(camera, dx, dy));
			return;
		}

		// Two fingers: zoom by the change in spread, pan by the midpoint.
		pointers.current.set(e.pointerId, next);
		dragDistance.current = Number.POSITIVE_INFINITY;
		const other = [...pointers.current].find(([id]) => id !== e.pointerId)?.[1];
		if (!other) return;
		const spreadBefore = Math.hypot(other.x - prev.x, other.y - prev.y);
		const spreadAfter = Math.hypot(other.x - next.x, other.y - next.y);
		if (spreadBefore < 1) return;
		const midBefore = midpoint(other, prev);
		const midAfter = midpoint(other, next);
		const zoomed = zoomAt(
			camera,
			viewRef.current,
			midAfter,
			spreadAfter / spreadBefore,
		);
		setCamera(pan(zoomed, midAfter.x - midBefore.x, midAfter.y - midBefore.y));
	};

	const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
		const wasTap =
			pointers.current.size === 1 && dragDistance.current < CLICK_SLOP;
		pointers.current.delete(e.pointerId);
		const camera = cameraRef.current;
		if (!wasTap || !camera) return;
		const world = screenToWorld(camera, viewRef.current, localPoint(e));
		const hit = unitAt(state, types, world, PICK_SLOP_PX / camera.zoom);
		setSelectedId(hit?.id ?? null);
	};

	const zoomBy = (factor: number) => {
		const camera = cameraRef.current;
		if (!camera) return;
		const view = viewRef.current;
		setCamera(
			zoomAt(camera, view, { x: view.width / 2, y: view.height / 2 }, factor),
		);
	};

	const selected = state.units.find((u) => u.id === selectedId) ?? null;
	const selectedType = selected ? types.get(selected.typeId) : undefined;
	const selectedSide = selected
		? scenario.sides.find((s) => s.id === selected.sideId)
		: undefined;

	return (
		<main className="page-wrap px-4 pt-6 pb-10">
			<Link
				to="/games"
				className="inline-flex items-center gap-1 text-sm font-semibold text-(--sea-ink-soft)! no-underline hover:underline"
			>
				<ArrowLeft className="size-4" /> All games
			</Link>

			<header className="mt-3 mb-4">
				<h1 className="m-0 text-4xl font-extrabold tracking-tight text-(--sea-ink)">
					{scenario.name}{" "}
					<span className="text-xl font-bold text-(--sea-ink-soft)">
						{formatYear(scenario.year)}
					</span>
				</h1>
				<p className="mt-1 mb-0 max-w-2xl text-sm text-(--sea-ink-soft)">
					{scenario.summary}
				</p>
			</header>

			<div className="relative overflow-hidden rounded-2xl border border-(--game-line)">
				<canvas
					ref={canvasRef}
					className="block h-[70vh] min-h-80 w-full cursor-grab touch-none active:cursor-grabbing"
					aria-label={`Map of the battle of ${scenario.name}`}
					onPointerDown={onPointerDown}
					onPointerMove={onPointerMove}
					onPointerUp={onPointerUp}
					onPointerCancel={onPointerUp}
				/>

				<div className="absolute top-3 right-3 flex flex-col gap-1.5">
					<Button
						size="icon"
						variant="outline"
						aria-label="Zoom in"
						onClick={() => zoomBy(1.5)}
					>
						<Plus />
					</Button>
					<Button
						size="icon"
						variant="outline"
						aria-label="Zoom out"
						onClick={() => zoomBy(1 / 1.5)}
					>
						<Minus />
					</Button>
					<Button
						size="icon"
						variant="outline"
						aria-label="Show whole map"
						onClick={fitMap}
					>
						<Maximize />
					</Button>
				</div>

				{selected && selectedType && selectedSide && (
					<div className="absolute bottom-3 right-3 max-w-64 rounded-xl border border-(--game-line) bg-(--surface-strong) p-3 text-sm text-(--sea-ink) shadow-sm">
						<div className="flex items-center gap-2 font-bold">
							<span
								className="inline-block size-3 rounded-sm"
								style={{ backgroundColor: selectedSide.color }}
							/>
							{selected.name}
						</div>
						<dl className="mt-1.5 mb-0 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-(--sea-ink-soft)">
							<dt>Troops</dt>
							<dd className="m-0">{selectedType.name}</dd>
							<dt>Men</dt>
							<dd className="m-0">{selected.men.toLocaleString()}</dd>
							<dt>Formation</dt>
							<dd className="m-0">{formatFormation(selected, selectedType)}</dd>
						</dl>
					</div>
				)}
			</div>

			<ul className="mt-3 mb-0 flex flex-wrap gap-x-5 gap-y-1 p-0 text-sm text-(--sea-ink-soft) list-none">
				{scenario.sides.map((side) => (
					<li key={side.id} className="inline-flex items-center gap-1.5">
						<span
							className="inline-block size-3 rounded-sm"
							style={{ backgroundColor: side.color }}
						/>
						{side.name}:{" "}
						{state.units
							.filter((u) => u.sideId === side.id)
							.reduce((n, u) => n + u.men, 0)
							.toLocaleString()}{" "}
						men
					</li>
				))}
				<li>Drag to pan, scroll or pinch to zoom, click a unit for details.</li>
			</ul>
		</main>
	);
}

function midpoint(a: Vec2, b: Vec2): Vec2 {
	return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

function formatFormation(unit: UnitState, type: UnitType) {
	const { frontage, depth } = formationSize(unit, type);
	return `${unit.ranks} ranks, ${Math.round(frontage)} × ${Math.round(depth)} m`;
}
