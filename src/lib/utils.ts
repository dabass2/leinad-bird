import type { ClassValue } from "clsx";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

// format a Date instance in UTC as "Month D<suffix> YYYY" e.g. "March 3rd 2026"
export function formatUtcDate(d: Date) {
	const utcYear = d.getUTCFullYear();
	const utcMonth = d.toLocaleString("en-US", {
		month: "long",
		timeZone: "UTC",
	});
	const utcDay = d.getUTCDate();
	const getSuffix = (n: number) => {
		if (n % 100 >= 11 && n % 100 <= 13) return "th";
		switch (n % 10) {
			case 1:
				return "st";
			case 2:
				return "nd";
			case 3:
				return "rd";
			default:
				return "th";
		}
	};
	return `${utcMonth} ${utcDay}${getSuffix(utcDay)} ${utcYear}`;
}

export function getCurrentFormattedDate(): string {
  return new Date().toLocaleDateString("en-US", {timeZone: "America/Chicago"}).split("T")[0].replaceAll("/", "-")
}