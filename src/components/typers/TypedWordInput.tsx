import type { ChangeEvent, KeyboardEvent, Ref } from "react";
import { Input } from "#/components/ui/input";

export type TTypedWordInput = {
	value: string;
	disabled: boolean;
	onChange: (e: ChangeEvent<HTMLInputElement>) => void;
	onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void;
	ref: Ref<HTMLInputElement>;
};

export function TypedWordInput({
	value,
	disabled,
	onChange,
	onKeyDown,
	ref,
}: TTypedWordInput) {
	return (
		<Input
			ref={ref}
			type="text"
			value={value}
			onChange={onChange}
			onKeyDown={onKeyDown}
			disabled={disabled}
			autoComplete="off"
			autoCorrect="off"
			autoCapitalize="off"
			spellCheck={false}
			placeholder="Type the falling word…"
			aria-label="Typed word"
		/>
	);
}
