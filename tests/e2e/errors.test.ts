import { describe, expect, test } from "bun:test";
import { errorPlugin } from "@plugin";
import { Elysia } from "elysia";
import { ResourceNotFoundError } from "@/shared/errors.ts";
import { HX } from "@/shared/routes.ts";

const app = new Elysia()
	.use(errorPlugin())
	.get("/boom", () => {
		throw new Error("secret internal detail");
	})
	.get("/missing", () => {
		throw new ResourceNotFoundError("Widget");
	});

const get = (path: string, htmx = false) =>
	app.handle(
		new Request(`http://localhost${path}`, {
			headers: htmx ? { [HX.request]: "true" } : {},
		}),
	);

describe("errorPlugin", () => {
	test("an unexpected error returns a generic 500 without leaking details", async () => {
		const res = await get("/boom");
		expect(res.status).toBe(500);
		const body = await res.text();
		expect(body).toBe("Something went wrong. Please try again.");
		expect(body).not.toContain("secret internal detail");
	});

	test("an unexpected error on an htmx request returns the alert fragment", async () => {
		const res = await get("/boom", true);
		expect(res.status).toBe(500);
		const body = await res.text();
		expect(body).toContain("Something went wrong");
		expect(body).not.toContain("secret internal detail");
	});

	test("ResourceNotFoundError maps to 404 with its message", async () => {
		const res = await get("/missing");
		expect(res.status).toBe(404);
		expect(await res.text()).toBe("Widget not found");
	});
});
