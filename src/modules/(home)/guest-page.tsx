import { Layout } from "@components/layout.tsx";
import { ROUTES } from "@/shared/routes.ts";

const features = [
	{ title: "Your own list", text: "Every todo belongs to your account only." },
	{
		title: "Fast pages",
		text: "Server-rendered HTML with htmx, no page reloads.",
	},
	{ title: "Open starter", text: "Bun, Elysia and Drizzle on Postgres." },
];

export const GuestPage = () => (
	<Layout user={null} title="Helysia">
		<main>
			<section class="hero min-h-[60vh]">
				<div class="hero-content text-center">
					<div class="max-w-md">
						<h1 class="text-5xl font-bold">Helysia</h1>
						<p class="py-6">
							A simple todo app. Create an account to start your list.
						</p>
						<div class="flex justify-center gap-2">
							<a class="btn btn-primary" href={ROUTES.register}>
								Get started
							</a>
							<a class="btn btn-outline" href={ROUTES.login}>
								Log in
							</a>
						</div>
					</div>
				</div>
			</section>
			<section class="mx-auto grid max-w-4xl gap-4 px-4 pb-12 md:grid-cols-3">
				{features.map((feature) => (
					<div class="card bg-base-100 shadow-sm">
						<div class="card-body">
							<h2 class="card-title" safe>
								{feature.title}
							</h2>
							<p safe>{feature.text}</p>
						</div>
					</div>
				))}
			</section>
		</main>
	</Layout>
);
