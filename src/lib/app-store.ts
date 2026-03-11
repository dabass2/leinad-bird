import { Store } from "@tanstack/store"
import { getCurrentFormattedDate } from "./utils"

export type TAppStore = {
  seenInstructions?: boolean,
  instructionsSeen?: string
}

export const appStore = new Store<TAppStore>({
  seenInstructions: undefined,
  instructionsSeen: undefined
})

export const markInstructionsSeen = () => {
  appStore.setState((prev) => ({
    ...prev,
    seenInstructions: true,
    instructionsSeen: getCurrentFormattedDate()
  }))
}

// Sync changes to localStorage whenever the store updates
appStore.subscribe(() => {
  localStorage.setItem("defy-app-state", JSON.stringify(appStore.state));
});

// To rehydrate on load (before the app mounts)
if (typeof window !== "undefined") {
  const storedState = localStorage.getItem("defy-app-state");
  if (storedState) {
    appStore.setState(JSON.parse(storedState));
  }
}