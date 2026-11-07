import type { Env } from "@config";
import { drizzle } from "drizzle-orm/bun-sql";
import * as schema from "./index.ts";

export const createDb = (env: Pick<Env, "DATABASE_URL" | "NODE_ENV">) =>
	drizzle({
		connection: {
			url: env.DATABASE_URL,
		},
		casing: "snake_case",
		logger: env.NODE_ENV === "development",
		schema,
	});

export type Db = ReturnType<typeof createDb>;
