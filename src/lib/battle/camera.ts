import type { Vec2 } from "./types";

/**
 * Where the view is looking. `center` is the world point in the middle of the
 * screen and `zoom` is screen pixels per meter.
 */
export interface Camera {
	center: Vec2;
	zoom: number;
}

export interface Viewport {
	width: number;
	height: number;
}

export const MIN_ZOOM = 0.05;
export const MAX_ZOOM = 8;

const clampZoom = (zoom: number) =>
	Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));

export function worldToScreen(cam: Camera, view: Viewport, p: Vec2): Vec2 {
	return {
		x: (p.x - cam.center.x) * cam.zoom + view.width / 2,
		y: (p.y - cam.center.y) * cam.zoom + view.height / 2,
	};
}

export function screenToWorld(cam: Camera, view: Viewport, p: Vec2): Vec2 {
	return {
		x: (p.x - view.width / 2) / cam.zoom + cam.center.x,
		y: (p.y - view.height / 2) / cam.zoom + cam.center.y,
	};
}

/** Moves the camera by a drag of `dx`, `dy` screen pixels. */
export function pan(cam: Camera, dx: number, dy: number): Camera {
	return {
		...cam,
		center: {
			x: cam.center.x - dx / cam.zoom,
			y: cam.center.y - dy / cam.zoom,
		},
	};
}

/** Zooms by `factor` while keeping the world point under `anchor` still. */
export function zoomAt(
	cam: Camera,
	view: Viewport,
	anchor: Vec2,
	factor: number,
): Camera {
	const zoom = clampZoom(cam.zoom * factor);
	const before = screenToWorld(cam, view, anchor);
	const next = { ...cam, zoom };
	const after = screenToWorld(next, view, anchor);
	return {
		zoom,
		center: {
			x: cam.center.x + before.x - after.x,
			y: cam.center.y + before.y - after.y,
		},
	};
}

/** A camera that fits the rectangle inside the viewport with `padding` px spare. */
export function fitCamera(
	view: Viewport,
	bounds: { x: number; y: number; width: number; height: number },
	padding = 24,
): Camera {
	const zoom = clampZoom(
		Math.min(
			(view.width - padding * 2) / bounds.width,
			(view.height - padding * 2) / bounds.height,
		),
	);
	return {
		zoom,
		center: {
			x: bounds.x + bounds.width / 2,
			y: bounds.y + bounds.height / 2,
		},
	};
}
