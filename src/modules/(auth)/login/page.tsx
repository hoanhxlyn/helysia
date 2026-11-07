import { Layout } from "@components/layout.tsx";
import { ROUTES } from "@/shared/routes.ts";

export const LoginPage = () => (
	<Layout user={null} title="Log in">
		<main class="flex flex-1 items-center justify-center p-4">
			<form
				class="card w-full max-w-sm bg-base-100 shadow-md"
				hx-post={ROUTES.login}
				hx-target="#form-error"
			>
				<div class="card-body">
					<h1 class="card-title">Log in</h1>
					<div id="form-error" />
					<input
						name="username"
						class="input w-full"
						placeholder="Username"
						autocomplete="username"
						required
					/>
					<input
						name="password"
						type="password"
						class="input w-full"
						placeholder="Password"
						autocomplete="current-password"
						required
					/>
					<button type="submit" class="btn btn-primary">
						Log in
					</button>
					<a class="link" href={ROUTES.register}>
						No account? Register
					</a>
				</div>
			</form>
		</main>
	</Layout>
);
