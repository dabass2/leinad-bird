import { markInstructionsSeen } from "#/lib/app-store";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {useNavigate} from "@tanstack/react-router"

export type TInstructions = {
  isOpen: boolean
}

export function Instructions({isOpen}: TInstructions) {
  const navigate = useNavigate();

  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>How to play <code>defy</code></AlertDialogTitle>
          <AlertDialogDescription className="text-lg">
              • Use the <code>defintions</code> and <code>synonyms</code> on the right to figure out the word<br/>
              • You only get 5 guesses so choose wisely<br/>
              • After each guess you'll gain one new defitions and synonym (if there are any left)
              • After your 4th guess you're able to request more hints to help you out<br/>
              • Determine the word under the guess limit to win bragging rights
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => navigate({to: "/"})} variant="outline">I don't wanna play</AlertDialogCancel>
          <div className="flex-1" />
          <AlertDialogAction onClick={markInstructionsSeen}>Let's Play</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}