# How BMAD Guided the Implementation

**Project:** bmad-to-do-app  
**Dates:** 2026-04-22 → 2026-04-26  
**Artifacts:** `_bmad-output/planning-artifacts/` · `_bmad-output/implementation-artifacts/`

---

## What Is BMAD?

BMAD (Business Model Agile Development) is a structured AI-agent workflow that guides a project from raw idea to shipped code through discrete, ordered phases — each producing a document that the next phase treats as authoritative input. Rather than asking an AI agent to "build an app," BMAD forces the product, architecture, and implementation decisions to be made and recorded explicitly, at the right level of abstraction, before the first line of code is written.

For this project, every phase was executed by a Claude agent using a skill from the BMAD skill library (`.claude/skills/bmad-*/`). The output of each phase is preserved in `_bmad-output/`.

---

## Phase 1 — Product Requirements (PRD)

**Skill:** `bmad-agent-pm` / `bmad-create-prd`  
**Output:** `_bmad-output/planning-artifacts/prd.md`  
**Date:** 2026-04-22

The PM agent conducted a discovery session to define the product from first principles. Rather than starting with technology, it started with a user problem and a product philosophy.

**Key decisions produced:**

- **Core concept — radical restraint:** The PRD explicitly positioned the app against feature-bloated competitors. No priorities, no deadlines, no collaboration. The product insight — *"most people don't need a productivity system, they need a list"* — shaped every subsequent technical decision.

- **Three user journeys:** Ana's first visit, daily routine, and overloaded list. These narrative scenarios gave the implementation agents concrete behavioral targets to design for, not abstract specifications.

- **22 Functional Requirements** organized into six capability areas (task management, visual feedback, anti-hoarding, persistence, app states, API). Each FR was numbered (FR1–FR22) so every subsequent phase could trace decisions back to a requirement.

- **12 Non-Functional Requirements** covering performance (sub-100ms UI feedback, 60fps animations), accessibility (WCAG keyboard nav, 44px touch targets, reduced-motion), and security (input validation, no internal detail leakage).

- **Explicit scope boundary:** Growth features (auth, dark mode, PWA) were named and deferred to a post-MVP section, preventing scope creep during implementation.

---

## Phase 2 — Architecture

**Skill:** `bmad-agent-architect` / `bmad-create-architecture`  
**Output:** `_bmad-output/planning-artifacts/architecture.md`  
**Date:** 2026-04-22

The architect agent took the PRD as sole input and produced every technical decision the implementation agents would need — without leaving anything ambiguous.

**Key decisions produced:**

- **Technology stack:** Vite (react-ts) + Fastify CLI (ts) selected over Next.js and T3 Stack because they matched the product philosophy. One sentence rationale: *"Two lightweight starters instead of one bloated full-stack framework."*

- **Database choice:** SQLite via `better-sqlite3` (no ORM). Justified explicitly: *"The data model is too simple to justify an abstraction layer."* One table, initialized with `CREATE TABLE IF NOT EXISTS` on server startup.

- **Optimistic UI pattern:** Defined in full before any component was written — update local state immediately, fire API call, rollback state on failure. This pattern became the behavioral contract that `useTodos.ts` was built to implement.

- **State management boundary:** All state in a single `useTodos` hook. No Redux, no global context, no per-component API calls. Components receive data as props only.

- **Naming conventions established upfront:** `camelCase` in TypeScript, `snake_case` in SQL, mapped at the route handler. PascalCase for components, `use` prefix for hooks, `UPPER_SNAKE_CASE` for constants. These rules prevented agent-to-agent inconsistency across 8 implementation stories.

- **Complete directory tree:** Every file in the final project was named in this document before any story began — `useTodos.ts`, `TodoItem.tsx`, `CelebrationOverlay.tsx`, `schemas/todo.ts`, and so on. Agents didn't choose filenames; they followed the map.

- **Data flow diagram:**
  ```
  User Action → Component → useTodos hook → api/todos.ts → HTTP → Fastify route → SQLite
                                  ↑                                       |
                      optimistic update                             response
                      (immediate UI)                            (confirms/rollback)
  ```

---

## Phase 3 — Epics & Stories

**Skill:** `bmad-create-epics-and-stories`  
**Output:** `_bmad-output/planning-artifacts/epics.md`  
**Date:** 2026-04-22

The epics agent decomposed all 22 FRs into three epics and eight stories, each explicitly mapped back to FR numbers.

**Epic structure:**

| Epic | Goal | FRs Covered | Stories |
|---|---|---|---|
| **Epic 1** — Core | Full CRUD loop with persistence | FR1–4, FR12–14, FR19–22 | 1.1, 1.2, 1.3, 1.4 |
| **Epic 2** — Polish | Animations, celebration, app states | FR6–8, FR15–18 | 2.1, 2.2, 2.3 |
| **Epic 3** — Anti-Hoarding | Auto-fade, list length nudge | FR5, FR9–11 | 3.1, 3.2 |

Epics 2 and 3 both depend only on Epic 1 (not on each other), making them independently parallelizable. Within Epic 1, stories chain forward: 1.1 → 1.2 → 1.3 → 1.4.

Each story was written in Given/When/Then format with test scenarios at all three levels (unit, integration, E2E). This gave the developer agent a definition of done that was testable, not interpretable.

---

## Phase 4 — Implementation Readiness Check

**Skill:** `bmad-check-implementation-readiness`  
**Output:** `_bmad-output/planning-artifacts/implementation-readiness-report-2026-04-23.md`  
**Date:** 2026-04-23

Before any code was written, a dedicated review agent validated the planning artifacts for completeness and consistency.

**What it found:**

- **100% FR coverage** — all 22 functional requirements had traceable coverage in at least one story.
- **One major issue caught:** Story 3.1 (auto-fade) required knowing *when* a todo was completed, but the architecture schema only had `created_at` — not `completed_at`. Using creation date as a proxy would be functionally wrong. The fix (adding `completed_at TEXT DEFAULT NULL` to the schema) was prescribed before implementation began and applied to Story 1.1.
- **Two minor issues noted:** Story 1.1 uses "As a developer" format (accepted as architectural necessity); Story 2.3 bundles multiple accessibility requirements (accepted at this project's scale).

The `completed_at` catch is the clearest example of BMAD's value: a schema mistake that would have required a database migration mid-sprint was caught by a document review, not by a failing test at 2am.

---

## Phase 5 — Story Implementation

**Skill:** `bmad-dev-story`  
**Developer Agent:** Amelia (bmad-agent-dev)

Each of the 8 stories was implemented in sequence by the developer agent, using the story file as its spec and the architecture document as its style guide.

### Story 1.1 — Project Scaffolding & Database Setup
Initialized the monorepo (client/server/shared), configured Tailwind, set up SQLite with the `completed_at`-inclusive schema (corrected from the readiness check), and defined the shared `Todo` type.

### Story 1.2 — API CRUD Endpoints
Implemented all four REST endpoints with Fastify JSON Schema validation, UUID v4 primary keys, UUID regex on route params, and the snake_case → camelCase mapping layer at the handler. 19 server unit tests.

### Story 1.3 — Frontend Todo List & API Integration
Built `useTodos` hook, `TodoInput`, `TodoList`, `TodoItem`, `EmptyState`, and wired them to the API. Optimistic add was implemented; error rollback was explicitly deferred to Story 1.4 (documented in `deferred-work.md`).

### Story 1.4 — Complete & Delete Todos
Implemented optimistic complete and delete with rollback, inline error messages via `ErrorMessage`, and the `role="alert"` error pattern. Also fixed the deferred items from Story 1.3.

### Story 2.1 — Task Completion Animation
Added CSS transition for strikethrough on completion with `prefers-reduced-motion` support.

### Story 2.2 — Zero-List Celebration
Integrated `canvas-confetti` via `CelebrationOverlay`. The trigger was built into `useTodos` — when `activeCountBeforeToggle === 1` and the toggle completes it, `shouldCelebrate` is set. `useCallback` used for stable `dismissCelebration` reference.

### Story 2.3 — Application States Polish
Added `LoadingState`, completed `EmptyState`, wired all accessibility requirements (ARIA labels, `role="alert"`, keyboard handlers, touch-target sizing via Tailwind, `aria-live` region).

### Story 3.1 — Completed Task Auto-Fade
Implemented `getFadeOpacity()` in `lib/fade.ts` (time-based, pure function, fully tested). `useTodos` runs a `setInterval` while completed todos exist, drives opacity, and evicts fully-faded items. `TodoItem` renders `style={{ opacity }}`.

### Story 3.2 — List Length Warning & Hoarding Nudge
`isOverloaded` flag in `useTodos` (active count > `MAX_ACTIVE_THRESHOLD`). `HoardingNudge` component conditionally renders the warning. Threshold is a named constant — configurable.

---

## Phase 6 — Code Reviews

**Skill:** `bmad-code-review`  
**Runs:** 5 (one per story group or major story)

Code review ran after each story, producing adversarial findings across three lenses: correctness bugs, edge cases, and acceptance criteria gaps. 18+ patches were applied in total.

**Representative catches:**

| Story | Bug Found | Fix Applied |
|---|---|---|
| 1.2 | Fastify `-o` flag missing from `start`/`dev` scripts; `removeAdditional: false` silently ignored in production | Flag added to server scripts |
| 1.4 | Optimistic ID collision via `Date.now()` (predictable, not unique) | Replaced with `crypto.randomUUID()` |
| 1.4 | `prev = todos` stale closure — rapid concurrent ops could lose a rollback | Documented; deferred (single-user risk is low) |
| 3.1 | NaN in fade opacity from invalid timestamps | Input guard added to `getFadeOpacity` |
| 2.2 | `dismissCelebration` function reference unstable, causing effect re-runs | Wrapped in `useCallback` |
| 1.2 | PATCH handler re-completed already-completed todos (unnecessary write) | Idempotency guard added |

---

## Phase 7 — Retrospective

**Skill:** `bmad-retrospective`  
**Output:** `_bmad-output/implementation-artifacts/epic-all-retro-2026-04-26.md`  
**Date:** 2026-04-26

A structured post-delivery retrospective across all three epics.

**What worked:**
- Code review found real bugs every run — no false positives, no wasted cycles.
- Deferred-item tracking via `deferred-work.md` was reliable: items deferred from Story 1.3 were delivered exactly in Story 1.4.
- Incremental epics — each built cleanly on the previous with no rework of prior stories.
- 89 tests, all green throughout delivery; 0 regressions.

**Recurring challenges:**
- Accessibility was consistently an implementation afterthought and a code-review catch. ARIA issues appeared in Stories 2.1, 2.2, 2.3, and 3.2. NFR9 (reduced motion) was specified in the PRD but not consistently implemented — still open.
- React state edge cases (stale closures, unstable references, optimistic ID on in-flight requests) appeared across multiple stories. These require reasoning about concurrent renders, not just happy paths.
- Fastify configuration subtleties only surfaced during live testing, not in unit tests — the test setup constructed Fastify directly with options, masking what the production CLI invocation would do.
