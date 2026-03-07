export type TWordOfDay = {
	word?: string;
	wiktionaryUrl?: string;
	senses: TWordOfDayDefinition[];
};

export type TWordOfDayDefinition = {
	partOfSpeech: string;
	definitions: (string | undefined)[];
	synonyms: (string | undefined)[];
};

// Types for response from dictionary API

interface Pronunciation {
	type: string;
	text: string;
	tags: string[];
}

interface Form {
	word: string;
	tags: string[];
}

interface Quote {
	text: string;
	reference: string;
}

interface Sense {
	definition: string;
	tags: string[];
	examples: string[];
	quotes: Quote[];
	synonyms: string[];
	antonyms: string[];
	subsenses: Sense[];
}

interface Language {
	code: string;
	name: string;
}

interface Entry {
	language: Language;
	partOfSpeech: string;
	pronunciations: Pronunciation[];
	forms: Form[];
	senses: Sense[];
	synonyms: string[];
	antonyms: string[];
}

interface License {
	name: string;
	url: string;
}

interface Source {
	url: string;
	license: License;
}

export interface DictionaryResponse {
	word: string;
	entries: Entry[];
	source: Source;
}
