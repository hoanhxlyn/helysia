import { describe, expect, test } from "bun:test";
import { createEnv } from "@config";
import { dbPlugin, envPlugin } from "@plugin";
import { Elysia } from "elysia";

describe("envPlugin", () => {
	test("decorates env validated from the process environment", () => {
		expect(envPlugin.decorator.env).toEqual(createEnv());
	});

	test("makes env available to handlers of any app that uses it", async () => {
		const app = new Elysia()
			.use(envPlugin)
			.get("/port", ({ env }) => String(env.PORT));
		const res = await app.handle(new Request("http://localhost/port"));
		expect(await res.text()).toBe(String(createEnv().PORT));
	});

	test("is registered once when several plugins use it", () => {
		const app = new Elysia().use(envPlugin).use(dbPlugin);
		expect(app.decorator.env).toBe(envPlugin.decorator.env);
	});
});
