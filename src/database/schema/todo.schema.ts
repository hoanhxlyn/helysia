import { index, pgTable } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-typebox";
import { t } from "elysia";
import { users } from "./user.schema.ts";

export const todos = pgTable(
	"todos",
	(b) => ({
		id: b
			.uuid("id")
			.primaryKey()
			.$defaultFn(() => Bun.randomUUIDv7()),
		user_id: b
			.uuid("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		title: b.varchar("title", { length: 200 }).notNull(),
		done: b.boolean("done").notNull().default(false),
		created_at: b.timestamp("created_at").defaultNow().notNull(),
	}),
	(t) => [index("todos_user_id_id_idx").on(t.user_id, t.id)],
);

export type Todo = typeof todos.$inferSelect;

const select = createSelectSchema(todos);
const insert = createInsertSchema(todos, {
	title: t.String({ minLength: 1, maxLength: 200 }),
});

export const todoSchemas = {
	select,
	insert,
	params: t.Pick(select, ["id"]),
	query: t.Object({ after: select.properties.id }),
	body: t.Pick(insert, ["title"]),
};
