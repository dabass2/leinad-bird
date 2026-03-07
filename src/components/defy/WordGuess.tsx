export type WordGuessProps = {
	status: "correct" | "close" | "wrong" | "empty";
	word: string;
};

export function WordGuess({ status, word }: WordGuessProps) {
	return (
		<div className={`guess-${status} rounded-2xl p-5`}>
			<p className="text-center text-lg font-sans font-semibold">{word}</p>
		</div>
	);
}
