import { Link } from "@tanstack/react-router";
import ThemeToggle from "./ThemeToggle";

export default function Header() {
	return (
		<header className="sticky top-0 z-50 border-b border-(--line) bg-(--header-bg) px-4 backdrop-blur-lg">
			<nav className="page-wrap flex flex-wrap items-center gap-x-3 gap-y-2 py-3 sm:py-4">
				<h2 className="m-0 shrink-0 text-base font-semibold tracking-tight">
					<Link
						to="/"
						className="inline-flex items-center gap-2 rounded-full border border-(--chip-line) bg-(--chip-bg) px-3 py-1.5 text-sm text-(--sea-ink)! no-underline shadow-(--chip-shadow) sm:px-4 sm:py-2"
					>
						<span className="h-2 w-2 rounded-full bg-linear-to-r from-(--brand-dot-a) to-(--brand-dot-b)" />
						leinad
					</Link>
				</h2>

				<div className="order-3 flex w-full flex-wrap items-center gap-x-4 gap-y-1 pb-1 text-sm font-semibold sm:order-2 sm:w-auto sm:flex-nowrap sm:pb-0">
					<Link
						to="/defy"
						className="nav-link"
						activeProps={{ className: "nav-link is-active" }}
					>
						Defy
					</Link>
					<Link
						to="/typers"
						className="nav-link"
						activeProps={{ className: "nav-link is-active" }}
					>
						Typers
					</Link>
					<Link
						to="/paint"
						className="nav-link"
						activeProps={{ className: "nav-link is-active" }}
					>
						Paint
					</Link>
					<Link
						to="/games"
						className="nav-link"
						activeProps={{ className: "nav-link is-active" }}
					>
						Games
					</Link>
				</div>

				<div className="order-2 ml-auto flex items-center sm:order-3">
					<ThemeToggle />
				</div>
			</nav>
		</header>
	);
}
