export const ROUTES = {
	home: "/",
	login: "/login",
	register: "/register",
	logout: "/logout",
	todos: "/todos",
	todosMore: "/todos/more",
} as const;

export const todoPath = (id: string, action?: "edit" | "toggle") =>
	action ? `${ROUTES.todos}/${id}/${action}` : `${ROUTES.todos}/${id}`;

export const HX = {
	request: "hx-request",
	redirect: "hx-redirect",
} as const;
