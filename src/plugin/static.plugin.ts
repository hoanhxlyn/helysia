import { staticPlugin } from "@elysiajs/static";
import { Elysia } from "elysia";

export const staticAssetsPlugin = () =>
	new Elysia({
		name: "plugin.static",
	}).use(
		staticPlugin({
			prefix: "/static",
		}),
	);
