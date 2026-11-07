import { createEnv } from "@config";
import { Elysia } from "elysia";

export const envPlugin = new Elysia({
	name: "plugin.env",
}).decorate("env", createEnv());
