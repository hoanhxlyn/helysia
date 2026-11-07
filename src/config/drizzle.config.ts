import { createEnv } from "@config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
	schema: "./src/database/index.ts",
	out: "./src/database/drizzle",
	dialect: "postgresql",
	casing: "snake_case",
	dbCredentials: {
		url: createEnv().DATABASE_URL,
	},
});
