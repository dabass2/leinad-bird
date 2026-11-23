import type Konva from "konva";
import { useRef, useState } from "react";
import { Group, Layer, Line, Stage } from "react-konva";
import { PAINT_OUTLINE_COLOR } from "#/lib/paint-diagrams";
import type { TPaintTool, TRegion, TStroke } from "#/types/paint";

type TKonvaPointerEvent = Konva.KonvaEventObject<PointerEvent>;

export type TPaintCanvas = {
	width: number;
	height: number;
	regions: TRegion[];
	strokes: TStroke[];
	fills: Record<string, string>;
	activeTool: TPaintTool;
	selectedColor: string;
	brushSize: number;
	paintInLines: boolean;
	onStrokesChange: (update: (prev: TStroke[]) => TStroke[]) => void;
	onFill: (regionId: string, color: string) => void;
	onColorPicked: (color: string) => void;
};

const getRelativePointerPosition = (stage: Konva.Stage) => {
	const pos = stage.getPointerPosition();
	if (!pos) return { x: 0, y: 0 };
	return stage.getAbsoluteTransform().copy().invert().point(pos);
};

const tracePolygon = (ctx: Konva.Context, points: number[]) => {
	ctx.beginPath();
	ctx.moveTo(points[0], points[1]);
	for (let i = 2; i < points.length; i += 2) {
		ctx.lineTo(points[i], points[i + 1]);
	}
	ctx.closePath();
};

export function PaintCanvas({
	width,
	height,
	regions,
	strokes,
	fills,
	activeTool,
	selectedColor,
	brushSize,
	paintInLines,
	onStrokesChange,
	onFill,
	onColorPicked,
}: TPaintCanvas) {
	const stageRef = useRef<Konva.Stage>(null);
	const [isDrawing, setIsDrawing] = useState(false);
	const [scale, setScale] = useState(1);
	const [position, setPosition] = useState({ x: 0, y: 0 });

	const handlePointerDown = (e: TKonvaPointerEvent) => {
		if (activeTool === "pan") return;

		const stage = e.target.getStage();
		const clickedId = e.target.id();
		if (!stage || !clickedId) return;

		if (activeTool === "picker") {
			if (clickedId.startsWith("stroke-")) {
				const strokeId = clickedId.slice("stroke-".length);
				const stroke = strokes.find((s) => s.id === strokeId);
				if (stroke && !stroke.isEraser) onColorPicked(stroke.color);
			} else if (clickedId.startsWith("hit-")) {
				const fill = fills[clickedId.slice("hit-".length)];
				if (fill) onColorPicked(fill);
			}
			return;
		}

		if (!clickedId.startsWith("hit-")) return;
		const regionId = clickedId.slice("hit-".length);

		if (activeTool === "fill") {
			onFill(regionId, selectedColor);
			return;
		}

		setIsDrawing(true);
		const point = getRelativePointerPosition(stage);
		const isEraser = activeTool === "eraser";
		const newStroke: TStroke = {
			id: `${Date.now()}`,
			regionId,
			points: [point.x, point.y],
			color: isEraser ? "#000000" : selectedColor,
			strokeWidth: brushSize,
			isEraser,
		};
		onStrokesChange((prev) => [...prev, newStroke]);
	};

	const handlePointerMove = (e: TKonvaPointerEvent) => {
		if (!isDrawing || activeTool === "pan") return;
		const stage = e.target.getStage();
		if (!stage) return;

		const point = getRelativePointerPosition(stage);
		onStrokesChange((prev) => {
			const last = prev.at(-1);
			if (!last) return prev;
			return [
				...prev.slice(0, -1),
				{ ...last, points: [...last.points, point.x, point.y] },
			];
		});
	};

	const handlePointerUp = () => setIsDrawing(false);

	const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
		e.evt.preventDefault();
		const stage = stageRef.current;
		const pointer = stage?.getPointerPosition();
		if (!stage || !pointer) return;

		const scaleBy = 1.1;
		const oldScale = stage.scaleX();
		const mousePointTo = {
			x: (pointer.x - stage.x()) / oldScale,
			y: (pointer.y - stage.y()) / oldScale,
		};
		const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;

		setScale(newScale);
		setPosition({
			x: pointer.x - mousePointTo.x * newScale,
			y: pointer.y - mousePointTo.y * newScale,
		});
	};

	const strokesByRegion = new Map<string, TStroke[]>();
	for (const stroke of strokes) {
		const list = strokesByRegion.get(stroke.regionId);
		if (list) list.push(stroke);
		else strokesByRegion.set(stroke.regionId, [stroke]);
	}
	const strokesListening = activeTool === "picker";

	return (
		<Stage
			ref={stageRef}
			width={width}
			height={height}
			onPointerDown={handlePointerDown}
			onPointerMove={handlePointerMove}
			onPointerUp={handlePointerUp}
			onPointerLeave={handlePointerUp}
			onWheel={handleWheel}
			draggable={activeTool === "pan"}
			scaleX={scale}
			scaleY={scale}
			x={position.x}
			y={position.y}
			onDragEnd={(e) => setPosition({ x: e.target.x(), y: e.target.y() })}
			className={
				activeTool === "pan"
					? "cursor-grab active:cursor-grabbing"
					: "cursor-crosshair"
			}
		>
			{/* Regions: fill + hit area, with strokes clipped to the region */}
			<Layer>
				{regions.map((region) => (
					<Group
						key={`group-${region.id}`}
						clipFunc={
							paintInLines
								? (ctx) => tracePolygon(ctx, region.points)
								: undefined
						}
					>
						<Line
							id={`hit-${region.id}`}
							points={region.points}
							closed
							fill={fills[region.id] ?? "rgba(0,0,0,0)"}
							perfectDrawEnabled={false}
						/>
						{strokesByRegion.get(region.id)?.map((stroke) => (
							<Line
								id={`stroke-${stroke.id}`}
								key={stroke.id}
								points={stroke.points}
								stroke={stroke.color}
								strokeWidth={stroke.strokeWidth}
								tension={0.5}
								lineCap="round"
								lineJoin="round"
								listening={strokesListening}
								globalCompositeOperation={
									stroke.isEraser ? "destination-out" : "source-over"
								}
							/>
						))}
					</Group>
				))}
			</Layer>

			{/* Line-art outlines, drawn above everything and non-interactive */}
			<Layer listening={false}>
				{regions.map((region) => (
					<Line
						key={`outline-${region.id}`}
						points={region.points}
						closed
						stroke={PAINT_OUTLINE_COLOR}
						strokeWidth={3}
						lineJoin="round"
						lineCap="round"
					/>
				))}
			</Layer>
		</Stage>
	);
}
