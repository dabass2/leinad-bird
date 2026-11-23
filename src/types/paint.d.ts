export type TPaintTool = "draw" | "eraser" | "pan" | "fill" | "picker";

export type TRegion = {
	id: string;
	number: number;
	labelPosition: { x: number; y: number };
	points: number[];
};

export type TStroke = {
	id: string;
	regionId: string;
	points: number[];
	color: string;
	strokeWidth: number;
	isEraser?: boolean;
};

export type TPaintState = {
	strokes: TStroke[];
	fills: Record<string, string>;
	regions: TRegion[];
};

export type TSavedCanvas = {
	id: string;
	state: TPaintState;
	/** epoch ms */
	updatedAt: number;
};

export type TDiagramGenerator = {
	id: string;
	name: string;
	generate: (width: number, height: number) => TRegion[];
};
