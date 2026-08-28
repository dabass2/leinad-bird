import { useStore } from "@tanstack/react-store";
import { SettingsIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "#/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "#/components/ui/dialog";
import { ToggleGroup, ToggleGroupItem } from "#/components/ui/toggle-group";
import {
	DIFFICULTY_PRESETS,
	type TDifficulty,
	TIME_LENGTH_BOUNDS,
} from "#/lib/typers-settings";
import {
	setDifficulty,
	setEndlessMode,
	setTimeLengthSeconds,
	typersSettingsStore,
} from "#/lib/typers-settings-store";

const DIFFICULTY_LABELS: Record<TDifficulty, string> = {
	easy: "Easy",
	normal: "Normal",
	hard: "Hard",
};

const TIME_LENGTH_OPTIONS: number[] = [];
for (
	let seconds = TIME_LENGTH_BOUNDS.min;
	seconds <= TIME_LENGTH_BOUNDS.max;
	seconds += TIME_LENGTH_BOUNDS.step
) {
	TIME_LENGTH_OPTIONS.push(seconds);
}

const ENDLESS_VALUE = "endless";

export function TypersSettingsDialog() {
	const [open, setOpen] = useState(false);
	const difficulty = useStore(typersSettingsStore, (s) => s.difficulty);
	const timeLengthSeconds = useStore(
		typersSettingsStore,
		(s) => s.timeLengthSeconds,
	);
	const endlessMode = useStore(typersSettingsStore, (s) => s.endlessMode);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button variant="ghost" size="icon-sm" aria-label="Settings">
					<SettingsIcon />
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Settings</DialogTitle>
				</DialogHeader>
				<div className="flex flex-col gap-2">
					<span className="text-sm font-medium">Difficulty</span>
					<div className="flex gap-2">
						{(Object.keys(DIFFICULTY_PRESETS) as TDifficulty[]).map((key) => (
							<Button
								key={key}
								variant={difficulty === key ? "default" : "outline"}
								onClick={() => setDifficulty(key)}
								className="flex-1"
							>
								{DIFFICULTY_LABELS[key]}
							</Button>
						))}
					</div>
				</div>
				<div className="flex flex-col gap-2">
					<span className="text-sm font-medium">Time length</span>
					<ToggleGroup
						type="single"
						variant="outline"
						className="w-full"
						value={endlessMode ? ENDLESS_VALUE : String(timeLengthSeconds)}
						onValueChange={(value) => {
							if (!value) return;
							if (value === ENDLESS_VALUE) {
								setEndlessMode(true);
							} else {
								setEndlessMode(false);
								setTimeLengthSeconds(Number(value));
							}
						}}
					>
						{TIME_LENGTH_OPTIONS.map((seconds) => (
							<ToggleGroupItem
								key={seconds}
								value={String(seconds)}
								className="whitespace-nowrap"
							>
								{seconds}s
							</ToggleGroupItem>
						))}
						<ToggleGroupItem
							value={ENDLESS_VALUE}
							className="whitespace-nowrap"
						>
							Endless
						</ToggleGroupItem>
					</ToggleGroup>
				</div>
			</DialogContent>
		</Dialog>
	);
}
