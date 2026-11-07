import { describe, expect, mock, test } from "bun:test";
import { dbPlugin } from "@plugin";

describe("dbPlugin", () => {
	test("decorates a db client", () => {
		expect(dbPlugin.decorator.db.$client).toBeDefined();
	});

	test("closes the client when the server stops", async () => {
		const close = mock(async () => {});
		const [onStop] = dbPlugin.event.stop ?? [];
		await onStop?.fn({ decorator: { db: { $client: { close } } } } as never);
		expect(close).toHaveBeenCalledTimes(1);
	});
});
