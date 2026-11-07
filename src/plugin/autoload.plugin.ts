import { resolve } from "node:path";
import { Elysia } from "elysia";
import { autoload } from "elysia-autoload";
import { ROUTES } from "@/shared/routes.ts";

type AutoloadOptions = {
	routes?: Record<string, string>;
};

export const autoloadPlugin = async ({
	routes = ROUTES,
}: AutoloadOptions = {}) => {
	const loaded = new Elysia({ name: "plugin.autoload" }).use(
		await autoload({
			dir: resolve(import.meta.dir, "../modules"),
			pattern: "**/index.{ts,tsx}",
		}),
	);

	const registered = new Set(
		loaded.routes.map(({ path }) =>
			path.length > 1 ? path.replace(/\/$/, "") : path,
		),
	);
	const missing = Object.values(routes).filter((path) => !registered.has(path));
	if (missing.length > 0) {
		throw new Error(
			`ROUTES is out of sync with src/modules. Not registered: ${missing.join(", ")}`,
		);
	}

	return loaded;
};
