import { authPlugin } from "@plugin";
import { Elysia } from "elysia";
import { TodoEditRow, TodoRow, TodoRows } from "./components.tsx";
import { TodosPage } from "./page.tsx";
import { TodoService } from "./service.ts";

export default new Elysia()
	.use(authPlugin())
	.use(TodoService)
	.guard({ auth: true })
	.get("/", async ({ user, listTodos }) => {
		const { items, next } = await listTodos(user.id);
		return <TodosPage user={user} todos={items} next={next} />;
	})
	.get(
		"/more",
		async ({ user, listTodos, query }) => {
			const { items, next } = await listTodos(user.id, query.after);
			return <TodoRows todos={items} next={next} />;
		},
		{ query: "todo.query" },
	)
	.post(
		"/",
		async ({ user, createTodo, body }) => {
			const row = await createTodo(user.id, body.title);
			return row ? <TodoRow todo={row} /> : "";
		},
		{ body: "todo.body" },
	)
	.get(
		"/:id",
		async ({ user, getTodo, params }) => (
			<TodoRow todo={await getTodo(user.id, params.id)} />
		),
		{ params: "todo.params" },
	)
	.get(
		"/:id/edit",
		async ({ user, getTodo, params }) => (
			<TodoEditRow todo={await getTodo(user.id, params.id)} />
		),
		{ params: "todo.params" },
	)
	.put(
		"/:id",
		async ({ user, renameTodo, params, body }) => (
			<TodoRow todo={await renameTodo(user.id, params.id, body.title)} />
		),
		{ params: "todo.params", body: "todo.body" },
	)
	.patch(
		"/:id/toggle",
		async ({ user, toggleTodo, params }) => (
			<TodoRow todo={await toggleTodo(user.id, params.id)} />
		),
		{ params: "todo.params" },
	)
	.delete(
		"/:id",
		async ({ user, removeTodo, params }) => {
			await removeTodo(user.id, params.id);
			return "";
		},
		{ params: "todo.params" },
	);
