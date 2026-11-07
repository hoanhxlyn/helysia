import { createEnv } from "@config";
import { count, eq, like } from "drizzle-orm";
import { seed } from "drizzle-seed";
import { createDb } from "./client.ts";
import * as schema from "./index.ts";

const { todos, users } = schema;

const USER_COUNT = 10;
const MIN_TODOS = 100;
const MAX_TODOS = 5000;
const USERNAME_PREFIX = "seed_user_";

const verbs = [
	"Review",
	"Write",
	"Fix",
	"Plan",
	"Call",
	"Clean",
	"Order",
	"Update",
	"Schedule",
	"Test",
	"Draft",
	"Book",
];

const nouns = [
	"report",
	"invoice",
	"budget",
	"garden",
	"backlog",
	"contract",
	"groceries",
	"roadmap",
	"inbox",
	"presentation",
	"dentist",
	"deployment",
];

const titles = verbs.flatMap((verb) => nouns.map((noun) => `${verb} ${noun}`));

const usernames = Array.from(
	{ length: USER_COUNT },
	(_, i) => `${USERNAME_PREFIX}${String(i + 1).padStart(2, "0")}`,
);

const todoCounts = Array.from(
	{ length: MAX_TODOS - MIN_TODOS + 1 },
	(_, i) => MIN_TODOS + i,
);

const env = createEnv();

if (env.NODE_ENV === "production") {
	throw new Error("Refusing to seed when NODE_ENV is production");
}

const db = createDb(env);

const hash = await Bun.password.hash("password123");

await db.delete(users).where(like(users.username, `${USERNAME_PREFIX}%`));

await seed(db, schema).refine((f) => ({
	users: {
		count: USER_COUNT,
		columns: {
			id: f.uuid(),
			username: f.valuesFromArray({ values: usernames, isUnique: true }),
			password: f.default({ defaultValue: hash }),
		},
		with: {
			todos: [{ weight: 1, count: todoCounts }],
		},
	},
	todos: {
		columns: {
			id: f.uuid(),
			title: f.valuesFromArray({ values: titles }),
			done: f.boolean(),
		},
	},
}));

const summary = await db
	.select({ username: users.username, todos: count(todos.id) })
	.from(users)
	.leftJoin(todos, eq(todos.user_id, users.id))
	.where(like(users.username, `${USERNAME_PREFIX}%`))
	.groupBy(users.username)
	.orderBy(users.username);

for (const row of summary) {
	console.log(`${row.username}: ${row.todos} todos`);
}

console.log(
	`\nSeeded ${summary.reduce((sum, row) => sum + row.todos, 0)} todos for ${summary.length} users.`,
);

await db.$client.close();
