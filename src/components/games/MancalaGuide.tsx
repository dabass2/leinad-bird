import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "#/components/ui/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "#/components/ui/dialog";
import {
	type MancalaState,
	mancala,
	opposite,
	PITS,
	pitOf,
	storeOf,
} from "#/lib/games/mancala";
import { cn } from "#/lib/utils";

type Mark = "pick" | "sown" | "capture" | "store" | "side";

/** A small, static picture of the board with some pits called out. */
function MiniBoard({
	board,
	marks = {},
}: {
	board: number[];
	marks?: Partial<Record<number, Mark>>;
}) {
	const cell = (index: number, isStore = false) => {
		const mark = marks[index];
		return (
			<span
				key={index}
				className={cn(
					"flex items-center justify-center rounded-full text-xs font-bold text-(--sea-ink)",
					isStore ? "row-span-2" : "aspect-square",
					"border-2 border-transparent bg-(--game-surface)",
					mark === "pick" && "border-dashed border-(--sea-ink-soft)",
					mark === "sown" && "border-(--game-p1)",
					mark === "side" && "border-(--game-p1)/60",
					mark === "capture" && "border-red-400 bg-red-100",
					mark === "store" && "border-(--game-p1)",
				)}
				style={
					isStore
						? {
								background: `color-mix(in srgb, ${index === storeOf(0) ? "var(--game-p1)" : "var(--game-p2)"} 35%, var(--game-surface))`,
							}
						: undefined
				}
			>
				{board[index]}
			</span>
		);
	};

	return (
		<div
			aria-hidden
			className="mx-auto grid w-full max-w-xs grid-cols-[1.2fr_repeat(6,_minmax(0,_1fr))_1.2fr] grid-rows-2 gap-1 rounded-2xl border border-(--game-line) p-1.5"
			style={{
				background:
					"color-mix(in srgb, var(--sea-ink-soft) 10%, var(--game-surface))",
			}}
		>
			{cell(storeOf(1), true)}
			{Array.from({ length: PITS }, (_, i) => cell(pitOf(1, PITS - 1 - i)))}
			{cell(storeOf(0), true)}
			{Array.from({ length: PITS }, (_, i) => cell(pitOf(0, i)))}
		</div>
	);
}

const start = mancala.setup(0);

/** Marks every pit a move picked and sowed into. */
function marksFor({ last }: MancalaState) {
	const marks: Partial<Record<number, Mark>> = {};
	if (!last) return marks;
	marks[last.pit] = "pick";
	for (const index of last.sown) marks[index] = "sown";
	return marks;
}

// Every example is played with the real rules, so the pictures can't drift.
const sowExample = mancala.apply(start, pitOf(0, 3));
const extraTurnExample = mancala.apply(start, pitOf(0, 2));

const captureBefore: MancalaState = {
	...start,
	board: start.board.map((seeds, i) =>
		i === pitOf(0, 0) ? 1 : i === pitOf(0, 1) ? 0 : seeds,
	),
};
const captureAfter = mancala.apply(captureBefore, pitOf(0, 0));

function BeforeAfter({
	before,
	after,
}: {
	before: ReactNode;
	after: ReactNode;
}) {
	return (
		<div className="grid items-center gap-2 sm:grid-cols-[1fr_auto_1fr]">
			{before}
			<ArrowRight className="mx-auto size-4 rotate-90 text-(--sea-ink-soft) sm:rotate-0" />
			{after}
		</div>
	);
}

function Step({
	n,
	title,
	children,
	picture,
}: {
	n: number;
	title: string;
	children: ReactNode;
	picture?: ReactNode;
}) {
	return (
		<section className="grid gap-2">
			<h3 className="m-0 flex items-center gap-2 text-base font-extrabold text-(--sea-ink)">
				<span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-(--game-p1) text-xs">
					{n}
				</span>
				{title}
			</h3>
			<div className="text-sm text-(--sea-ink-soft)">{children}</div>
			{picture}
		</section>
	);
}

export function MancalaGuide({
	open,
	onOpenChange,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const bottomSide = Object.fromEntries(
		Array.from({ length: PITS }, (_, i) => [pitOf(0, i), "side" as Mark]),
	);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-xl">
				<DialogHeader>
					<DialogTitle className="text-2xl font-extrabold">
						How to play Mancala
					</DialogTitle>
					<DialogDescription>
						Collect more seeds in your store than your opponent.
					</DialogDescription>
				</DialogHeader>

				<div className="grid gap-5">
					<Step
						n={1}
						title="Your side and your store"
						picture={
							<MiniBoard
								board={start.board}
								marks={{ ...bottomSide, [storeOf(0)]: "store" }}
							/>
						}
					>
						The bottom row of six pits is yours, and the big store on the{" "}
						<b>right</b> is where you collect seeds. Your opponent has the top
						row and the store on the left. Each pit starts with 4 seeds.
					</Step>

					<Step
						n={2}
						title="Sow the seeds"
						picture={
							<BeforeAfter
								before={
									<MiniBoard
										board={start.board}
										marks={{ [pitOf(0, 3)]: "pick" }}
									/>
								}
								after={
									<MiniBoard
										board={sowExample.board}
										marks={marksFor(sowExample)}
									/>
								}
							/>
						}
					>
						On your turn, tap one of your pits. You pick up all its seeds and
						drop them one at a time into the next pits, moving{" "}
						<b>right along your row</b>, into your store, then leftward along
						your opponent's row. Seeds you drop on their side stay there. You
						skip your opponent's store.
					</Step>

					<Step
						n={3}
						title="Land in your store: go again"
						picture={
							<BeforeAfter
								before={
									<MiniBoard
										board={start.board}
										marks={{ [pitOf(0, 2)]: "pick" }}
									/>
								}
								after={
									<MiniBoard
										board={extraTurnExample.board}
										marks={marksFor(extraTurnExample)}
									/>
								}
							/>
						}
					>
						If your <b>last</b> seed drops into your own store, you take another
						turn right away. Here the third pit had exactly 4 seeds, the right
						number to reach the store.
					</Step>

					<Step
						n={4}
						title="Land in an empty pit: capture"
						picture={
							<BeforeAfter
								before={
									<MiniBoard
										board={captureBefore.board}
										marks={{
											[pitOf(0, 0)]: "pick",
											[pitOf(0, 1)]: "sown",
											[opposite(pitOf(0, 1))]: "capture",
										}}
									/>
								}
								after={
									<MiniBoard
										board={captureAfter.board}
										marks={{ [storeOf(0)]: "store" }}
									/>
								}
							/>
						}
					>
						If your last seed lands in an <b>empty pit on your side</b> and the
						pit straight across has seeds, you capture both: that seed and
						everything opposite go into your store.
					</Step>

					<Step n={5} title="The end">
						The game ends when either player's six pits are all empty. Each
						player then adds the seeds still on their own side to their store,
						and whoever has the most seeds wins.
					</Step>
				</div>

				<DialogFooter>
					<DialogClose asChild>
						<Button>Let's play</Button>
					</DialogClose>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
