import { afterEach, describe, expect, mock, spyOn, test } from "bun:test";
import { loggerPlugin } from "@plugin";
import { Elysia } from "elysia";

const settle = () => Bun.sleep(15);

const spies = () => ({
	log: spyOn(console, "log").mockImplementation(() => {}),
	error: spyOn(console, "error").mockImplementation(() => {}),
});

const lines = (spy: ReturnType<typeof spies>["log"]) =>
	spy.mock.calls.map(([first]) => Bun.stripANSI(String(first)));

const build = (silent: boolean) =>
	new Elysia()
		.use(loggerPlugin({ silent }))
		.get("/created", ({ set }) => {
			set.status = "Created";
			return "ok";
		})
		.get("/ok", () => "ok")
		.get("/boom", () => {
			throw new Error("boom");
		});

const get = async (app: ReturnType<typeof build>, path: string) => {
	const res = await app.handle(new Request(`http://localhost${path}`));
	await settle();
	return res;
};

afterEach(() => mock.restore());

describe("loggerPlugin", () => {
	test("logs one line per response with method, path, status and duration", async () => {
		const { log } = spies();
		await get(build(false), "/ok");
		expect(lines(log)).toEqual([
			expect.stringMatching(/^GET \/ok 200 \d+\.\dms$/),
		]);
	});

	test("logs the status of an unmatched route without an error trace", async () => {
		const { log, error } = spies();
		await get(build(false), "/missing");
		expect(lines(log)).toEqual([expect.stringMatching(/^GET \/missing 404/)]);
		expect(error).not.toHaveBeenCalled();
	});

	test("prints the error of a failing handler and still logs the response", async () => {
		const { log, error } = spies();
		await get(build(false), "/boom");
		expect(error).toHaveBeenCalledTimes(1);
		expect(error.mock.calls[0]?.[0]).toBeInstanceOf(Error);
		expect(lines(log)).toEqual([expect.stringMatching(/^GET \/boom 500/)]);
	});

	test("resolves a status set by name to its number", async () => {
		const { log } = spies();
		await get(build(false), "/created");
		expect(lines(log)).toEqual([expect.stringMatching(/^GET \/created 201/)]);
	});

	test("prints the startup line with the server origin", async () => {
		const { log } = spies();
		const app = build(false).listen(0);
		await settle();
		try {
			expect(lines(log)).toEqual([
				expect.stringMatching(/^● Server started at http:\/\/\S+:\d+$/),
			]);
		} finally {
			await app.stop();
		}
	});

	test("prints nothing when silent", async () => {
		const { log, error } = spies();
		const app = build(true);
		await get(app, "/ok");
		await get(app, "/boom");
		expect(log).not.toHaveBeenCalled();
		expect(error).not.toHaveBeenCalled();
	});

	test("is silent by default when NODE_ENV is test", async () => {
		const { log, error } = spies();
		const app = new Elysia().use(loggerPlugin()).get("/ok", () => "ok");
		await app.handle(new Request("http://localhost/ok"));
		await settle();
		expect(log).not.toHaveBeenCalled();
		expect(error).not.toHaveBeenCalled();
	});
});
