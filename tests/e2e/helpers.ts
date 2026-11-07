import { expect } from "bun:test";
import { createEnv } from "@config";
import { users } from "@db";
import { jwt } from "@elysiajs/jwt";
import { inArray } from "drizzle-orm";
import { Elysia, t } from "elysia";
import app from "@/app.ts";
import { createDb } from "@/database/client.ts";
import { HX, ROUTES } from "@/shared/routes.ts";

type Options = {
	method?: string;
	cookie?: string;
	htmx?: boolean;
	json?: unknown;
};

export const call = (
	path: string,
	{ method = "GET", cookie, htmx, json }: Options = {},
) => {
	const headers = new Headers();
	if (cookie) headers.set("cookie", cookie);
	if (htmx) headers.set(HX.request, "true");
	if (json !== undefined) headers.set("content-type", "application/json");
	return app.handle(
		new Request(`http://localhost${path}`, {
			method,
			headers,
			body: json === undefined ? undefined : JSON.stringify(json),
		}),
	);
};

export const sessionCookie = (res: Response) => {
	const raw = res.headers
		.getSetCookie()
		.find((cookie) => cookie.startsWith("session="));
	if (!raw) throw new Error("response has no session cookie");
	return raw.split(";")[0] ?? raw;
};

export const signSessionCookie = async ({
	secret = createEnv().JWT_SECRET,
	exp,
}: {
	secret?: string;
	exp: number;
}) => {
	const signer = new Elysia().use(
		jwt({
			name: "jwt",
			secret,
			schema: t.Object({ userId: t.String(), username: t.String() }),
		}),
	);
	const token = await signer.decorator.jwt.sign({
		userId: crypto.randomUUID(),
		username: "e2e_signer",
		exp,
	});
	return `session=${token}`;
};

export const password = crypto.randomUUID();

export const MISSING_ID = "01a1a9da-bc60-724f-b629-40f63e7cbb48";

const createdUsernames: string[] = [];

export const registerUser = async () => {
	const username = `e2e_${crypto.randomUUID().replaceAll("-", "").slice(0, 12)}`;
	createdUsernames.push(username);
	const res = await call(ROUTES.register, {
		method: "POST",
		json: { username, password },
	});
	expect(res.status).toBe(200);
	return { username, cookie: sessionCookie(res) };
};

export const cleanupUsers = async () => {
	if (createdUsernames.length === 0) return;
	const db = createDb(createEnv());
	try {
		await db.delete(users).where(inArray(users.username, createdUsernames));
	} finally {
		await db.$client.close();
	}
};

export const uniqueTitle = (label: string) => `${label} ${crypto.randomUUID()}`;

export const createTodo = async (cookie: string, title: string) => {
	const res = await call(ROUTES.todos, {
		method: "POST",
		cookie,
		json: { title },
	});
	expect(res.status).toBe(200);
	const html = await res.text();
	const id = /id="todo-([0-9a-f-]{36})"/.exec(html)?.[1];
	if (!id) throw new Error(`no todo id in response: ${html}`);
	return { id, html };
};

export const isChecked = (html: string) => /<input[^>]*\bchecked\b/.test(html);
