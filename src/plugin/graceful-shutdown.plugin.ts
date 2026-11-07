import { Elysia } from "elysia";
import pc from "picocolors";

type GracefulShutdownOptions = {
	timeoutMs?: number;
};

export const gracefulShutdownPlugin = ({
	timeoutMs = 10_000,
}: GracefulShutdownOptions = {}) =>
	new Elysia({
		name: "plugin.graceful-shutdown",
	}).onStart((app) => {
		let shuttingDown = false;

		const shutdown = async (reason: string, exitCode: number) => {
			if (shuttingDown) return;
			shuttingDown = true;
			console.log(
				pc.yellow(`Received ${reason}. Initiating graceful shutdown...`),
			);

			setTimeout(() => {
				console.error(pc.red("Graceful shutdown timed out. Forcing exit."));
				process.exit(1);
			}, timeoutMs).unref();

			let finalCode = exitCode;
			try {
				await app.stop();
			} catch (error) {
				console.error(error);
				finalCode = 1;
			}
			process.exit(finalCode);
		};

		process
			.on("SIGINT", (signal) => shutdown(signal, 0))
			.on("SIGTERM", (signal) => shutdown(signal, 0))
			.on("uncaughtException", (error) => {
				console.error(error);
				shutdown("uncaughtException", 1);
			});
	});
