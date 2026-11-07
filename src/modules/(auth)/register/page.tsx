import { Layout } from "@components/layout.tsx";
import { ROUTES } from "@/shared/routes.ts";

export const RegisterPage = () => (
	<Layout user={null} title="Register">
		<main class="flex flex-1 items-center justify-center p-4">
			<form
				class="card w-full max-w-sm bg-base-100 shadow-md"
				hx-post={ROUTES.register}
				hx-target="#form-error"
			>
				<div class="card-body">
					<h1 class="card-title">Create account</h1>
					<div id="form-error" />
					<input
						name="username"
						class="input w-full"
						placeholder="Username (3-32 letters, digits, _)"
						autocomplete="username"
						pattern="[A-Za-z0-9_]{3,32}"
						required
					/>
					<input
						name="password"
						type="password"
						class="input w-full"
						placeholder="Password (min 8 characters)"
						autocomplete="new-password"
						minlength="8"
						maxlength="128"
						required
					/>
					<button type="submit" class="btn btn-primary">
						Register
					</button>
					<a class="link" href={ROUTES.login}>
						Already registered? Log in
					</a>
				</div>
			</form>
		</main>
	</Layout>
);
