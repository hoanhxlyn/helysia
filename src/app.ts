import { etag } from "@bogeychan/elysia-etag";
import { cors } from "@elysiajs/cors";
import { html } from "@elysiajs/html";
import { swagger } from "@elysiajs/swagger";
import {
	autoloadPlugin,
	envPlugin,
	errorPlugin,
	gracefulShutdownPlugin,
	loggerPlugin,
	staticAssetsPlugin,
} from "@plugin";
import { Elysia } from "elysia";
import { helmet } from "elysia-helmet";

export default new Elysia()
	.use(envPlugin)
	.use(loggerPlugin())
	.use(errorPlugin())
	.use(swagger())
	.use(cors())
	.use(html())
	.use(etag())
	.use(
		helmet({
			contentSecurityPolicy: false,
		}),
	)
	.use(staticAssetsPlugin())
	.use(gracefulShutdownPlugin())
	.use(await autoloadPlugin());
