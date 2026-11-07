import { ErrorAlert } from "@components/error-alert.tsx";
import { authPlugin } from "@plugin";
import { Elysia } from "elysia";
import { HX, ROUTES } from "@/shared/routes.ts";
import { AuthService } from "../service.ts";
import { LoginPage } from "./page.tsx";

export default new Elysia()
	.use(authPlugin())
	.use(AuthService)
	.get("/", ({ user, redirect }) =>
		user ? redirect(ROUTES.todos) : <LoginPage />,
	)
	.post(
		"/",
		async ({ body, authenticateUser, set, status, startSession }) => {
			const found = await authenticateUser(body.username, body.password);
			if (!found) {
				return status(
					401,
					<ErrorAlert>Invalid username or password.</ErrorAlert>,
				);
			}

			await startSession(found);
			set.headers[HX.redirect] = ROUTES.todos;
			return "";
		},
		{ body: "auth.login" },
	);
