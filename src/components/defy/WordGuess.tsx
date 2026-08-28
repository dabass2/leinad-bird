export type WordGuessProps = {
	index: number;
	status: "correct" | "close" | "wrong" | "empty";
	word: string;
};

export function WordGuess({ index, status, word }: WordGuessProps) {
	const isEmpty = status === "empty";
	const label = String(index + 1).padStart(2, "0");

	const numberColor =
		status === "correct"
			? "text-(--defy-correct-text)"
			: status === "wrong"
				? "text-(--defy-wrong-text)"
				: "text-(--defy-muted)";

	return (
		<div
			className={`grid grid-cols-[26px_1fr_auto] items-center gap-3 rounded-xl border px-3.5 py-3 ${
				isEmpty
					? "border-dashed border-(--defy-line)"
					: `guess-${status} border-transparent`
			}`}
		>
			<span className={`font-mono text-xs font-bold ${numberColor}`}>
				{label}
			</span>
			<span
				className={`font-mono text-[17px] font-bold tracking-[0.06em] ${
					isEmpty ? "tracking-[0.3em] text-(--defy-line)" : ""
				}`}
			>
				{isEmpty ? "·····" : word}
			</span>
			{!isEmpty && (
				<span
					className={`grid size-5 place-items-center rounded-full text-xs font-bold ${
						status === "correct"
							? "bg-(--defy-correct-text)/10 text-(--defy-correct-text)"
							: "bg-(--defy-wrong-text)/10 text-(--defy-wrong-text)"
					}`}
				>
					{status === "correct" ? "✓" : "✕"}
				</span>
			)}
		</div>
	);
}
