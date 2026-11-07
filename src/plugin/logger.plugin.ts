import { Elysia, StatusMap } from "elysia";
import pc from "picocolors";
import { envPlugin } from "./env.plugin.ts";

type LoggerOptions = {
	silent?: boolean;
};

const colorStatus = (status: number) => {
	if (status >= 500) return pc.red(status);
	if (status >= 400) return pc.yellow(status);
	if (status >= 300) return pc.cyan(status);
	return pc.green(status);
};

export const loggerPlugin = ({
	silent = envPlugin.decorator.env.NODE_ENV === "test",
}: LoggerOptions = {}) =>
	new Elysia({
		name: "plugin.logger",
	})
		.onStart(({ server }) => {
			if (silent) return;
			console.log(
				`${pc.green("●")} Server started at ${pc.cyan(server?.url.origin)}`,
			);
		})
		.onError({ as: "global" }, ({ code, error }) => {
			if (silent || code === "NOT_FOUND") return;
			console.error(error);
		})
		.derive({ as: "global" }, () => ({ startedAt: performance.now() }))
		.onAfterResponse({ as: "global" }, ({ request, path, set, startedAt }) => {
			if (silent) return;
			const status =
				typeof set.status === "string"
					? StatusMap[set.status]
					: (set.status ?? 200);
			const duration =
				startedAt === undefined
					? ""
					: pc.dim(` ${(performance.now() - startedAt).toFixed(1)}ms`);

			console.log(
				`${pc.bold(request.method)} ${path} ${colorStatus(status)}${duration}`,
			);
		});
