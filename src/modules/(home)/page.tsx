import { Layout } from "@components/layout.tsx";
import { ROUTES } from "@/shared/routes.ts";

export const HomePage = ({ user }: { user: { username: string } }) => (
	<Layout user={user} title="Helysia">
		<main class="hero min-h-[70vh]">
			<div class="hero-content text-center">
				<div class="max-w-md">
					<h1 class="text-5xl font-bold">Helysia</h1>
					<p class="py-6">
						Welcome back, <span safe>{user.username}</span>.
					</p>
					<a class="btn btn-primary" href={ROUTES.todos}>
						Open my todos
					</a>
				</div>
			</div>
		</main>
	</Layout>
);
