export const GAMES = [
	{
		to: "/games/tic-tac-toe",
		title: "Tic-Tac-Toe",
		description: "Three in a row. Play the computer or a friend.",
		players: "1–2 players",
	},
	{
		to: "/games/connect-four",
		title: "Connect Four",
		description: "Drop discs and line up four before your opponent does.",
		players: "1–2 players",
	},
	{
		to: "/games/dots-and-boxes",
		title: "Dots and Boxes",
		description:
			"Draw lines, close boxes, and take an extra turn for each one.",
		players: "1–2 players",
	},
	{
		to: "/games/mancala",
		title: "Mancala",
		description: "Sow seeds around the board, capture, and fill your store.",
		players: "1–2 players",
	},
	{
		to: "/games/concentration",
		title: "Concentration",
		description: "Find every matching pair in as few moves as you can.",
		players: "1 player",
	},
	{
		to: "/games/math-frenzy",
		title: "Math Frenzy",
		description: "60 seconds of arithmetic. Order of operations counts.",
		players: "1 player",
	},
] as const;
