import { EventClient } from "@tanstack/devtools-event-client";
import { useEffect, useState } from "react";

import { guessStore, type TGuess } from "./guess-store";

// define the shape of the events our devtool will emit

type EventMap = {
	"guess-store:state": {
		guesses: TGuess[];
	};
};

class GuessStoreDevtoolsEventClient extends EventClient<EventMap> {
	constructor() {
		super({
			pluginId: "guess-store",
		});
	}
}

const gsdec = new GuessStoreDevtoolsEventClient();

// send an event whenever the store state changes
guessStore.subscribe(() => {
	gsdec.emit("state", {
		guesses: guessStore.state.guesses,
	});
});

function DevtoolPanel() {
	const [state, setState] = useState<EventMap["guess-store:state"]>(() => ({
		guesses: guessStore.state.guesses,
	}));

	useEffect(() => {
		return gsdec.on("state", (e) => setState(e.payload));
	}, []);

	return (
		<div className="p-4 grid gap-4">
			<div className="text-sm font-bold text-gray-500 whitespace-nowrap">
				Guesses
			</div>
			<div className="text-sm">
				{state.guesses.map((g) => (
					<div key={`guess-${g.word}`} className="flex gap-2">
						<span>{g.word}</span>
						<span className="capitalize">{g.status}</span>
					</div>
				))}
			</div>
		</div>
	);
}

export default {
	name: "Guess Store",
	render: <DevtoolPanel />,
};
