import { useEffect, useState } from "react";

function measure(chromePx: number) {
	if (typeof window === "undefined") {
		return { width: 0, height: 0 };
	}
	return {
		width: window.innerWidth,
		height: window.innerHeight - chromePx,
	};
}

export function useViewportSize(chromePx = 0): {
	width: number;
	height: number;
} {
	const [size, setSize] = useState(() => measure(chromePx));

	useEffect(() => {
		let rafId = 0;
		const handleResize = () => {
			cancelAnimationFrame(rafId);
			rafId = requestAnimationFrame(() => setSize(measure(chromePx)));
		};
		window.addEventListener("resize", handleResize);
		return () => {
			window.removeEventListener("resize", handleResize);
			cancelAnimationFrame(rafId);
		};
	}, [chromePx]);

	return size;
}
