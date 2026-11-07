# Helysia

Starter template for a server-rendered web app: [Bun](https://bun.sh) + [Elysia](https://elysiajs.com) on the backend, JSX templates ([`@kitajs/html`](https://html.kitajs.org)) with [htmx](https://htmx.org) for interactivity, [Drizzle ORM](https://orm.drizzle.team) on Postgres, and Tailwind 4 + daisyUI 5 for styling.

It ships with a working demo (register, log in, per-user todo CRUD, public and protected routes) that you can copy from or delete.

## Quick start

Requires Bun 1.4.4 or newer (pinned in `.mise.toml` and `package.json` `engines`; Bun does not enforce `engines`, so check `bun --version`).

```bash
tiged kurumeii/helysia <your-project-name>
cd <your-project-name>
bun install
cp .env.example .env            # then set JWT_SECRET, e.g. openssl rand -base64 32
docker compose -f docker-compose.dev.yml up -d   # local Postgres on :5432
bun migrate                     # apply migrations
bun dev                         # http://localhost:3000; builds CSS, then restarts on code changes and rebuilds CSS on class changes
```

| Command | What it does |
| --- | --- |
| `bun dev` | Runs `dev:server` (`bun --watch`, restarts the process on code changes) and `dev:css` (Tailwind in watch mode, rewrites `public/global.css` when classes change) in parallel. Refresh the browser to see changes |
| `bun build:css` | One-off CSS build, for CI or production |
| `bun generate` | Create a migration after editing `src/database/schema/*.schema.ts` |
| `bun migrate` | Apply migrations |
| `bun studio` | Open Drizzle Studio |
| `bun run lint` | Biome (with `--write`) and cspell on `src` |
| `bun x tsc --noEmit` | Type check |

There is no test suite. Swagger is served at `/swagger`.

**NixOS (or nix + direnv):** the repo ships `flake.nix` + `.envrc`. Enable `programs.direnv.nix-direnv.enable` once on the machine, `direnv allow` and `mise trust` per repo, then drop the `docker compose` line above: the hook provides bun from `.mise.toml` (via mise) and starts Postgres 18 in `.postgres/` on a unix socket, exporting `DATABASE_URL` and a stable dev `JWT_SECRET`. Database state lives in gitignored dirs; stop it with `pg_ctl stop -D .postgres/data`.

## How the codebase works

### Project layout

```
src/
  index.ts                 builds the app: plugins, then the autoloaded modules
  config/                  env.config.ts (validated env vars), drizzle.config.ts
  database/                client.ts, schema/*.schema.ts (tables), index.ts (schema re-exports), drizzle/ (migrations)
  plugin/                  cross-cutting plugins (auth, db, logger, autoload, shutdown, static)
  shared/
    routes.ts              ROUTES, todoPath, HX: every URL and htmx header name
    components/            Layout, BaseHtml, Navbar, ErrorAlert (one component per file)
    style/global.css       Tailwind + daisyUI entry
  modules/                 one folder per feature (see below)
public/                    compiled CSS and htmx, served at /static
```

### Features are folders

Every folder under `src/modules/` is a feature. `autoloadPlugin` (a wrapper around `elysia-autoload`) mounts every `index.ts(x)` it finds, and **the folder name is the URL**: `todos/index.tsx` serves `/todos`. A folder in parentheses, like `(auth)` or `(home)`, is only for grouping and is left out of the URL, so `(home)/index.tsx` is `/` and `(auth)/login/index.tsx` is `/login`. There is no registration step.

Inside a feature folder:

| File | Role |
| --- | --- |
| `index.tsx` | Controller. HTTP only: routes, validation, cookies, status codes. A default-exported `new Elysia()`; routes are relative to the folder URL (`.get("/")`) |
| `service.ts` | Business logic and queries. Plain values in and out, no HTTP |
| `page.tsx` | Full page, a pure component: props in, HTML out, no Elysia or db imports |
| `components.tsx` | Fragments that htmx swaps in |

Only `index.ts(x)` files are loaded as routes. The other files are never mounted.

### What happens on a request

1. `src/index.ts` composes the app: `loggerPlugin`, swagger, cors, html, etag, helmet, static files, graceful shutdown, then `autoloadPlugin`.
2. `authPlugin` reads the `session` cookie and gives every route `user` (`{ id, username }` or `null`), plus `startSession(user)` and `endSession()`.
3. The controller validates input, calls its service, and returns JSX. `@elysiajs/html` sends it as `text/html`.
4. Services get `db` through `dbPlugin`, so handlers never pass it around.
5. `loggerPlugin` prints one line per response, such as `GET /todos 200 12.3ms`.

### Pages and htmx

- A **page** is rendered on navigation and wraps its content in `<Layout user={user} title="...">`, which adds `<head>`, the navbar and the body.
- A **fragment** is a small piece of HTML a handler returns to htmx, for example one todo row. Handlers return JSX directly for both.
- Navigation after a form submit uses a response header: `set.headers[HX.redirect] = ROUTES.todos`.
- `BaseHtml` configures htmx to swap 4xx and 5xx responses, so forms can show server errors. `onError` in `src/index.ts` turns htmx validation errors into an alert.
- User-provided text inside an element needs the `safe` attribute (`<span safe>{title}</span>`), so it is escaped. Without it the text is inserted as raw HTML, and nothing in the toolchain warns you, so check it in review.

### Auth

`src/plugin/auth.plugin.ts` signs a JWT into an `httpOnly`, `SameSite=Lax` cookie (7 days). The token is stateless, so it cannot be revoked before it expires.

- **Public route** (guests allowed): `.use(authPlugin())`. `user` may be `null`.
- **Protected route**: `.use(authPlugin()).guard({ auth: true })`. Guests are redirected to `/login` (htmx requests get `401` plus `HX-Redirect`), and `user` is non-null in every handler after the guard. `auth: true` also works on a single route.

### Database

`src/database/client.ts` creates one Drizzle client, and `src/plugin/db.plugin.ts` shares it, so the app has a single connection pool that is closed on shutdown. Tables live in `src/database/schema/*.schema.ts` and are re-exported from `src/database/index.ts`, which is the schema drizzle-kit reads.

**Ownership rule:** every query on a per-user table filters by `user_id`, so users can never read or change each other's rows. Keep that on any new per-user table (`todos/service.ts` has an `owned()` helper for it).

### Logging and shutdown

`loggerPlugin` prints a colored startup line, one line per response, and error stack traces (404s are skipped). `gracefulShutdownPlugin` stops the server on `SIGINT` or `SIGTERM`, forces exit after 10 seconds, and exits with code 1 on an uncaught exception.

### URLs and headers are constants

Links, `hx-*` URLs and redirects use `ROUTES`, `todoPath` and `HX` from `src/shared/routes.ts`, never string literals. Startup fails if a `ROUTES` entry has no matching route, so renaming a folder cannot leave dead links.

### Styles

Tailwind 4 and daisyUI are compiled by `bun build:css` into `public/global.css` and served from `/static`. There are no CDN links. To upgrade daisyUI, run `bun update daisyui`, then `bun build:css`, and commit `bun.lock` and `public/global.css`.

## Add a new feature

The steps below add a per-user "notes" feature at `/notes`. Copy `src/modules/todos` when you need more (create, update, delete, htmx fragments).

**1. Add the table.** Create `src/database/schema/note.schema.ts`:

```ts
import { index, pgTable } from "drizzle-orm/pg-core";
import { users } from "./user.schema.ts";

export const notes = pgTable(
	"notes",
	(b) => ({
		id: b.integer("id").primaryKey().generatedByDefaultAsIdentity(),
		user_id: b
			.integer("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		body: b.varchar("body", { length: 500 }).notNull(),
	}),
	(t) => [index("notes_user_id_idx").on(t.user_id)],
);

export type Note = typeof notes.$inferSelect;
```

Re-export it in `src/database/index.ts` (`export * from "./schema/note.schema.ts";`), then run `bun generate` and `bun migrate`.

**2. Add the URL.** In `src/shared/routes.ts`, add `notes: "/notes"` to `ROUTES`.

**3. Add the service.** `src/modules/notes/service.ts`:

```ts
import { notes } from "@db";
import { dbPlugin } from "@plugin";
import { desc, eq } from "drizzle-orm";
import { Elysia } from "elysia";
import type { Db } from "@/database/client.ts";

export const createNoteService = (db: Db) => ({
	list: (userId: number) =>
		db
			.select()
			.from(notes)
			.where(eq(notes.user_id, userId))
			.orderBy(desc(notes.id)),
});

export const NoteService = new Elysia({ name: "Note.Service" })
	.use(dbPlugin)
	.derive({ as: "scoped" }, ({ db }) => ({
		noteService: createNoteService(db),
	}));
```

`createNoteService(db)` can be tested with a fake `db`. `NoteService` makes `noteService` available to any controller that `.use`s it.

**4. Add the page.** `src/modules/notes/page.tsx`:

```tsx
import { Layout } from "@components/layout.tsx";
import type { Note } from "@db";

type NotesPageProps = {
	user: { username: string };
	notes: Note[];
};

export const NotesPage = ({ user, notes }: NotesPageProps) => (
	<Layout user={user} title="Notes">
		<main class="mx-auto max-w-xl p-4">
			<ul>
				{notes.map((note) => (
					<li safe>{note.body}</li>
				))}
			</ul>
		</main>
	</Layout>
);
```

**5. Add the controller.** `src/modules/notes/index.tsx`:

```tsx
import { authPlugin } from "@plugin";
import { Elysia } from "elysia";
import { NotesPage } from "./page.tsx";
import { NoteService } from "./service.ts";

export default new Elysia()
	.use(authPlugin())
	.use(NoteService)
	.guard({ auth: true })
	.get("/", async ({ user, noteService }) => (
		<NotesPage user={user} notes={await noteService.list(user.id)} />
	));
```

Drop `.guard({ auth: true })` for a public route. Restart `bun dev`, and `/notes` is live with no registration step.

**6. Link to it.** Add `<a href={ROUTES.notes}>` to `src/shared/components/navbar.tsx`.

### Routes with input

Validate with Elysia's `t` and return a fragment for htmx (from `todos/index.tsx`):

```tsx
.put(
	"/:id",
	async ({ user, todoService, params, body, status }) => {
		const row = await todoService.rename(user.id, params.id, body.title);
		return row ? <TodoRow todo={row} /> : status(404, "Todo not found");
	},
	{
		params: t.Object({ id: t.Numeric() }),
		body: t.Object({ title: t.String({ minLength: 1, maxLength: 200 }) }),
	},
)
```

## Conventions

- **Method chaining:** Elysia needs it to keep types. Build controllers and plugins as one chain, never `app.get(...)` on a separate line.
- **Imports keep the `.ts`/`.tsx` extension.** Aliases: `@config`, `@plugin`, `@db`, `@components/*`, `@/*`. Files inside a module import each other relatively.
- **Plugins** are named (`new Elysia({ name: "plugin.x" })`), live in `src/plugin/`, and are re-exported from `src/plugin/index.ts`.
- **Formatting:** Biome (tabs, double quotes), and cspell checks `src`. Add unknown words to `cspell/project-words.txt`. Run `bun run lint` before committing.

## Demo routes

| Route | Access | Shows |
| --- | --- | --- |
| `GET /` | public | Landing page, navbar reacts to sign-in state |
| `GET/POST /register` | guests | Insert a user, hash the password, start a session |
| `GET/POST /login` | guests | Look up a user, verify the hash, start a session |
| `POST /logout` | any | End the session (POST so another site cannot log the user out) |
| `GET /todos` | protected | List the signed-in user's todos |
| `POST /todos` | protected | Create |
| `GET /todos/:id`, `/:id/edit` | protected | Read one row (display and edit form) |
| `PUT /todos/:id`, `PATCH /todos/:id/toggle` | protected | Update |
| `DELETE /todos/:id` | protected | Delete |

## Production

- Set `NODE_ENV=production` so the session cookie gets the `Secure` flag, which needs HTTPS.
- **Docker:** `docker-compose.yml` runs the app and Postgres. Put `JWT_SECRET` and `POSTGRES_PASSWORD` in `.env` (compose refuses to start without them; use a URL-safe `POSTGRES_PASSWORD`, e.g. `openssl rand -hex 16`), then:

  ```bash
  docker compose up -d --build
  docker compose --profile tools run --rm migrate   # apply migrations
  ```

  If you used the earlier dev setup, note that Postgres is now pinned to 18 and the data volume mounts at `/var/lib/postgresql`: an old `postgres_data` volume is not reused, so remove it (`docker volume rm`) or re-run `bun migrate` against the fresh database.

  The image contains no `.env` files; configuration comes from the environment, and `.dockerignore` keeps `.env*` out of the build context. The `app` service builds `DATABASE_URL` for the `postgres` service itself, so do not reuse the `localhost` URL from `.env.example`.
