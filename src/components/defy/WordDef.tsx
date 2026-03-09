import { guessStore, increaseHintsUsed } from "#/lib/guess-store";
import type { TWordOfDay } from "#/types/defy";
import { useQuery } from "@tanstack/react-query";
import { useStore } from "@tanstack/react-store";
import { ExternalLink, Lightbulb } from "lucide-react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";

export type WordDefProps = {
	wordDef: TWordOfDay;
};

export function WordDef({ wordDef }: WordDefProps) {
	const numberOfGuesses = useStore(guessStore, (state) => state.guesses.length);

	// TODO: Look into it, looks like queryFn is required to be provided
	const { refetch } = useQuery({
		queryKey: ["wordDef"],
	});

	const useHint = async () => {
		increaseHintsUsed();
		await refetch();
	};

	return (
		<div className="island-shell rounded-2xl p-4">
			<span className="flex flex-row items-center justify-between">
				<div className="flex flex-row items-center gap-2">
					<code
						className={`text-[24px]! font-bold ${!wordDef.word ? "rise-in blur-sm select-none" : ""}`}
					>
						{wordDef.word || "UNKNOWN"}
					</code>

					<Button
						variant="default"
						size={"icon"}
						className="cursor-pointer"
						disabled={!wordDef.wiktionaryUrl}
						onClick={() => {
							if (!wordDef.wiktionaryUrl) return;
							window.open(
								wordDef.wiktionaryUrl,
								"_blank",
								"noreferrer noopener",
							);
						}}
					>
						<ExternalLink />
					</Button>
				</div>

				{numberOfGuesses >= 4 && (
					<Button variant={"ghost"} className="flex-end" onClick={useHint}>
						Next Hint <Lightbulb />
					</Button>
				)}
			</span>

			<Separator className="my-4" />

			<p className="font-semibold pb-2">Parts of Speech</p>

			{wordDef.senses.map((sense, index) => {
				const defsLeftHidden = sense.definitions.filter((d) => !d).length;
				const revealedDefs = sense.definitions.filter((d) => !!d);

				const hasSynonyms = sense?.synonyms?.length > 0;
				const synsLeftHidden = sense.synonyms.filter((s) => !s).length;
				const revealedSyns = sense.synonyms.filter((s) => !!s);

				return (
					<div key={`sense-${index}`} className="flex flex-col gap-1 my-2">
						<Badge>{sense.partOfSpeech}</Badge>
						<div className="ml-4">
							<p>Definitions</p>
							<ul className="list-disc ml-8">
								{revealedDefs.map((definition, defIndex) => (
									<li key={`definition-${defIndex}`}>{definition}</li>
								))}
								{defsLeftHidden > 0 && (
									<li>
										<i>
											+{defsLeftHidden} more hidden definition
											{defsLeftHidden > 1 ? "s" : ""}...
										</i>
									</li>
								)}
							</ul>
						</div>

						{hasSynonyms && (
							<div className="ml-4">
								<p>Synonyms</p>
								<div className="flex flex-row gap-2 flex-wrap pt-2 ml-4">
									{revealedSyns.map((syn, synIndex) => (
										<Badge key={`synonym-${syn}-${synIndex}`} variant="outline">
											{syn}
										</Badge>
									))}
									{synsLeftHidden > 0 && (
										<Badge variant="outline">
											+{synsLeftHidden} more hidden synonym
											{synsLeftHidden > 1 ? "s" : ""}...
										</Badge>
									)}
								</div>
							</div>
						)}
					</div>
				);
			})}

			<Separator className="m-4" />

			<div className="flex w-full">
				<p className="font-light text-muted-foreground text-sm self-end">
					Powered by{" "}
					<a
						href="https://freedictionaryapi.com"
						target="_blank"
						rel="noreferrer"
						className="text-(--sea-ink-soft) hover:text-(--sea-ink)"
					>
						FreeDictionaryAPI.com
					</a>
				</p>
			</div>
		</div>
	);
}
