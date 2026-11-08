import type { ChangeEvent, KeyboardEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

export type TTypedWordInputParams = {
	disabled: boolean;
	onSubmit: (word: string) => void;
};

export type TTypedWordInput = {
	typedWord: string;
	inputRef: React.RefObject<HTMLInputElement | null>;
	clearTypedWord: () => void;
	handleChange: (e: ChangeEvent<HTMLInputElement>) => void;
	handleKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void;
};

export function useTypedWordInput({
	disabled,
	onSubmit,
}: TTypedWordInputParams): TTypedWordInput {
	const [typedWord, setTypedWord] = useState("");
	const inputRef = useRef<HTMLInputElement>(null);
	const clearTypedWord = useCallback(() => setTypedWord(""), []);

	const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
		setTypedWord(e.target.value);
	}, []);

	const handleKeyDown = useCallback(
		(e: KeyboardEvent<HTMLInputElement>) => {
			if (e.key === "Enter") {
				onSubmit(typedWord);
				setTypedWord("");
			}
		},
		[typedWord, onSubmit],
	);

	useEffect(() => {
		if (!disabled) {
			inputRef.current?.focus();
		}
	}, [disabled]);

	return { typedWord, inputRef, clearTypedWord, handleChange, handleKeyDown };
}
