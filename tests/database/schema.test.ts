import { describe, expect, test } from "bun:test";
import { todos, users } from "@db";
import { getTableConfig } from "drizzle-orm/pg-core";

const config = getTableConfig(todos);

describe("todos table", () => {
	test("generates a time-ordered UUIDv7 id in the app", () => {
		const id = todos.id.defaultFn?.();
		expect(id).toMatch(
			/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[0-9a-f]{4}-[0-9a-f]{12}$/,
		);
	});

	test("deletes a user's todos together with the user", () => {
		const [foreignKey] = config.foreignKeys;
		expect(foreignKey?.onDelete).toBe("cascade");
		const reference = foreignKey?.reference();
		expect(reference?.foreignTable).toBe(users);
		expect(reference?.columns.map((column) => column.name)).toEqual([
			"user_id",
		]);
	});

	test("indexes todos by (user_id, id) for the keyset pagination", () => {
		const [index] = config.indexes;
		expect(index?.config.name).toBe("todos_user_id_id_idx");
		expect(
			index?.config.columns.map((column) => "name" in column && column.name),
		).toEqual(["user_id", "id"]);
	});

	test("requires a title of up to 200 characters and defaults done to false", () => {
		expect(todos.title.notNull).toBe(true);
		expect(todos.title.getSQLType()).toBe("varchar(200)");
		expect(todos.done.default).toBe(false);
	});
});
