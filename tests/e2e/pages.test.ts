import { afterAll, describe, expect, test } from "bun:test";
import { ROUTES } from "@/shared/routes.ts";
import { call, cleanupUsers, registerUser } from "./helpers.ts";

afterAll(cleanupUsers);

describe("home", () => {
	test("guests see the log in and register links", async () => {
		const res = await call(ROUTES.home);
		expect(res.status).toBe(200);
		expect(res.headers.get("content-type")).toContain("text/html");
		const html = await res.text();
		expect(html).toContain(`href="${ROUTES.login}"`);
		expect(html).toContain(`href="${ROUTES.register}"`);
		expect(html).toContain("Get started");
		expect(html).not.toContain(`hx-post="${ROUTES.logout}"`);
		expect(html).not.toContain(`href="${ROUTES.todos}"`);
	});

	test("users see their name and a log out button", async () => {
		const { username, cookie } = await registerUser();
		const res = await call(ROUTES.home, { cookie });
		expect(res.status).toBe(200);
		const html = await res.text();
		expect(html).toContain(username);
		expect(html).toContain(`hx-post="${ROUTES.logout}"`);
		expect(html).toContain("Open my todos");
		expect(html).not.toContain("Get started");
	});
});

describe("login and register pages", () => {
	test("guests get the forms", async () => {
		const login = await call(ROUTES.login);
		expect(login.status).toBe(200);
		expect(await login.text()).toContain(`hx-post="${ROUTES.login}"`);

		const register = await call(ROUTES.register);
		expect(register.status).toBe(200);
		expect(await register.text()).toContain(`hx-post="${ROUTES.register}"`);
	});

	test("logged-in users are redirected to their todos", async () => {
		const { cookie } = await registerUser();
		for (const path of [ROUTES.login, ROUTES.register]) {
			const res = await call(path, { cookie });
			expect(res.status).toBe(302);
			expect(res.headers.get("location")).toBe(ROUTES.todos);
		}
	});
});

describe("todos page", () => {
	test("a new user gets an empty list", async () => {
		const { cookie } = await registerUser();
		const res = await call(ROUTES.todos, { cookie });
		expect(res.status).toBe(200);
		const html = await res.text();
		expect(html).toContain('id="todo-list"');
		expect(html).not.toMatch(/id="todo-[0-9a-f-]{36}"/);
	});
});
