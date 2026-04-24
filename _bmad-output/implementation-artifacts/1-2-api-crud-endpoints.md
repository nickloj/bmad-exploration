# Story 1.2: API CRUD Endpoints

Status: review

## Story

As a user,
I want the backend to support creating, reading, updating, and deleting todos,
so that my task data can be persisted and retrieved reliably.

## Acceptance Criteria

1. **Given** the server is running, **When** `POST /api/todos` is called with `{ "text": "Buy milk" }`, **Then** a new todo is created with UUID, completed=false, created_at timestamp, and completedAt=null, and the todo is returned as JSON with camelCase fields.

2. **Given** todos exist in the database, **When** `GET /api/todos` is called, **Then** all todos are returned as a JSON array with camelCase fields.

3. **Given** a todo exists, **When** `PATCH /api/todos/:id` is called with `{ "completed": true }`, **Then** the todo's completed status is updated to true, completed_at is set to current datetime, and the updated todo is returned with camelCase fields.

4. **Given** a completed todo exists, **When** `PATCH /api/todos/:id` is called with `{ "completed": false }`, **Then** completed is set to false, completed_at is set to null, and the updated todo is returned.

5. **Given** a todo exists, **When** `DELETE /api/todos/:id` is called, **Then** the todo is removed and a 204 response is returned.

6. All endpoints validate input using Fastify JSON Schema validation.

7. Invalid requests return `{ "error": "..." }` with appropriate HTTP status codes (400, 404).

8. Error responses do not expose internal system details (no stack traces, no SQL errors).

## Tasks / Subtasks

- [x] Task 1: Create Fastify JSON Schema definitions (AC: #6)
  - [x] Create `server/src/schemas/todo.ts` with schemas for POST body, PATCH body, and route params
- [x] Task 2: Create todo route handler with all 4 endpoints (AC: #1-5, #7, #8)
  - [x] Create `server/src/routes/api/todos/index.ts`
  - [x] Implement GET /api/todos — query all rows, map snake_case to camelCase
  - [x] Implement POST /api/todos — generate UUID v4, insert row, return created todo
  - [x] Implement PATCH /api/todos/:id — update completed + completed_at, return 404 if not found
  - [x] Implement DELETE /api/todos/:id — delete row, return 204, return 404 if not found
- [x] Task 3: Write unit tests (AC: all)
  - [x] Create `server/src/routes/api/todos/todos.test.ts`
  - [x] Test all 4 CRUD operations with valid input
  - [x] Test validation errors (empty text, missing text, invalid completed, bad id)
  - [x] Test snake_case → camelCase field mapping
- [x] Task 4: Write integration test (AC: #1-5)
  - [x] Full CRUD cycle test: create → read → update → delete → confirm gone
- [ ] Task 5: Remove the example root route (cleanup)
  - [ ] Delete or simplify `server/src/routes/root.ts` — it currently returns `{ status: "ok" }` which is fine to keep as a health check

## Dev Notes

### API Contract

| Method | Endpoint | Request Body | Response |
|--------|----------|-------------|----------|
| GET | /api/todos | — | `Todo[]` (200) |
| POST | /api/todos | `{ text: string }` | `Todo` (201) |
| PATCH | /api/todos/:id | `{ completed: boolean }` | `Todo` (200) |
| DELETE | /api/todos/:id | — | 204 No Content |

Error responses: `{ error: string }` with 400 or 404 status.

### Database Schema (already created by Story 1.1)

```sql
CREATE TABLE IF NOT EXISTS todos (
  id TEXT PRIMARY KEY,
  text TEXT NOT NULL,
  completed INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at TEXT DEFAULT NULL
);
```

### snake_case → camelCase Mapping

Map at the route handler level. DB rows use `created_at`, `completed_at`. API responses use `createdAt`, `completedAt`. The `completed` column is INTEGER (0/1) in SQLite — convert to boolean in the response.

Helper pattern:
```typescript
function toTodoResponse(row: DbTodoRow): Todo {
  return {
    id: row.id,
    text: row.text,
    completed: row.completed === 1,
    createdAt: row.created_at,
    completedAt: row.completed_at,
  };
}
```

### UUID Generation

Use `uuid` package (v11, already installed). Import: `import { v4 as uuidv4 } from 'uuid';`. Generate server-side on POST.

### Route File Location

Fastify AutoLoad is configured to load from `server/src/routes/`. The route prefix is derived from the directory structure. To get `/api/todos` endpoints, create `server/src/routes/api/todos/index.ts`. AutoLoad will register it with prefix `/api/todos`.

### Fastify JSON Schema Validation

Define schemas in `server/src/schemas/todo.ts` and reference them in route options:

```typescript
fastify.post('/api/todos', { schema: { body: createTodoSchema } }, handler);
```

### Existing Infrastructure

- `server/src/db/init.ts` — exports `getDb()` returning a better-sqlite3 Database instance
- `server/src/app.ts` — AutoLoad for plugins/ and routes/, CORS configured, calls `getDb()` on startup
- `server/src/plugins/sensible.ts` — `@fastify/sensible` registered (provides `fastify.httpErrors`)
- `shared/types/todo.ts` — `Todo`, `CreateTodoRequest`, `UpdateTodoRequest` interfaces
- `server/tsconfig.json` — paths alias `shared/*` → `../shared/*`

### Testing Approach

Use Vitest with Fastify's built-in `inject()` method for HTTP testing without a running server:

```typescript
import { build } from '../helper.js'; // or build the app directly
const app = Fastify();
app.register(todosRoutes);
const response = await app.inject({ method: 'GET', url: '/api/todos' });
```

Tests co-located with source: `server/src/routes/api/todos/todos.test.ts`.

### Parameterized Queries

All SQL queries MUST use parameterized statements to prevent injection:
```typescript
db.prepare('INSERT INTO todos (id, text) VALUES (?, ?)').run(id, text);
```
Never interpolate user input into SQL strings.

### Project Structure Notes

- Route files follow Fastify AutoLoad convention — directory structure = URL prefix
- Test files co-located with source per architecture conventions
- Import shared types directly: they work via TypeScript path aliases in tsconfig

### References

- [Source: architecture.md#API & Communication Patterns]
- [Source: architecture.md#Data Architecture]
- [Source: architecture.md#Implementation Patterns & Consistency Rules]
- [Source: architecture.md#Project Structure & Boundaries]
- [Source: epics.md#Story 1.2: API CRUD Endpoints]

### Review Findings

- [x] [Review][Decision] No maxLength on text field — resolved: maxLength set to 200. [server/src/schemas/todo.ts:5]
- [x] [Review][Patch] DELETE 204 implicit return — fixed: added explicit `return reply.send()`. [server/src/routes/api/todos/index.ts]
- [x] [Review][Patch] Ajv additionalProperties not enforced — fixed: configured `removeAdditional: false` in app.ts options export and test buildApp. [server/src/app.ts]
- [x] [Review][Patch] Validation error format — fixed: added custom error handler returning `{ error: string }`, strips internal details on 500. [server/src/routes/api/todos/index.ts]
- [x] [Review][Patch] Missing integration test — added full CRUD cycle test. [server/src/routes/api/todos/todos.test.ts]
- [x] [Review][Defer] Test DB singleton interference — deferred, pre-existing pattern from Story 1.1. [server/src/routes/api/todos/todos.test.ts]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### Change Log

### File List
