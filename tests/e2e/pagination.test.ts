import { afterAll, describe, expect, test } from "bun:test";
import { PAGE_SIZE } from "@/modules/todos/service.ts";
import { ROUTES } from "@/shared/routes.ts";
import {
	call,
	cleanupUsers,
	createTodo,
	MISSING_ID,
	registerUser,
	uniqueTitle,
} from "./helpers.ts";

afterAll(cleanupUsers);

const ids = (html: string) =>
	[...html.matchAll(/id="todo-([0-9a-f-]{36})"/g)].map((m) => m[1]);

const nextAfter = (html: string) =>
	/hx-get="\/todos\/more\?after=([0-9a-f-]{36})"/.exec(html)?.[1];

describe("todo pagination", () => {
	test("infinite scroll walks every todo once, newest first", async () => {
		const { cookie } = await registerUser();
		const total = PAGE_SIZE * 2 + 5;
		const created: string[] = [];
		for (let i = 0; i < total; i++) {
			created.push((await createTodo(cookie, uniqueTitle(`Todo ${i}`))).id);
		}

		const first = await call(ROUTES.todos, { cookie });
		expect(first.status).toBe(200);
		const firstHtml = await first.text();
		const seen = ids(firstHtml);
		expect(seen).toHaveLength(PAGE_SIZE);

		let cursor = nextAfter(firstHtml);
		let pages = 1;
		while (cursor) {
			const res = await call(`${ROUTES.todosMore}?after=${cursor}`, {
				cookie,
				htmx: true,
			});
			expect(res.status).toBe(200);
			const html = await res.text();
			seen.push(...ids(html));
			cursor = nextAfter(html);
			pages++;
		}

		expect(pages).toBe(3);
		expect(seen).toEqual([...created].reverse());
	});

	test("no trigger when everything fits on one page", async () => {
		const { cookie } = await registerUser();
		await createTodo(cookie, uniqueTitle("Only"));
		const html = await (await call(ROUTES.todos, { cookie })).text();
		expect(nextAfter(html)).toBeUndefined();
	});

	test("exactly one full page has no trigger", async () => {
		const { cookie } = await registerUser();
		for (let i = 0; i < PAGE_SIZE; i++) {
			await createTodo(cookie, uniqueTitle(`Todo ${i}`));
		}
		const html = await (await call(ROUTES.todos, { cookie })).text();
		expect(ids(html)).toHaveLength(PAGE_SIZE);
		expect(nextAfter(html)).toBeUndefined();
	});

	test("a todo created mid-scroll does not duplicate or skip rows", async () => {
		const { cookie } = await registerUser();
		const created: string[] = [];
		for (let i = 0; i < PAGE_SIZE + 3; i++) {
			created.push((await createTodo(cookie, uniqueTitle(`Todo ${i}`))).id);
		}

		const firstHtml = await (await call(ROUTES.todos, { cookie })).text();
		const cursor = nextAfter(firstHtml);
		expect(cursor).toBeDefined();

		await createTodo(cookie, uniqueTitle("Late"));

		const rest = ids(
			await (
				await call(`${ROUTES.todosMore}?after=${cursor}`, {
					cookie,
					htmx: true,
				})
			).text(),
		);
		expect([...ids(firstHtml), ...rest]).toEqual([...created].reverse());
	});

	test("the cursor never exposes another user's todos", async () => {
		const owner = await registerUser();
		const other = await registerUser();
		const { id } = await createTodo(owner.cookie, uniqueTitle("Mine"));
		await createTodo(other.cookie, uniqueTitle("Theirs"));

		const res = await call(`${ROUTES.todosMore}?after=${MISSING_ID}`, {
			cookie: other.cookie,
			htmx: true,
		});
		expect(res.status).toBe(200);
		expect(ids(await res.text())).not.toContain(id);
	});

	test("rejects a missing or malformed cursor", async () => {
		const { cookie } = await registerUser();
		for (const path of [
			ROUTES.todosMore,
			`${ROUTES.todosMore}?after=not-a-uuid`,
		]) {
			const res = await call(path, { cookie, htmx: true });
			expect(res.status).toBe(422);
		}
	});

	test("guests are redirected away from the cursor route", async () => {
		const res = await call(`${ROUTES.todosMore}?after=${MISSING_ID}`);
		expect(res.status).toBe(302);
		expect(res.headers.get("location")).toBe(ROUTES.login);
	});
});

describe("cache headers", () => {
	test("authenticated pages and fragments are private and revalidated", async () => {
		const { cookie } = await registerUser();
		for (const path of [
			ROUTES.todos,
			ROUTES.home,
			`${ROUTES.todosMore}?after=${MISSING_ID}`,
		]) {
			const res = await call(path, { cookie });
			expect(res.status).toBe(200);
			expect(res.headers.get("cache-control")).toBe("private, no-cache");
		}
	});
});
