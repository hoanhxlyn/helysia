import { authPlugin } from "@plugin";
import { Elysia } from "elysia";
import { HX, ROUTES } from "@/shared/routes.ts";

export default new Elysia()
	.use(authPlugin())
	.post("/", ({ endSession, set }) => {
		endSession();
		set.headers[HX.redirect] = ROUTES.home;
		return "";
	});
