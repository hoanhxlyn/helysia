import { ROUTES } from "../routes.ts";

export type NavbarProps = {
	user: { username: string } | null;
};

export const Navbar = ({ user }: NavbarProps) => (
	<nav class="navbar bg-base-100 shadow-sm">
		<div class="flex-1">
			<a class="btn btn-ghost text-xl" href={ROUTES.home}>
				Helysia
			</a>
		</div>
		<div class="flex flex-none items-center gap-2">
			{user ? (
				<>
					<a class="btn btn-ghost" href={ROUTES.todos}>
						Todos
					</a>
					<span class="text-sm" safe>
						{user.username}
					</span>
					<button
						type="button"
						class="btn btn-outline btn-sm"
						hx-post={ROUTES.logout}
					>
						Log out
					</button>
				</>
			) : (
				<>
					<a class="btn btn-ghost" href={ROUTES.login}>
						Log in
					</a>
					<a class="btn btn-primary" href={ROUTES.register}>
						Register
					</a>
				</>
			)}
		</div>
	</nav>
);
