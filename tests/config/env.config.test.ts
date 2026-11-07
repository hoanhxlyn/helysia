import { describe, expect, test } from "bun:test";
import { createEnv } from "@config";

const valid = {
	DATABASE_URL: "postgres://user:pass@localhost:5432/app",
	JWT_SECRET: "test-secret",
};

const messageOf = (source: Record<string, string | undefined>) => {
	try {
		createEnv(source);
	} catch (error) {
		return error instanceof Error ? error.message : String(error);
	}
	return undefined;
};

describe("createEnv", () => {
	test("applies the defaults for NODE_ENV and PORT", () => {
		expect(createEnv(valid)).toEqual({
			...valid,
			NODE_ENV: "development",
			PORT: 3000,
		});
	});

	test("reads explicit values and returns PORT as a number", () => {
		const env = createEnv({ ...valid, NODE_ENV: "production", PORT: "8080" });
		expect(env.NODE_ENV).toBe("production");
		expect(env.PORT).toBe(8080);
		expect(typeof env.PORT).toBe("number");
	});

	test.each(["production", "test", "development"])(
		"accepts NODE_ENV=%s",
		(value) => {
			expect(createEnv({ ...valid, NODE_ENV: value }).NODE_ENV).toBe(value);
		},
	);

	test("accepts the lowest and highest valid ports", () => {
		expect(createEnv({ ...valid, PORT: "1" }).PORT).toBe(1);
		expect(createEnv({ ...valid, PORT: "65535" }).PORT).toBe(65535);
	});

	test("ignores variables the schema does not know", () => {
		const env = createEnv({ ...valid, PATH: "/usr/bin", HOME: "/home/x" });
		expect(env).not.toHaveProperty("PATH");
		expect(env).not.toHaveProperty("HOME");
	});

	test("rejects a NODE_ENV outside the allowed values", () => {
		expect(messageOf({ ...valid, NODE_ENV: "staging" })).toContain("NODE_ENV:");
	});

	test("rejects a PORT above 65535 with the reason", () => {
		expect(messageOf({ ...valid, PORT: "70000" })).toContain(
			"PORT: Expected number to be less or equal to 65535",
		);
	});

	test.each(["0", "-1", ""])("rejects PORT=%p as below 1", (value) => {
		expect(messageOf({ ...valid, PORT: value })).toContain(
			"PORT: Expected number to be greater or equal to 1",
		);
	});

	test("rejects a non-numeric PORT", () => {
		expect(messageOf({ ...valid, PORT: "abc" })).toContain(
			"PORT: Expected number",
		);
	});

	test("rejects a fractional PORT", () => {
		expect(messageOf({ ...valid, PORT: "80.5" })).toContain(
			"PORT: Expected number to be a multiple of 1",
		);
	});

	test.each(["DATABASE_URL", "JWT_SECRET"])("rejects a missing %s", (name) => {
		const { [name]: _omitted, ...source } = valid as Record<string, string>;
		expect(messageOf(source)).toContain(`${name}:`);
	});

	test.each(["DATABASE_URL", "JWT_SECRET"])("rejects an empty %s", (name) => {
		expect(messageOf({ ...valid, [name]: "" })).toContain(
			`${name}: Expected string length greater or equal to 1`,
		);
	});

	test("reports every invalid variable in one error", () => {
		const message = messageOf({ NODE_ENV: "staging", PORT: "abc" });
		expect(message).toStartWith("Invalid environment variables:");
		for (const name of ["NODE_ENV", "PORT", "DATABASE_URL", "JWT_SECRET"]) {
			expect(message).toContain(`${name}:`);
		}
	});

	test("does not repeat the same problem twice", () => {
		const lines = (messageOf({ ...valid, JWT_SECRET: undefined }) ?? "")
			.split("\n")
			.filter((line) => line.startsWith("JWT_SECRET:"));
		expect(new Set(lines).size).toBe(lines.length);
	});
});
