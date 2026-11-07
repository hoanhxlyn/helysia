import { todoSchemas, todos } from "@db";
import { dbPlugin } from "@plugin";
import { and, desc, eq, lt, not } from "drizzle-orm";
import { Elysia } from "elysia";
import { ResourceNotFoundError } from "@/shared/errors.ts";

const owned = (userId: string, id: string) =>
	and(eq(todos.id, id), eq(todos.user_id, userId));

const found = <T>(row: T | undefined) => {
	if (!row) throw new ResourceNotFoundError("Todo");
	return row;
};

export const PAGE_SIZE = 25;

export const TodoService = new Elysia({ name: "Todo.Service" })
	.use(dbPlugin)
	.model({
		"todo.params": todoSchemas.params,
		"todo.query": todoSchemas.query,
		"todo.body": todoSchemas.body,
	})
	.derive({ as: "scoped" }, ({ db }) => ({
		listTodos: async (userId: string, after?: string, limit = PAGE_SIZE) => {
			const rows = await db
				.select()
				.from(todos)
				.where(
					after
						? and(eq(todos.user_id, userId), lt(todos.id, after))
						: eq(todos.user_id, userId),
				)
				.orderBy(desc(todos.id))
				.limit(limit + 1);
			const items = rows.slice(0, limit);
			return {
				items,
				next: rows.length > limit ? (items.at(-1)?.id ?? null) : null,
			};
		},

		getTodo: async (userId: string, id: string) => {
			const [row] = await db.select().from(todos).where(owned(userId, id));
			return found(row);
		},

		createTodo: async (userId: string, title: string) => {
			const [row] = await db
				.insert(todos)
				.values({ user_id: userId, title })
				.returning();
			return row;
		},

		renameTodo: async (userId: string, id: string, title: string) => {
			const [row] = await db
				.update(todos)
				.set({ title })
				.where(owned(userId, id))
				.returning();
			return found(row);
		},

		toggleTodo: async (userId: string, id: string) => {
			const [row] = await db
				.update(todos)
				.set({ done: not(todos.done) })
				.where(owned(userId, id))
				.returning();
			return found(row);
		},

		removeTodo: async (userId: string, id: string) => {
			const rows = await db
				.delete(todos)
				.where(owned(userId, id))
				.returning({ id: todos.id });
			found(rows[0]);
		},
	}));
