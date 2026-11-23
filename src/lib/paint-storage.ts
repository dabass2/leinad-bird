// Canvases aren't tied to an account, so each browser remembers the ids of
// the canvases it has saved or opened.
const CANVAS_IDS_KEY = "paint-canvas-ids";
// Pre-multi-canvas key holding this browser's single canvas id
const LEGACY_CANVAS_ID_KEY = "paint-canvas-id";

function writeCanvasIds(ids: string[]) {
	try {
		localStorage.setItem(CANVAS_IDS_KEY, JSON.stringify(ids));
	} catch {
		// storage unavailable; the list just won't persist
	}
}

export function getKnownCanvasIds(): string[] {
	try {
		const raw = localStorage.getItem(CANVAS_IDS_KEY);
		const ids: unknown = raw ? JSON.parse(raw) : [];
		const list = Array.isArray(ids)
			? ids.filter((id): id is string => typeof id === "string")
			: [];

		const legacy = localStorage.getItem(LEGACY_CANVAS_ID_KEY);
		if (legacy) {
			if (!list.includes(legacy)) list.push(legacy);
			writeCanvasIds(list);
			localStorage.removeItem(LEGACY_CANVAS_ID_KEY);
		}
		return list;
	} catch {
		return [];
	}
}

export function rememberCanvasId(id: string) {
	const ids = getKnownCanvasIds();
	if (!ids.includes(id)) writeCanvasIds([id, ...ids]);
}

export function forgetCanvasId(id: string) {
	writeCanvasIds(getKnownCanvasIds().filter((known) => known !== id));
}
