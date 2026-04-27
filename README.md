# bmad-to-do-app

A full-stack todo application with anti-hoarding behaviour, built with React, Fastify, and SQLite.

## Tech stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS |
| Backend | Fastify 5, TypeScript, better-sqlite3 |
| Database | SQLite (file-based, no separate server) |
| Testing | Vitest, @testing-library/react, Playwright |

## Prerequisites

- Node.js ≥ 24
- npm ≥ 10

## Quick start

```bash
# 1. Install dependencies
npm install

# 2. Start both servers (hot reload)
npm run dev
```

Open **http://localhost:5173**.

The backend API runs on **http://localhost:3000**. Vite proxies `/api/*` requests to it automatically in dev.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start client + server with hot reload |
| `npm test` | Run all unit + integration tests |
| `npm run test:unit` | Unit tests only |
| `npm run test:integration` | Server integration tests only |
| `npm run test:e2e` | Playwright end-to-end + accessibility tests |

## Environment variables

Copy `.env.example` to `.env` and adjust as needed:

```bash
cp .env.example .env
```

| Variable | Default | Description |
|----------|---------|-------------|
| `SERVER_PORT` | `3000` | Host port for the backend |
| `CLIENT_PORT` | `5173` | Host port for the frontend |
| `CORS_ORIGIN` | `http://localhost:5173` | Allowed CORS origin for the API |
| `DB_PATH` | `server/data/todos.db` | SQLite database file path |

## Project structure

```
.
├── client/          # React frontend (Vite)
│   └── src/
│       ├── api/     # Fetch layer (todos.ts)
│       ├── components/
│       ├── hooks/   # useTodos — all state + optimistic updates
│       └── lib/     # fade.ts — auto-fade constants
├── server/          # Fastify backend
│   └── src/
│       ├── db/      # SQLite init + schema
│       ├── routes/  # /api/todos CRUD, /health
│       └── schemas/ # Fastify JSON Schema validation
├── shared/
│   └── types/       # Todo, CreateTodoRequest, UpdateTodoRequest
└── e2e/             # Playwright accessibility + smoke tests
```

## Docker

```bash
# Production
docker-compose up --build

# Development (hot reload via volume mounts)
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

The SQLite database is persisted in a named Docker volume (`sqlite_data`).

## API

Base URL: `http://localhost:3000`

| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| `GET` | `/api/todos` | — | `Todo[]` |
| `POST` | `/api/todos` | `{ text: string }` | `Todo` (201) |
| `PATCH` | `/api/todos/:id` | `{ completed: boolean }` | `Todo` |
| `DELETE` | `/api/todos/:id` | — | 204 |
| `GET` | `/health` | — | `{ status: "ok" }` |

Error responses: `{ error: string }` with 400 or 404 status.

## Features

- Add, complete (toggle), and delete todos
- Optimistic updates with rollback on failure
- Completed tasks auto-fade after 5 s and disappear after 20 s
- Hoarding nudge when active todo count exceeds 7
- Confetti celebration when the last active todo is completed
- WCAG AA compliant (Lighthouse score: 100/100)
- Security hardened: Helmet headers, rate limiting, UUID validation, parameterised SQL
