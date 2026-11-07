import { ErrorAlert } from "@components/error-alert.tsx";
import { authPlugin } from "@plugin";
import { Elysia } from "elysia";
import { HX, ROUTES } from "@/shared/routes.ts";
import { AuthService } from "../service.ts";
import { RegisterPage } from "./page.tsx";

export default new Elysia()
	.use(authPlugin())
	.use(AuthService)
	.get("/", ({ user, redirect }) =>
		user ? redirect(ROUTES.todos) : <RegisterPage />,
	)
	.post(
		"/",
		async ({ body, registerUser, set, status, startSession }) => {
			const created = await registerUser(body.username, body.password);
			if (!created) {
				return status(
					409,
					<ErrorAlert>That username is already taken.</ErrorAlert>,
				);
			}

			await startSession(created);
			set.headers[HX.redirect] = ROUTES.todos;
			return "";
		},
		{ body: "auth.register" },
	);
