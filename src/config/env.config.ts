import { t } from "elysia";
import { TypeCompiler } from "elysia/type-system";

const envSchema = TypeCompiler.Compile(
	t.Object({
		NODE_ENV: t.Union([
			t.Literal("production"),
			t.Literal("test"),
			t.Literal("development"),
		]),
		PORT: t.Number({ minimum: 1, maximum: 65535, multipleOf: 1 }),
		DATABASE_URL: t.String({ minLength: 1 }),
		JWT_SECRET: t.String({ minLength: 1 }),
	}),
);

export const createEnv = (
	source: Record<string, string | undefined> = process.env,
) => {
	const input = {
		NODE_ENV: source.NODE_ENV ?? "development",
		PORT: Number(source.PORT ?? "3000"),
		DATABASE_URL: source.DATABASE_URL,
		JWT_SECRET: source.JWT_SECRET,
	};
	const problems = [...envSchema.Errors(input)].map(
		({ path, message }) => `${path.slice(1)}: ${message}`,
	);
	if (problems.length > 0) {
		throw new Error(
			`Invalid environment variables:\n${[...new Set(problems)].join("\n")}`,
		);
	}
	return envSchema.Decode(input);
};

export type Env = ReturnType<typeof createEnv>;
