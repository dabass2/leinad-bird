export interface Project {
	title: string;
	description: string;
	tech: string[];
	/** Internal route ("/defy") or external URL. */
	siteUrl?: string;
	sourceUrl?: string;
	/** Path under public/ or external URL. Switches the card to light-on-dark text. */
	image?: string;
	/** Spans two columns in the bento grid. */
	wide?: boolean;
}

const REPO_URL = "https://github.com/dabass2/leinad-bird";

// public/ is served under the app's base path (/bird/), so root-relative paths won't resolve.
const homeImage = (name: string) =>
	`${import.meta.env.BASE_URL}home/${name}.webp`;

export const PROJECTS: Project[] = [
	{
		title: "Defy",
		description:
			"A daily word puzzle. Guess the word from its definition in five tries.",
		tech: ["React", "TanStack", "Tailwind"],
		siteUrl: "/defy",
		sourceUrl: REPO_URL,
		image: homeImage("defy"),
		wide: true,
	},
	{
		title: "rmeme",
		description:
			"A REST API that hands back a random meme. Upload your own and upvote or downvote the rest.",
		tech: ["Node.js", "Express", "MongoDB"],
		siteUrl: "https://rmeme.me",
		image: homeImage("rmeme"),
	},
	{
		title: "tfw",
		description:
			"The Discord bot I wrote to teach myself Node, now a playground. Mini games, rmeme memes, and pictures of my cat or dog.",
		tech: ["Node.js", "Discord.js", "APIs"],
		sourceUrl: "https://github.com/dabass2/Discord-Bot",
		image: homeImage("tfw"),
	},
	{
		title: "Typers",
		description:
			"Words fall from the top of the screen. Type them before they hit the bottom.",
		tech: ["React", "Konva", "TanStack"],
		siteUrl: "/typers",
		sourceUrl: REPO_URL,
		image: homeImage("typers"),
		wide: true,
	},
	{
		title: "Games",
		description:
			"Tic-tac-toe, Connect Four, Dots and Boxes, Concentration and a 60-second math frenzy, all on one small shared engine.",
		tech: ["React", "TanStack", "Tailwind"],
		siteUrl: "/games",
		sourceUrl: REPO_URL,
	},
	{
		title: "Solar System Simulation",
		description:
			"A roughly-to-scale solar system rendered in WebGL with p5.js, built from the Solar System OpenData API. Toggle orbits, filter planets, and change the speed.",
		tech: ["JavaScript", "Vue", "Vuetify", "p5.js", "APIs"],
		siteUrl: "https://leinad.dev/solar",
		sourceUrl: "https://github.com/dabass2/p5-solar-system",
		image: homeImage("solar"),
		wide: true,
	},
	{
		title: "Mood Music",
		description:
			"Pick one of six moods and get a playlist of up to 200 matching songs from Spotify data. Built by a team of four for CS 242.",
		tech: ["Vue", "Vuetify", "JavaScript", "MySQL"],
		siteUrl: "https://leinad.dev/moodmusic",
		sourceUrl: "https://github.com/dabass2/Mood-Music",
		image: homeImage("mood"),
	},
	{
		title: "Anime Guess",
		description:
			"Name which show each character is from before time runs out. Inspired by openings.ninja.",
		tech: ["Vue", "Vuetify", "JavaScript", "APIs"],
		siteUrl: "https://leinad.dev/anime",
		sourceUrl: "https://github.com/dabass2/anime-guess",
		image: homeImage("anime"),
	},
	{
		title: "Edward",
		description:
			"Press the button, get a picture of my cat, Edward. Made to learn React.",
		tech: ["React"],
		siteUrl: "https://leinad.dev/edward",
		sourceUrl: "https://github.com/dabass2/edward",
		image: homeImage("edward"),
	},
	{
		title: "Vizu",
		description:
			"A home for the visualizations I make. I'm lazy, so there aren't many yet.",
		tech: ["JavaScript", "p5.js"],
		siteUrl: "https://leinad.dev/assort/vizu",
		image: homeImage("vizu"),
	},
];
