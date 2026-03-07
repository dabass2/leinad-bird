import type { TWordOfDay } from "#/routes/defy";
import { ExternalLink } from "lucide-react";
import { Fragment } from "react/jsx-runtime";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";

export type WordDefProps = {
	wordDef: TWordOfDay;
};

export function WordDef({ wordDef }: WordDefProps) {
	return (
		<div className="island-shell rounded-2xl p-4">
			<span className="flex flex-row items-center justify-between">
				<div className="flex flex-row items-center gap-2">
					<p className="text-[32px] font-bold">
						{wordDef ? wordDef.word : "?????"}
					</p>
					{wordDef.wiktionaryUrl && (
						<Button
							variant="default"
							size={"icon"}
							onClick={() =>
								window.open(
									wordDef.wiktionaryUrl,
									"_blank",
									"noreferrer noopener",
								)
							}
						>
							<ExternalLink />
						</Button>
					)}
				</div>
				<div className="flex flex-row items-center gap-2">
					{console.log(wordDef.partsOfSpeech)}
					{wordDef.partsOfSpeech.map((part, index) => (
						<Badge key={`part-of-speech-${part}-${index}`}>{part}</Badge>
					))}
				</div>
			</span>
			<div className="flex flex-row items-center gap-2 flex-wrap pt-2">
				{wordDef.pronunciations?.map((pronunciation) => (
					<code key={`pronunciation-${pronunciation}`}>{pronunciation}</code>
				))}
			</div>
			<Separator className="my-4" />

			<p>Definitions</p>
			{wordDef.definitions?.map((definition, index) => (
				<Fragment key={`definition-${definition}-${index}`}>
					<Badge variant="outline">Definition #{index + 1}</Badge>
					<li className="ml-8">{definition}</li>
				</Fragment>
			))}

			<Separator className="m-4" />

			<p>Synonyms</p>
			<div className="flex flex-row gap-2 my-2 flex-wrap">
				{wordDef.synonyms?.map((synonym, index) => (
					<Badge key={`synonym-${synonym}-${index}`} variant="outline">
						{synonym}
					</Badge>
				))}
			</div>
		</div>
	);
}
