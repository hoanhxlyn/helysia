import { jwt } from "@elysiajs/jwt";
import { Elysia, t } from "elysia";
import { HX, ROUTES } from "@/shared/routes.ts";
import { envPlugin } from "./env.plugin.ts";

const SESSION_COOKIE = "session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

export type SessionUser = {
	id: string;
	username: string;
};

export const authPlugin = () =>
	new Elysia({
		name: "plugin.auth",
	})
		.use(envPlugin)
		.use(
			jwt({
				name: "jwt",
				secret: envPlugin.decorator.env.JWT_SECRET,
				schema: t.Object({
					userId: t.String(),
					username: t.String(),
				}),
			}),
		)
		.derive({ as: "global" }, async ({ jwt, cookie, env }) => {
			const session = cookie[SESSION_COOKIE];
			const token = session?.value;
			const payload =
				typeof token === "string" ? await jwt.verify(token) : false;
			const user: SessionUser | null = payload
				? { id: payload.userId, username: payload.username }
				: null;

			return {
				user,
				startSession: async (u: SessionUser) => {
					session?.set({
						value: await jwt.sign({
							userId: u.id,
							username: u.username,
							exp: `${SESSION_TTL_SECONDS}s`,
						}),
						httpOnly: true,
						sameSite: "lax",
						secure: env.NODE_ENV === "production",
						path: "/",
						maxAge: SESSION_TTL_SECONDS,
					});
				},
				endSession: () => {
					session?.set({
						value: "",
						httpOnly: true,
						sameSite: "lax",
						secure: env.NODE_ENV === "production",
						path: "/",
						maxAge: 0,
					});
				},
			};
		})
		.onAfterHandle({ as: "global" }, ({ user, set }) => {
			if (user) set.headers["cache-control"] = "private, no-cache";
		})
		.macro("auth", {
			resolve: ({ user, request, set, status }) => {
				if (user) {
					return { user };
				}
				if (request.headers.has(HX.request)) {
					set.headers[HX.redirect] = ROUTES.login;
					return status(401, "Unauthorized");
				}
				set.headers.location = ROUTES.login;
				return status(302, "");
			},
		});
