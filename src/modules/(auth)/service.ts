import { userSchemas, users } from "@db";
import { dbPlugin } from "@plugin";
import { eq } from "drizzle-orm";
import { Elysia } from "elysia";

const DUMMY_HASH = await Bun.password.hash("not-a-real-password");

export const AuthService = new Elysia({ name: "Auth.Service" })
	.use(dbPlugin)
	.model({
		"auth.login": userSchemas.login,
		"auth.register": userSchemas.register,
	})
	.derive({ as: "scoped" }, ({ db }) => ({
		authenticateUser: async (username: string, password: string) => {
			const [row] = await db
				.select()
				.from(users)
				.where(eq(users.username, username))
				.limit(1);

			const valid = await Bun.password.verify(
				password,
				row?.password ?? DUMMY_HASH,
			);
			return row && valid ? { id: row.id, username: row.username } : null;
		},

		registerUser: async (username: string, password: string) => {
			const hash = await Bun.password.hash(password);

			const [row] = await db
				.insert(users)
				.values({ username, password: hash })
				.onConflictDoNothing({ target: users.username })
				.returning({ id: users.id, username: users.username });

			return row ?? null;
		},
	}));
