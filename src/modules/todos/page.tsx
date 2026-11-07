import { Layout } from "@components/layout.tsx";
import type { Todo } from "@db";
import { ROUTES } from "@/shared/routes.ts";
import { TodoRows } from "./components.tsx";

type TodosPageProps = {
	user: { username: string };
	todos: Todo[];
	next: string | null;
};

export const TodosPage = ({ user, todos, next }: TodosPageProps) => (
	<Layout user={user} title="Todos">
		<main class="mx-auto max-w-xl space-y-4 p-4">
			<form
				class="flex gap-2"
				hx-post={ROUTES.todos}
				hx-target="#todo-list"
				hx-swap="afterbegin"
				{...{
					"hx-on::after-request": "if (event.detail.successful) this.reset()",
				}}
			>
				<input
					name="title"
					class="input flex-1"
					placeholder="What needs doing?"
					maxlength="200"
					required
				/>
				<button type="submit" class="btn btn-primary">
					Add
				</button>
			</form>
			<ul id="todo-list" class="list rounded-box bg-base-100 shadow-md">
				<TodoRows todos={todos} next={next} />
			</ul>
		</main>
	</Layout>
);
