import { afterAll, describe, expect, test } from "bun:test";
import { ROUTES, todoPath } from "@/shared/routes.ts";
import { call, cleanupUsers, registerUser } from "./helpers.ts";

afterAll(cleanupUsers);

describe("validation", () => {
	test("a malformed todo id is rejected", async () => {
		const { cookie } = await registerUser();
		const res = await call(todoPath("not-a-uuid"), { cookie });
		expect(res.status).toBe(422);
	});

	test("an htmx request with invalid input gets the alert fragment", async () => {
		const { cookie } = await registerUser();
		const res = await call(todoPath("not-a-uuid"), { cookie, htmx: true });
		expect(res.status).toBe(422);
		expect(await res.text()).toContain("Invalid input");
	});

	test("an empty or oversized title is rejected", async () => {
		const { cookie } = await registerUser();
		for (const title of ["", "x".repeat(201)]) {
			const res = await call(ROUTES.todos, {
				method: "POST",
				cookie,
				json: { title },
			});
			expect(res.status).toBe(422);
		}
	});

	test("an unknown route returns 404", async () => {
		const res = await call("/no-such-route");
		expect(res.status).toBe(404);
	});
});
