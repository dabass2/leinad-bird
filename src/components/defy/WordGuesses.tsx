import { guessStore } from "#/lib/guess-store";
import { useStore } from "@tanstack/react-store";
import { WordGuess } from "./WordGuess";

export function WordGuesses() {
	const guesses = useStore(guessStore, (state) => state.guesses);

	return (
		<section className="col-span-4">
			<h2 className="text-[24px] font-semibold">
				Current Guesses ({guesses.length}/5)
			</h2>
			<div className="flex flex-col gap-4 my-4">
				{guesses.map((guess, index) => (
					<WordGuess
						key={`guess-${guess.word}-${index}`}
						status={guess.status}
						word={guess.word}
					/>
				))}
			</div>
		</section>
	);
}
