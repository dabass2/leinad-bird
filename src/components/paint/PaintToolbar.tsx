import { Link } from "@tanstack/react-router";
import {
	ArrowLeft,
	Eraser,
	Hand,
	Lock,
	Minus,
	PaintBucket,
	Paintbrush,
	Pipette,
	Plus,
	RefreshCcw,
	Save,
	Unlock,
} from "lucide-react";
import { Button } from "#/components/ui/button";
import { Separator } from "#/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "#/components/ui/toggle-group";
import { PAINT_BRUSH_BOUNDS } from "#/lib/paint-diagrams";
import type { TPaintTool } from "#/types/paint";

const TOOLS: {
	id: TPaintTool;
	label: string;
	shortcut: string;
	Icon: typeof Paintbrush;
}[] = [
	{ id: "draw", label: "Brush", shortcut: "P", Icon: Paintbrush },
	{ id: "eraser", label: "Eraser", shortcut: "E", Icon: Eraser },
	{ id: "fill", label: "Fill", shortcut: "F", Icon: PaintBucket },
	{ id: "picker", label: "Color picker", shortcut: "I", Icon: Pipette },
	{ id: "pan", label: "Pan (hold Space)", shortcut: "H", Icon: Hand },
];

export type TPaintToolbar = {
	activeTool: TPaintTool;
	onToolChange: (tool: TPaintTool) => void;
	selectedColor: string;
	onColorChange: (color: string) => void;
	brushSize: number;
	onBrushSizeChange: (size: number) => void;
	paintInLines: boolean;
	onPaintInLinesChange: (value: boolean) => void;
	onClear: () => void;
	onSave: () => void;
	saveStatus: "idle" | "saving" | "saved" | "error";
};

export function PaintToolbar({
	activeTool,
	onToolChange,
	selectedColor,
	onColorChange,
	brushSize,
	onBrushSizeChange,
	paintInLines,
	onPaintInLinesChange,
	onClear,
	onSave,
	saveStatus,
}: TPaintToolbar) {
	const { min, max, step } = PAINT_BRUSH_BOUNDS;

	return (
		<div className="flex w-full flex-wrap items-center justify-center gap-3 border-b border-[--line] px-3 py-2 text-sm font-semibold">
			<Button asChild size="sm" variant="ghost">
				<Link to="/paint">
					<ArrowLeft />
					Canvases
				</Link>
			</Button>

			<Separator orientation="vertical" className="h-6!" />

			<ToggleGroup
				type="single"
				variant="outline"
				size="sm"
				value={activeTool}
				onValueChange={(value) => value && onToolChange(value as TPaintTool)}
			>
				{TOOLS.map(({ id, label, shortcut, Icon }) => (
					<ToggleGroupItem
						key={id}
						value={id}
						aria-label={label}
						title={`${label} (${shortcut})`}
					>
						<Icon />
					</ToggleGroupItem>
				))}
			</ToggleGroup>

			<input
				type="color"
				aria-label="Paint color"
				value={selectedColor}
				onChange={(e) => onColorChange(e.target.value)}
				className="size-8 cursor-pointer rounded-md border border-[--line] bg-transparent p-0.5"
			/>

			<div className="flex items-center gap-1">
				<Button
					size="icon-xs"
					variant="ghost"
					aria-label="Smaller brush"
					onClick={() => onBrushSizeChange(Math.max(min, brushSize - step))}
				>
					<Minus />
				</Button>
				<span className="w-6 text-center tabular-nums">{brushSize}</span>
				<Button
					size="icon-xs"
					variant="ghost"
					aria-label="Larger brush"
					onClick={() => onBrushSizeChange(Math.min(max, brushSize + step))}
				>
					<Plus />
				</Button>
			</div>

			<Button
				size="sm"
				variant={paintInLines ? "default" : "outline"}
				onClick={() => onPaintInLinesChange(!paintInLines)}
				title="Keep strokes inside the region they started in"
			>
				{paintInLines ? <Lock /> : <Unlock />}
				In lines
			</Button>

			<Separator orientation="vertical" className="h-6!" />

			<Button size="sm" variant="outline" onClick={onClear}>
				<RefreshCcw />
				Clear
			</Button>
			<Button size="sm" onClick={onSave} disabled={saveStatus === "saving"}>
				<Save />
				{saveStatus === "saving"
					? "Saving…"
					: saveStatus === "saved"
						? "Saved"
						: saveStatus === "error"
							? "Retry save"
							: "Save"}
			</Button>
		</div>
	);
}
