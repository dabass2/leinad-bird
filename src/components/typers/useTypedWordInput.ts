import type { ChangeEvent, KeyboardEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

export type TTypedWordInputParams = {
	disabled: boolean;
	onSubmit: (word: string) => void;
	onCheatReset: () => void;
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
	onCheatReset,
}: TTypedWordInputParams): TTypedWordInput {
	const [typedWord, setTypedWord] = useState("");
	const inputRef = useRef<HTMLInputElement>(null);
	const clearTypedWord = useCallback(() => setTypedWord(""), []);

	const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
		setTypedWord(e.target.value);
	}, []);

	const handleKeyDown = useCallback(
		(e: KeyboardEvent<HTMLInputElement>) => {
			if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "f") {
				e.preventDefault();
				setTypedWord("");
				onCheatReset();
				return;
			}
			if (e.key === "Enter") {
				onSubmit(typedWord);
				setTypedWord("");
			}
		},
		[typedWord, onSubmit, onCheatReset],
	);

	useEffect(() => {
		if (!disabled) {
			inputRef.current?.focus();
		}
	}, [disabled]);

	return { typedWord, inputRef, clearTypedWord, handleChange, handleKeyDown };
}
