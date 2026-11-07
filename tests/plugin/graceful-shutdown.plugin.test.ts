import { afterEach, describe, expect, mock, spyOn, test } from "bun:test";
import { gracefulShutdownPlugin } from "@plugin";
import { Elysia } from "elysia";

type Handler = (arg: string | Error) => unknown;

const started: Elysia[] = [];

const start = async (timeoutMs?: number) => {
	const handlers = new Map<string, Handler>();
	spyOn(process, "on").mockImplementation(((
		event: string,
		handler: Handler,
	) => {
		handlers.set(event, handler);
		return process;
	}) as never);
	const exit = spyOn(process, "exit").mockImplementation(
		(() => undefined) as never,
	);
	const log = spyOn(console, "log").mockImplementation(() => {});
	const error = spyOn(console, "error").mockImplementation(() => {});
	const app = new Elysia().use(gracefulShutdownPlugin({ timeoutMs })).listen(0);
	started.push(app);
	await Bun.sleep(15);
	return { app, handlers, exit, log, error };
};

afterEach(async () => {
	mock.restore();
	for (const app of started.splice(0)) {
		if (app.server) await app.stop();
	}
});

describe("gracefulShutdownPlugin", () => {
	test("registers SIGINT, SIGTERM and uncaughtException handlers once the server starts", async () => {
		const { handlers } = await start();
		expect([...handlers.keys()]).toEqual(
			expect.arrayContaining(["SIGINT", "SIGTERM", "uncaughtException"]),
		);
	});

	test("stops the server and exits 0 on SIGTERM", async () => {
		const { app, handlers, exit, log } = await start();
		const stop = spyOn(app, "stop");
		await handlers.get("SIGTERM")?.("SIGTERM");
		expect(log.mock.calls[0]?.[0]).toContain("Received SIGTERM");
		expect(stop).toHaveBeenCalledTimes(1);
		expect(exit).toHaveBeenCalledWith(0);
	});

	test("ignores a second signal while shutting down", async () => {
		const { handlers, exit, log } = await start();
		await Promise.all([
			handlers.get("SIGINT")?.("SIGINT"),
			handlers.get("SIGTERM")?.("SIGTERM"),
		]);
		expect(log).toHaveBeenCalledTimes(1);
		expect(exit).toHaveBeenCalledTimes(1);
	});

	test("prints an uncaught exception and exits 1", async () => {
		const { handlers, exit, error } = await start();
		const failure = new Error("unexpected");
		handlers.get("uncaughtException")?.(failure);
		await Bun.sleep(30);
		expect(error).toHaveBeenCalledWith(failure);
		expect(exit).toHaveBeenCalledWith(1);
	});

	test("exits 1 and prints the error when stopping fails", async () => {
		const { app, handlers, exit, error } = await start();
		const failure = new Error("stop failed");
		spyOn(app, "stop").mockRejectedValue(failure);
		await handlers.get("SIGTERM")?.("SIGTERM");
		expect(error).toHaveBeenCalledWith(failure);
		expect(exit).toHaveBeenCalledWith(1);
	});

	test("forces exit 1 when stopping takes longer than the timeout", async () => {
		const { app, handlers, exit, error } = await start(20);
		spyOn(app, "stop").mockReturnValue(new Promise(() => {}) as never);
		handlers.get("SIGTERM")?.("SIGTERM");
		await Bun.sleep(80);
		expect(error.mock.calls[0]?.[0]).toContain("timed out");
		expect(exit).toHaveBeenCalledWith(1);
	});
});
