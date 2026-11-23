import { useEffect, useRef, useState } from "react";
import {
	defaultDiagramGenerator,
	PAINT_MAX_DIAGRAM_SIZE,
} from "#/lib/paint-diagrams";
import { getPaintState, savePaintState } from "#/routes/paint/-paint.functions";
import type {
	TDiagramGenerator,
	TPaintTool,
	TRegion,
	TStroke,
} from "#/types/paint";
import { PaintCanvas } from "./PaintCanvas";
import { PaintToolbar, type TPaintToolbar } from "./PaintToolbar";

const CANVAS_ID_KEY = "paint-canvas-id";
const PAN_HOLD_KEYS = new Set(["Alt", "Meta", " "]);
const TOOL_SHORTCUTS: Record<string, TPaintTool> = {
	p: "draw",
	e: "eraser",
	h: "pan",
	f: "fill",
	i: "picker",
};

type TEyeDropper = { open: () => Promise<{ sRGBHex: string }> };
declare global {
	interface Window {
		EyeDropper?: new () => TEyeDropper;
	}
}

/** Stable per-browser id so each visitor gets their own saved canvas. */
function getCanvasId() {
	let id = localStorage.getItem(CANVAS_ID_KEY);
	if (!id) {
		id = crypto.randomUUID();
		localStorage.setItem(CANVAS_ID_KEY, id);
	}
	return id;
}

function generateDiagram(
	generator: TDiagramGenerator,
	width: number,
	height: number,
) {
	return generator.generate(
		Math.min(width, PAINT_MAX_DIAGRAM_SIZE.width),
		Math.min(height, PAINT_MAX_DIAGRAM_SIZE.height),
	);
}

export type TPaintWorkspace = { width: number; height: number };

export function PaintWorkspace({ width, height }: TPaintWorkspace) {
	const [canvasId] = useState(getCanvasId);
	const [regions, setRegions] = useState<TRegion[]>(() =>
		generateDiagram(defaultDiagramGenerator, width, height),
	);
	const [strokes, setStrokes] = useState<TStroke[]>([]);
	const [fills, setFills] = useState<Record<string, string>>({});
	const [activeTool, setActiveTool] = useState<TPaintTool>("draw");
	const [selectedColor, setSelectedColor] = useState("#ef4444");
	const [brushSize, setBrushSize] = useState(15);
	const [paintInLines, setPaintInLines] = useState(true);
	const [saveStatus, setSaveStatus] =
		useState<TPaintToolbar["saveStatus"]>("idle");

	// Tool to return to after a temporary pan (held key) or a one-shot pick
	const previousToolRef = useRef<TPaintTool | null>(null);
	const toolbarRef = useRef<HTMLDivElement>(null);
	const [toolbarHeight, setToolbarHeight] = useState(0);

	useEffect(() => {
		const el = toolbarRef.current;
		if (!el) return;
		const observer = new ResizeObserver(([entry]) =>
			setToolbarHeight(entry.borderBoxSize[0]?.blockSize ?? 0),
		);
		observer.observe(el);
		return () => observer.disconnect();
	}, []);

	// Restore this browser's saved canvas, if any
	useEffect(() => {
		let cancelled = false;
		getPaintState({ data: { canvasId } })
			.then((saved) => {
				if (cancelled || !saved) return;
				setRegions(saved.regions);
				setStrokes(saved.strokes);
				setFills(saved.fills);
			})
			.catch((err) => console.error("Failed to load paint state", err));
		return () => {
			cancelled = true;
		};
	}, [canvasId]);

	// Any edit after a save means the saved indicator is stale
	// biome-ignore lint/correctness/useExhaustiveDependencies: reset on content change only
	useEffect(() => {
		setSaveStatus((s) => (s === "saved" ? "idle" : s));
	}, [strokes, fills, regions]);

	const changeTool = async (tool: TPaintTool) => {
		if (tool === "picker" && window.EyeDropper) {
			try {
				const result = await new window.EyeDropper().open();
				setSelectedColor(result.sRGBHex);
			} catch {
				// user cancelled
			}
			return;
		}
		if (tool === "picker") previousToolRef.current = activeTool;
		setActiveTool(tool);
	};

	useEffect(() => {
		const TEXT_INPUT_TYPES = new Set(["text", "search", "email", "number"]);
		const isTyping = ({ target }: KeyboardEvent) =>
			target instanceof HTMLElement &&
			(target.isContentEditable ||
				target instanceof HTMLTextAreaElement ||
				(target instanceof HTMLInputElement &&
					TEXT_INPUT_TYPES.has(target.type)));

		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.repeat || isTyping(e)) return;
			if (PAN_HOLD_KEYS.has(e.key)) {
				if (e.key === " ") e.preventDefault(); // don't scroll the page
				if (activeTool !== "pan") {
					previousToolRef.current = activeTool;
					setActiveTool("pan");
				}
				return;
			}
			if (e.ctrlKey || e.metaKey || e.altKey) return;
			const tool = TOOL_SHORTCUTS[e.key.toLowerCase()];
			if (tool) {
				previousToolRef.current = null;
				setActiveTool(tool);
			}
		};

		const handleKeyUp = (e: KeyboardEvent) => {
			if (!PAN_HOLD_KEYS.has(e.key)) return;
			if (activeTool === "pan" && previousToolRef.current) {
				setActiveTool(previousToolRef.current);
				previousToolRef.current = null;
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		window.addEventListener("keyup", handleKeyUp);
		return () => {
			window.removeEventListener("keydown", handleKeyDown);
			window.removeEventListener("keyup", handleKeyUp);
		};
	}, [activeTool]);

	const handleFill = (regionId: string, color: string) => {
		setFills((prev) => ({ ...prev, [regionId]: color }));
		// Drop strokes in this region so the new fill isn't hidden underneath them
		setStrokes((prev) => prev.filter((s) => s.regionId !== regionId));
	};

	const handleColorPicked = (color: string) => {
		setSelectedColor(color);
		setActiveTool(previousToolRef.current ?? "draw");
		previousToolRef.current = null;
	};

	const handleNewDiagram = (generator: TDiagramGenerator) => {
		setRegions(generateDiagram(generator, width, height - toolbarHeight));
		setStrokes([]);
		setFills({});
	};

	const handleSave = async () => {
		setSaveStatus("saving");
		try {
			await savePaintState({
				data: { canvasId, state: { strokes, fills, regions } },
			});
			setSaveStatus("saved");
		} catch (err) {
			console.error("Failed to save paint state", err);
			setSaveStatus("error");
		}
	};

	return (
		<div className="flex flex-col" style={{ height }}>
			<div ref={toolbarRef}>
				<PaintToolbar
					activeTool={activeTool}
					onToolChange={changeTool}
					selectedColor={selectedColor}
					onColorChange={setSelectedColor}
					brushSize={brushSize}
					onBrushSizeChange={setBrushSize}
					paintInLines={paintInLines}
					onPaintInLinesChange={setPaintInLines}
					onNewDiagram={handleNewDiagram}
					onClear={() => {
						setStrokes([]);
						setFills({});
					}}
					onSave={handleSave}
					saveStatus={saveStatus}
				/>
			</div>
			<div className="flex-1 overflow-hidden">
				<PaintCanvas
					width={width}
					height={Math.max(0, height - toolbarHeight)}
					regions={regions}
					strokes={strokes}
					fills={fills}
					activeTool={activeTool}
					selectedColor={selectedColor}
					brushSize={brushSize}
					paintInLines={paintInLines}
					onStrokesChange={setStrokes}
					onFill={handleFill}
					onColorPicked={handleColorPicked}
				/>
			</div>
		</div>
	);
}
