import { authPlugin } from "@plugin";
import { Elysia } from "elysia";
import { GuestPage } from "./guest-page.tsx";
import { HomePage } from "./page.tsx";

export default new Elysia()
	.use(authPlugin())
	.get("/", ({ user }) => (user ? <HomePage user={user} /> : <GuestPage />));
