---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
lastStep: 8
status: 'complete'
completedAt: '2026-04-22'
inputDocuments: [prd.md]
workflowType: 'architecture'
project_name: 'bmad-to-do-app'
user_name: 'L1403711'
date: '2026-04-22'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
22 FRs across 6 capability areas. The data domain is a single entity (todo item) with three fields. All complexity resides in the interaction layer: animations, state transitions, and behavioral nudges — not in business logic or data relationships.

**Non-Functional Requirements:**
- Performance: sub-100ms UI feedback, sub-200ms API, 60fps animations
- Accessibility: keyboard nav, screen readers, reduced motion, 44px touch targets
- Security: input validation, proper HTTP methods, no internal detail leakage

**Scale & Complexity:**

- Primary domain: Full-stack web application
- Complexity level: Low
- Estimated architectural components: 3 (frontend SPA, REST API, database)

### Technical Constraints & Dependencies

- No authentication required — simplifies API and eliminates session management
- Single-user model — no multi-tenancy, no data isolation concerns
- Must support both desktop and mobile browsers
- Animations must respect prefers-reduced-motion
- Architecture must not prevent future addition of auth and multi-user

### Cross-Cutting Concerns Identified

- **Optimistic UI updates**: frontend must update immediately while API call is in-flight, with rollback on failure
- **Animation performance**: completion rewards and celebration must run at 60fps without blocking interaction
- **Error recovery**: failed API calls must not lose user data or leave UI in inconsistent state
- **Responsive design**: single codebase serving desktop and mobile experiences

## Starter Template Evaluation

### Primary Technology Domain

Full-stack web application with separate frontend (SPA) and backend (REST API) — no SSR needed, no deployment complexity.

### Starter Options Considered

| Option | Approach | Verdict |
|--------|----------|---------|
| Vite + React + TS | `npm create vite@latest` with react-ts template | Best fit for frontend — fast, minimal, well-maintained |
| Create React App | Legacy, no longer recommended | Skip — deprecated |
| Next.js | Full-stack framework with SSR | Overkill — adds server complexity we don't need |
| Fastify CLI | `npm init fastify` | Good starting point for backend, generates TypeScript scaffold |
| T3 Stack | Full-stack opinionated | Too much — includes tRPC, NextAuth, Prisma |

### Selected Approach: Vite (frontend) + Fastify CLI (backend)

**Rationale:**
Two lightweight starters instead of one bloated full-stack framework. Each is the current best-in-class for its domain. No unnecessary abstractions (no SSR, no ORM, no auth libraries). Matches the product philosophy — radical simplicity.

**Initialization Commands:**

```bash
# Frontend
npm create vite@latest client -- --template react-ts

# Backend
npm init fastify -- --lang=ts server
```

**Architectural Decisions Provided by Starters:**

**Language & Runtime:**
- TypeScript throughout (frontend and backend)
- Node.js runtime for backend

**Styling Solution:**
- Not prescribed by Vite — decided separately (CSS Modules, Tailwind, or vanilla CSS)

**Build Tooling:**
- Vite for frontend dev server and production builds
- tsx/tsc for backend TypeScript compilation

**Testing Framework:**
- Not prescribed — decided separately (Vitest is the natural choice for Vite projects)

**Code Organization:**
- Monorepo with `client/` and `server/` directories
- Shared types possible via a `shared/` directory

**Development Experience:**
- Vite HMR for instant frontend reload
- Fastify watch mode for backend auto-restart

**Database:**
- SQLite via better-sqlite3 (synchronous, zero-config, file-based)
- No ORM — direct SQL for a single-entity data model this simple

**Note:** Project initialization using these commands should be the first implementation story.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- Data model with UUID primary keys
- REST API contract (4 endpoints)
- Optimistic UI update pattern with rollback
- Tailwind CSS for styling
- canvas-confetti for celebration moments

**Important Decisions (Shape Architecture):**
- Fastify JSON Schema validation on routes
- React useState + custom useTodos hook for state
- Vitest for testing
- CSS animations for per-task completion rewards

**Deferred Decisions (Post-MVP):**
- Authentication strategy
- Deployment infrastructure
- E2E testing framework
- PWA configuration

### Data Architecture

- **Database**: SQLite via better-sqlite3 (synchronous, file-based)
- **Schema**: Single table, initialized via `CREATE TABLE IF NOT EXISTS` on server startup
- **ID Strategy**: UUID v4 generated server-side
- **Validation**: Fastify built-in JSON Schema validation on route definitions
- **No ORM**: Direct SQL — the data model is too simple to justify an abstraction layer

```sql
CREATE TABLE IF NOT EXISTS todos (
  id TEXT PRIMARY KEY,
  text TEXT NOT NULL,
  completed INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at TEXT DEFAULT NULL
);
```

### Authentication & Security

- **No authentication** for MVP — single-user local application
- **Input validation**: Fastify JSON Schema on all request bodies
- **SQL injection prevention**: Parameterized queries via better-sqlite3
- **CORS**: Configured for local development (frontend on Vite dev server port)
- **Future-proofing**: API structure supports adding auth middleware later without route changes

### API & Communication Patterns

**REST API Contract:**

| Method | Endpoint | Request Body | Response |
|--------|----------|-------------|----------|
| GET | /api/todos | — | Todo[] |
| POST | /api/todos | { text: string } | Todo |
| PATCH | /api/todos/:id | { completed: boolean } | Todo |
| DELETE | /api/todos/:id | — | 204 No Content |

**Error Responses:** `{ error: string }` with standard HTTP status codes (400, 404, 500)

**No pagination**: List size is self-limiting by design (anti-hoarding behavior)

### Frontend Architecture

- **State Management**: React useState + custom `useTodos` hook encapsulating all API calls and optimistic update logic
- **Component Architecture**: Flat — no deep nesting needed. TodoApp → TodoInput + TodoList + TodoItem + CelebrationOverlay
- **Styling**: Tailwind CSS — utility-first, fast iteration, responsive out of the box
- **Task Completion Animation**: CSS transitions/keyframes for per-task visual reward (lightweight, no library needed)
- **Zero-List Celebration**: canvas-confetti — lightweight, performant, expressive
- **Anti-Hoarding Visuals**: Tailwind conditional classes for list-length threshold indicators; CSS opacity transitions for completed task fade
- **Routing**: None — single page, single view
- **Accessibility**: Semantic HTML, ARIA attributes, keyboard handlers, prefers-reduced-motion media query to disable animations

### Infrastructure & Deployment

- **Deferred**: No deployment infrastructure for MVP
- **Local development**: Vite dev server (frontend) + Fastify with watch mode (backend)
- **Database file**: SQLite file in server directory, gitignored
- **Environment config**: `.env` files for API URL (frontend) and port/db path (backend)

### Decision Impact Analysis

**Implementation Sequence:**
1. Project scaffolding (Vite + Fastify starters, monorepo structure)
2. Database schema + API endpoints
3. Frontend components + API integration
4. Optimistic updates + error handling
5. Animations (per-task CSS + canvas-confetti celebration)
6. Anti-hoarding behavior (auto-fade, list threshold)
7. Polish (empty/loading/error states, responsive, accessibility)

**Cross-Component Dependencies:**
- Todo type definition shared between client and server (shared/ directory)
- API contract must be stable before frontend integration
- Optimistic updates depend on error handling strategy being defined
- canvas-confetti triggers depend on state management tracking active todo count

## Implementation Patterns & Consistency Rules

### Naming Patterns

**Database:**
- Tables: lowercase plural (`todos`)
- Columns: snake_case (`created_at`)

**API:**
- Endpoints: lowercase plural (`/api/todos`)
- Route params: `:id`
- JSON fields in responses: camelCase (`createdAt`)

**Code (TypeScript):**
- Components: PascalCase files and names (`TodoItem.tsx` → `TodoItem`)
- Hooks: camelCase with `use` prefix (`useTodos.ts`)
- Utilities: camelCase (`formatDate.ts`)
- Types/Interfaces: PascalCase (`Todo`, `CreateTodoRequest`)
- Variables/functions: camelCase
- Constants: UPPER_SNAKE_CASE for true constants (`MAX_LIST_THRESHOLD`)

### Structure Patterns

**Test files:** Co-located with source (`TodoItem.test.tsx` next to `TodoItem.tsx`)

**Component files:** One component per file, named to match the component

**Server routes:** Organized by resource (`server/src/routes/todos.ts`)

### Format Patterns

**API Responses:**
- Success: direct data (`Todo` or `Todo[]`) — no wrapper object
- Errors: `{ error: string }` with appropriate HTTP status
- Dates: ISO 8601 strings in JSON (`"2026-04-22T20:00:00.000Z"`)
- DB → API field mapping: snake_case in DB, camelCase in JSON (map at the API layer)

### State Management Patterns

- All state lives in the `useTodos` hook — no global state
- Immutable updates only (spread/map, never mutate)
- Optimistic update flow: update local state → fire API call → rollback on error
- Loading state: boolean `isLoading` in hook, `true` only on initial fetch

### Error Handling Patterns

- **Server**: Fastify error handler returns `{ error: string }` — never expose stack traces
- **Client**: `useTodos` hook catches API errors, stores in `error` state, clears on next successful action
- **UI**: Error state renders inline message — no alert dialogs, no console-only errors
- **Retry**: No automatic retry — user re-triggers the action manually

### Process Patterns

**Loading states:**
- `isLoading`: true during initial data fetch only
- Individual actions (add/complete/delete) use optimistic updates — no per-action loading spinners

**Empty state:** Rendered when `todos.length === 0` and `isLoading === false`

**Anti-hoarding fade:** Driven by `created_at` timestamp comparison on the client — no server-side cleanup needed for MVP

### Enforcement Guidelines

**All AI Agents MUST:**
- Follow camelCase in TypeScript, snake_case in SQL
- Map DB snake_case to API camelCase at the route handler level
- Co-locate test files with source files
- Use the `useTodos` hook as the single source of truth for todo state
- Never add dependencies without explicit approval

## Project Structure & Boundaries

### Complete Project Directory Structure

```
bmad-to-do-app/
├── package.json                  # Root workspace config
├── .gitignore
├── .env.example
├── README.md
├── client/
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── vite.config.ts
│   ├── index.html
│   ├── .env
│   ├── .env.example
│   ├── public/
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── App.css
│       ├── index.css
│       ├── components/
│       │   ├── TodoInput.tsx
│       │   ├── TodoInput.test.tsx
│       │   ├── TodoList.tsx
│       │   ├── TodoList.test.tsx
│       │   ├── TodoItem.tsx
│       │   ├── TodoItem.test.tsx
│       │   ├── CelebrationOverlay.tsx
│       │   ├── CelebrationOverlay.test.tsx
│       │   ├── EmptyState.tsx
│       │   ├── ErrorMessage.tsx
│       │   └── LoadingState.tsx
│       ├── hooks/
│       │   ├── useTodos.ts
│       │   └── useTodos.test.ts
│       └── api/
│           └── todos.ts
├── server/
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env
│   ├── .env.example
│   └── src/
│       ├── index.ts
│       ├── app.ts
│       ├── db/
│       │   ├── init.ts
│       │   └── init.test.ts
│       ├── routes/
│       │   ├── todos.ts
│       │   └── todos.test.ts
│       └── schemas/
│           └── todo.ts
└── shared/
    └── types/
        └── todo.ts
```

### Architectural Boundaries

**API Boundary:**
- Client communicates with server exclusively via REST endpoints at `/api/todos`
- `client/src/api/todos.ts` is the single file that makes HTTP calls — no fetch calls elsewhere
- Server never serves the frontend — Vite handles that in development

**Component Boundary:**
- `App.tsx` composes all components and passes `useTodos` hook data down as props
- Components are presentational — no direct API calls from components
- `CelebrationOverlay` is triggered by the hook when active todo count hits zero

**Data Boundary:**
- `server/src/db/init.ts` owns schema creation and database connection
- `server/src/routes/todos.ts` owns all SQL queries and snake_case → camelCase mapping
- `shared/types/todo.ts` defines the `Todo` interface used by both client and server

### Requirements to Structure Mapping

| FR Category | Primary Files |
|-------------|--------------|
| Task Management (FR1-5) | `TodoInput`, `TodoList`, `TodoItem`, `useTodos`, `routes/todos` |
| Visual Feedback (FR6-8) | `TodoItem` (CSS), `CelebrationOverlay`, canvas-confetti |
| Anti-Hoarding (FR9-11) | `useTodos` (fade logic), `TodoItem` (opacity), `TodoList` (threshold) |
| Data Persistence (FR12-14) | `api/todos`, `routes/todos`, `db/init` |
| Application States (FR15-18) | `EmptyState`, `LoadingState`, `ErrorMessage`, `useTodos` |
| API (FR19-22) | `routes/todos`, `schemas/todo` |

### Data Flow

```
User Action → Component → useTodos hook → api/todos.ts → HTTP → Fastify route → SQLite
                                ↑                                        |
                    optimistic update                              response
                    (immediate UI)                              (confirms/rollback)
```

## Architecture Validation Results

### Coherence Validation

**Decision Compatibility:** All technology choices are compatible — Vite/React/TypeScript frontend, Fastify/TypeScript/better-sqlite3 backend, Tailwind CSS, canvas-confetti, Vitest. No version conflicts or integration issues.

**Pattern Consistency:** Naming conventions (camelCase TS, snake_case SQL), co-located tests, single-hook state management, and optimistic update patterns are consistent across all architectural layers.

**Structure Alignment:** Monorepo with `client/` + `server/` + `shared/` supports all decisions. Boundaries are clear: API layer maps data formats, components are presentational, hook owns state.

### Requirements Coverage Validation

**Functional Requirements:** All 22 FRs mapped to specific architectural components and files. No gaps.

**Non-Functional Requirements:**
- Performance: Vite builds, optimistic updates, lightweight dependencies — covered
- Accessibility: Semantic HTML, ARIA, reduced-motion support — covered
- Security: Fastify schema validation, parameterized SQL, CORS — covered

### Implementation Readiness Validation

**Decision Completeness:** All critical decisions documented with technology choices and rationale. No ambiguous areas.

**Structure Completeness:** Full directory tree with every file specified. FR-to-file mapping complete.

**Pattern Completeness:** All potential agent conflict points addressed — naming, structure, formats, state, errors.

### Gap Analysis Results

No critical or important gaps. Minor notes:
- `shared/types/` needs TypeScript path alias configuration in both `client/` and `server/` tsconfig files
- `.env.example` files should document `VITE_API_URL` (client) and `PORT`, `DB_PATH` (server)

### Architecture Completeness Checklist

- [x] Project context analyzed
- [x] Scale and complexity assessed
- [x] Starter template selected with rationale
- [x] All critical tech decisions documented
- [x] Naming conventions established
- [x] Structure patterns defined
- [x] Error handling patterns specified
- [x] State management approach defined
- [x] Complete directory structure with file mapping
- [x] All 22 FRs mapped to architecture
- [x] All NFRs addressed
- [x] Data flow documented
- [x] Boundaries clearly defined

### Architecture Readiness Assessment

**Overall Status:** READY FOR IMPLEMENTATION

**Confidence Level:** High

**Key Strengths:**
- Radically simple — 3 components, single entity, no unnecessary abstractions
- Every FR maps to specific files with clear ownership
- Patterns prevent agent conflicts without over-specifying implementation details

**Areas for Future Enhancement:**
- Authentication middleware (when multi-user is needed)
- Deployment pipeline (when hosting is decided)
- E2E testing framework (post-MVP)

### Implementation Handoff

**AI Agent Guidelines:**
- Follow all architectural decisions exactly as documented
- Use implementation patterns consistently across all components
- Respect project structure and boundaries
- Refer to this document for all architectural questions

**First Implementation Priority:**
```bash
npm create vite@latest client -- --template react-ts
npm init fastify -- --lang=ts server
```
