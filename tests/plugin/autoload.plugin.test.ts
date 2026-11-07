import { describe, expect, test } from "bun:test";
import { autoloadPlugin } from "@plugin";
import { ROUTES } from "@/shared/routes.ts";

describe("autoloadPlugin", () => {
	test("registers a route for every entry of ROUTES", async () => {
		const loaded = await autoloadPlugin();
		const paths = loaded.routes.map(({ path }) => path.replace(/(.)\/$/, "$1"));
		for (const path of Object.values(ROUTES)) {
			expect(paths).toContain(path);
		}
	});

	test("throws and names every ROUTES entry without a module", async () => {
		await expect(
			autoloadPlugin({
				routes: { ...ROUTES, ghost: "/ghost", phantom: "/phantom" },
			}),
		).rejects.toThrow(
			"ROUTES is out of sync with src/modules. Not registered: /ghost, /phantom",
		);
	});
});
