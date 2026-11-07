import { Elysia } from "elysia";
import { createDb } from "@/database/client.ts";
import { envPlugin } from "./env.plugin.ts";

export const dbPlugin = new Elysia({
	name: "plugin.db",
})
	.use(envPlugin)
	.decorate("db", createDb(envPlugin.decorator.env))
	.onStop(async (app) => {
		await app.decorator.db.$client.close();
	});
