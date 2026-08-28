import { guessStore, increaseHintsUsed } from "#/lib/guess-store";
import type { TWordOfDay } from "#/types/defy";
import { useQuery } from "@tanstack/react-query";
import { useStore } from "@tanstack/react-store";
import { ExternalLink } from "lucide-react";
import { Button } from "../ui/button";

export type WordDefProps = {
	wordDef: TWordOfDay;
};

export function WordDef({ wordDef }: WordDefProps) {
	const gameOver = useStore(guessStore, (state) => state.gameOver);
	const numberOfGuesses = useStore(guessStore, (state) => state.guesses.length);

	// TODO: Look into it, looks like queryFn is required to be provided
	const { refetch } = useQuery({
		queryKey: ["wordDef"],
	});

	const useHint = async () => {
		increaseHintsUsed();
		await refetch();
	};

	const partsOfSpeech = wordDef.senses
		.filter((sense) => sense.definitions.some(Boolean))
		.map((sense) => sense.partOfSpeech);

	const letterHints = wordDef.letterHints;
	const revealedLetterCount =
		letterHints?.filter((letter) => letter !== undefined).length ?? 0;
	// Hints never reveal the final letter, so once every letter but the last
	// is shown there's nothing left for another hint to do.
	const outOfHints =
		!!letterHints && revealedLetterCount >= letterHints.length - 1;

	// Tell the player what the next hint will actually do: while there are
	// still hidden definitions/synonyms, hints reveal those; once those run
	// out, hints fall back to revealing letters of the answer instead.
	const hasHiddenDefOrSyn = wordDef.senses.some(
		(sense) =>
			sense.definitions.some((d) => d === undefined) ||
			sense.synonyms.some((s) => s === undefined),
	);
	const nextHint: "definition" | "letter" | "none" = hasHiddenDefOrSyn
		? "definition"
		: outOfHints
			? "none"
			: "letter";

	let definitionCounter = 0;

	return (
		<section className="flex flex-col overflow-hidden rounded-2xl border border-(--defy-line) bg-(--defy-surface) shadow-[0_1px_0_rgba(23,22,19,.04),0_12px_32px_-18px_rgba(23,22,19,.28)] lg:h-full">
			<div className="flex flex-wrap items-center gap-3 border-b border-(--defy-line) p-4.5">
				<code
					className={`text-[26px]! font-bold tracking-[0.02em] ${!wordDef.word ? "rise-in blur-sm select-none" : ""}`}
				>
					{wordDef.word || "??????"}
				</code>

				{partsOfSpeech.length > 0 && (
					<div className="flex flex-wrap gap-1.5">
						{partsOfSpeech.map((pos, i) => (
							<span
								key={`${pos}-${i}`}
								className="rounded-full bg-(--defy-accent-soft) px-2.5 py-1 text-[11px] font-semibold tracking-[0.06em] text-(--defy-accent-text) uppercase"
							>
								{pos}
							</span>
						))}
					</div>
				)}

				<div className="ml-auto flex items-center gap-2">
					{numberOfGuesses >= 4 && !gameOver && nextHint !== "none" && (
						<Button
							variant="ghost"
							onClick={useHint}
							title={
								nextHint === "definition"
									? "Reveals the next hidden definition or synonym"
									: "Reveals the next letter of the answer"
							}
							className="rounded-xl text-(--defy-muted) hover:bg-(--defy-surface-muted) hover:text-(--defy-ink)"
						>
							{nextHint === "definition"
								? "Reveal Definition/Synonym"
								: "Reveal Letter"}
						</Button>
					)}
					<Button
						title="Open in dictionary"
						aria-label="Open in dictionary"
						size="icon"
						disabled={!wordDef.wiktionaryUrl}
						onClick={() => {
							if (!wordDef.wiktionaryUrl) return;
							window.open(
								wordDef.wiktionaryUrl,
								"_blank",
								"noreferrer noopener",
							);
						}}
						className="size-9.5 rounded-[11px] bg-(--defy-accent) text-white hover:bg-[#C68F58]"
					>
						<ExternalLink className="size-4" />
					</Button>
				</div>
			</div>

			<div className="defy-scroll min-h-0 flex-1 overflow-auto px-4.5 pb-5">
				{wordDef.senses.map((sense, senseIndex) => {
					if (!sense.definitions.length) return null;

					const defsLeftHidden = sense.definitions.filter((d) => !d).length;
					const revealedDefs = sense.definitions.filter(
						(d): d is string => !!d,
					);
					const hasSynonyms = sense?.synonyms?.length > 0;
					const synsLeftHidden = sense.synonyms.filter((s) => !s).length;
					const revealedSyns = sense.synonyms.filter((s): s is string => !!s);

					if (!revealedDefs.length && defsLeftHidden === 0) return null;

					return (
						<div key={`sense-${senseIndex}`}>
							<div className="sticky top-0 z-1 bg-(--defy-surface) py-3.5 text-xs font-semibold tracking-[0.14em] text-(--defy-muted) uppercase">
								Definitions — {sense.partOfSpeech}
							</div>
							<ol className="m-0 flex list-none flex-col gap-0.5 p-0">
								{revealedDefs.map((definition, defIndex) => {
									definitionCounter++;
									return (
										<li
											key={`definition-${senseIndex}-${defIndex}`}
											className="grid grid-cols-[26px_1fr] gap-3 rounded-[10px] px-2.5 py-2.5 hover:bg-(--defy-surface-muted)"
										>
											<i className="pt-0.5 font-mono text-xs font-bold text-(--defy-accent) not-italic">
												{String(definitionCounter).padStart(2, "0")}
											</i>
											<p
												className="m-0 text-[15.5px] leading-[1.62] text-(--defy-ink-soft)"
												style={{ textWrap: "pretty" }}
											>
												{definition}
											</p>
										</li>
									);
								})}
								{defsLeftHidden > 0 && (
									<li className="grid grid-cols-[26px_1fr] gap-3 px-2.5 py-2.5">
										<span />
										<i className="text-[15.5px] text-(--defy-muted)">
											+{defsLeftHidden} more hidden definition
											{defsLeftHidden > 1 ? "s" : ""}...
										</i>
									</li>
								)}
							</ol>

							{hasSynonyms && (
								<div className="mb-3 flex flex-wrap gap-2 px-2.5 pb-2">
									{revealedSyns.map((syn, synIndex) => (
										<span
											key={`synonym-${syn}-${synIndex}`}
											className="rounded-full border border-(--defy-line) px-2.5 py-1 text-xs font-medium text-(--defy-ink-soft)"
										>
											{syn}
										</span>
									))}
									{synsLeftHidden > 0 && (
										<span className="rounded-full border border-(--defy-line) px-2.5 py-1 text-xs font-medium text-(--defy-muted)">
											+{synsLeftHidden} more hidden synonym
											{synsLeftHidden > 1 ? "s" : ""}...
										</span>
									)}
								</div>
							)}
						</div>
					);
				})}
			</div>

			{letterHints && (
				<div className="flex shrink-0 flex-wrap items-center gap-2 border-t border-(--defy-line) px-4.5 py-3">
					<span className="text-xs font-semibold tracking-[0.14em] text-(--defy-muted) uppercase">
						Letters
					</span>
					<div className="flex gap-1.5">
						{letterHints.map((letter, index) => (
							<span
								key={`letter-${index}`}
								className="flex size-7 items-center justify-center rounded-md border border-(--defy-line) font-mono text-sm font-semibold text-(--defy-ink) uppercase"
							>
								{letter ?? ""}
							</span>
						))}
					</div>
				</div>
			)}

			<p className="shrink-0 border-t border-(--defy-line) px-4.5 py-3 text-sm font-light text-(--defy-muted)">
				Powered by{" "}
				<a
					href="https://freedictionaryapi.com"
					target="_blank"
					rel="noreferrer"
					className="text-(--defy-accent) hover:text-(--defy-accent-strong)"
				>
					FreeDictionaryAPI.com
				</a>
			</p>
		</section>
	);
}
