import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useState } from "react";
import { Button } from "../ui/button";
import type { TGuess } from "#/types/defy";
import { Copy } from "lucide-react";
import { getCurrentFormattedDate } from "#/lib/utils";

export type TGameOver = {
  isOpen: boolean,
  won: boolean,
  wordOfDay: string,
  guesses: TGuess[],
  hintsUsed: number,
}

export function GameOver({isOpen, won, wordOfDay, guesses, hintsUsed}: TGameOver) {
  const [openOverride, setOpenOverride] = useState<boolean>(false)

  const copyResults = async () => {
    await navigator.clipboard.writeText(`defy | ${getCurrentFormattedDate()}
Guesses: ${guesses.map((guess) => (
  guess.status === "correct" ? "🟩" : "🟥"
)).join("")}
Hints Used: ${hintsUsed > 0 ? Array.from({length: hintsUsed}).map(() => (
  "💡"
)).join("") : ""}
Play ${window.location.href}`)
  }

  return (
    <AlertDialog open={isOpen && !openOverride}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>You {won ? "won!" : "lost ☹️"}</AlertDialogTitle>
        <AlertDialogDescription className="text-lg">
            The word was <code>{wordOfDay}</code>
            <br/><br/>
            <span className="flex flex-row gap-2 items-center">
              <Button variant={"outline"} onClick={copyResults}>Share Results <Copy /></Button>
            </span>
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel onClick={() => setOpenOverride(true)} variant="outline">View Results</AlertDialogCancel>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
  );
}