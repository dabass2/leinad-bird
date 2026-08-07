import { useCallback, useEffect, useState } from "react";

export type TTypedWordInputParams = {
	disabled: boolean;
	onSubmit: (word: string) => void;
	onCheatReset: () => void;
};

export type TTypedWordInput = {
	typedWord: string;
	clearTypedWord: () => void;
};

export function useTypedWordInput({
	disabled,
	onSubmit,
	onCheatReset,
}: TTypedWordInputParams): TTypedWordInput {
	const [typedWord, setTypedWord] = useState("");
	const clearTypedWord = useCallback(() => setTypedWord(""), []);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (disabled) return;

			if (e.key === "Enter") {
				onSubmit(typedWord);
				setTypedWord("");
			} else if (e.key === "Backspace") {
				setTypedWord((prev) => prev.slice(0, -1));
			} else if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
				setTypedWord((prev) => prev + e.key);
			}
			if (e.ctrlKey && e.shiftKey && e.key === "F") {
				setTypedWord("");
				onCheatReset();
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [disabled, onSubmit, onCheatReset, typedWord]);

	return { typedWord, clearTypedWord };
}
