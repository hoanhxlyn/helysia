import { afterAll, describe, expect, test } from "bun:test";
import { ROUTES, todoPath } from "@/shared/routes.ts";
import {
	call,
	cleanupUsers,
	createTodo,
	isChecked,
	MISSING_ID,
	registerUser,
	uniqueTitle,
} from "./helpers.ts";

afterAll(cleanupUsers);

describe("todos", () => {
	test("create, list, toggle, rename and delete", async () => {
		const { cookie } = await registerUser();
		const title = uniqueTitle("Buy milk");
		const { id, html } = await createTodo(cookie, title);
		expect(html).toContain(title);
		expect(isChecked(html)).toBe(false);

		const list = await call(ROUTES.todos, { cookie });
		expect(list.status).toBe(200);
		expect(await list.text()).toContain(`id="todo-${id}"`);

		const toggled = await call(todoPath(id, "toggle"), {
			method: "PATCH",
			cookie,
		});
		expect(toggled.status).toBe(200);
		expect(isChecked(await toggled.text())).toBe(true);

		const toggledBack = await call(todoPath(id, "toggle"), {
			method: "PATCH",
			cookie,
		});
		expect(isChecked(await toggledBack.text())).toBe(false);

		const newTitle = uniqueTitle("Buy oat milk");
		const renamed = await call(todoPath(id), {
			method: "PUT",
			cookie,
			json: { title: newTitle },
		});
		expect(renamed.status).toBe(200);
		expect(await renamed.text()).toContain(newTitle);

		const edit = await call(todoPath(id, "edit"), { cookie });
		expect(edit.status).toBe(200);
		expect(await edit.text()).toContain(newTitle);

		const removed = await call(todoPath(id), { method: "DELETE", cookie });
		expect(removed.status).toBe(200);

		const gone = await call(todoPath(id), { cookie });
		expect(gone.status).toBe(404);
		expect(await gone.text()).toBe("Todo not found");

		const removedAgain = await call(todoPath(id), {
			method: "DELETE",
			cookie,
		});
		expect(removedAgain.status).toBe(404);
	});

	test("a missing todo returns 404 for every operation", async () => {
		const { cookie } = await registerUser();
		const requests: [string, string, unknown?][] = [
			["GET", todoPath(MISSING_ID)],
			["GET", todoPath(MISSING_ID, "edit")],
			["PUT", todoPath(MISSING_ID), { title: "x" }],
			["PATCH", todoPath(MISSING_ID, "toggle")],
			["DELETE", todoPath(MISSING_ID)],
		];

		for (const [method, path, json] of requests) {
			const res = await call(path, { method, cookie, json });
			expect(res.status).toBe(404);
			expect(await res.text()).toBe("Todo not found");
		}
	});

	test("another user's todo looks the same as a missing one", async () => {
		const owner = await registerUser();
		const other = await registerUser();
		const title = uniqueTitle("Private");
		const { id } = await createTodo(owner.cookie, title);

		const requests: [string, string, unknown?][] = [
			["GET", todoPath(id)],
			["GET", todoPath(id, "edit")],
			["PUT", todoPath(id), { title: "hijacked" }],
			["PATCH", todoPath(id, "toggle")],
			["DELETE", todoPath(id)],
		];

		for (const [method, path, json] of requests) {
			const res = await call(path, { method, cookie: other.cookie, json });
			expect(res.status).toBe(404);
			expect(await res.text()).toBe("Todo not found");
		}

		const otherList = await call(ROUTES.todos, { cookie: other.cookie });
		expect(await otherList.text()).not.toContain(title);

		const stillThere = await call(todoPath(id), { cookie: owner.cookie });
		expect(stillThere.status).toBe(200);
		expect(await stillThere.text()).toContain(title);
	});

	test("titles are HTML-escaped", async () => {
		const { cookie } = await registerUser();
		const { html } = await createTodo(cookie, "<script>alert(1)</script>");
		expect(html).toContain("&lt;script&gt;");
		expect(html).not.toContain("<script>alert(1)");
	});
});
