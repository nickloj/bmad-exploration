---
stepsCompleted: [step-01-validate-prerequisites, step-02-design-epics, step-03-create-stories]
inputDocuments: [prd.md, architecture.md]
---

# bmad-to-do-app - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for bmad-to-do-app, decomposing the requirements from the PRD and Architecture into implementable stories.

## Requirements Inventory

### Functional Requirements

- FR1: Users can create a new todo by entering a text description
- FR2: Users can view all active todo items in a list
- FR3: Users can mark a todo item as complete
- FR4: Users can delete a todo item
- FR5: Users can view completed todo items until they auto-fade
- FR6: The system displays a completion animation when a task is marked done
- FR7: The system displays an expressive celebration when all tasks are completed (zero-list state)
- FR8: The system visually distinguishes completed tasks from active tasks
- FR9: The system automatically fades completed tasks after a configurable time period
- FR10: The system displays a visual indicator when the active task count exceeds a threshold
- FR11: The system removes faded completed tasks from the visible list
- FR12: The system persists all todo data across browser sessions via API
- FR13: The system retrieves and displays persisted todos on page load
- FR14: Each todo stores a text description, completion status, and creation timestamp
- FR15: The system displays a meaningful empty state when no tasks exist
- FR16: The system displays a loading state while data is being fetched
- FR17: The system displays error states when operations fail
- FR18: The system recovers gracefully from errors without losing user data
- FR19: The API supports creating a todo item
- FR20: The API supports retrieving all todo items
- FR21: The API supports updating a todo item's completion status
- FR22: The API supports deleting a todo item

### NonFunctional Requirements

- NFR1: Page load with full todo list renders in under 1 second
- NFR2: All user-initiated actions provide visual feedback within 100ms via optimistic UI updates
- NFR3: Celebration and completion animations run at 60fps without frame drops
- NFR4: API responses return within 200ms under normal load
- NFR5: All interactive elements are keyboard-navigable
- NFR6: Screen readers can announce task content, status, and state changes
- NFR7: Color is not the sole indicator of task completion status
- NFR8: Touch targets meet minimum 44x44px size on mobile
- NFR9: Animations respect the user's prefers-reduced-motion setting
- NFR10: API inputs are validated and sanitized to prevent injection attacks
- NFR11: API endpoints use appropriate HTTP methods
- NFR12: Error responses do not expose internal system details

### Additional Requirements

- Starter template: Vite (react-ts) + Fastify CLI (ts) — impacts Epic 1 Story 1
- Monorepo structure: client/, server/, shared/ directories
- SQLite via better-sqlite3 with CREATE TABLE IF NOT EXISTS on startup
- UUID v4 for primary keys, generated server-side
- Fastify JSON Schema validation on all routes
- Tailwind CSS for styling
- canvas-confetti for zero-list celebration
- Vitest for testing
- Shared Todo type in shared/types/todo.ts
- CORS configured for local development
- snake_case in DB, camelCase in API JSON (mapped at route handler)

### UX Design Requirements

No UX design document — UX requirements are captured within the PRD functional requirements (FR6-FR11, FR15-FR18) and architecture frontend decisions.

### FR Coverage Map

| FR | Epic | Description |
|----|------|-------------|
| FR1 | Epic 1 | Create todo |
| FR2 | Epic 1 | View active todos |
| FR3 | Epic 1 | Complete todo |
| FR4 | Epic 1 | Delete todo |
| FR5 | Epic 3 | View completed until fade |
| FR6 | Epic 2 | Completion animation |
| FR7 | Epic 2 | Zero-list celebration |
| FR8 | Epic 2 | Visual distinction completed vs active |
| FR9 | Epic 3 | Auto-fade completed tasks |
| FR10 | Epic 3 | List length visual indicator |
| FR11 | Epic 3 | Remove faded tasks |
| FR12 | Epic 1 | Persist data via API |
| FR13 | Epic 1 | Retrieve and display on load |
| FR14 | Epic 1 | Todo data model |
| FR15 | Epic 2 | Empty state |
| FR16 | Epic 2 | Loading state |
| FR17 | Epic 2 | Error state |
| FR18 | Epic 2 | Graceful error recovery |
| FR19 | Epic 1 | API create |
| FR20 | Epic 1 | API read |
| FR21 | Epic 1 | API update |
| FR22 | Epic 1 | API delete |

## Epic List

### Epic 1: Project Foundation & Core Task Management
Users can create, view, complete, and delete todos with persistent storage — the complete core loop.
**FRs covered:** FR1, FR2, FR3, FR4, FR12, FR13, FR14, FR19, FR20, FR21, FR22

### Epic 2: Visual Feedback, Rewards & Polish
Users experience satisfying completion animations, the zero-list celebration, and polished application states.
**FRs covered:** FR6, FR7, FR8, FR15, FR16, FR17, FR18

### Epic 3: Anti-Hoarding & Behavior Design
Users experience a list that actively discourages accumulation — completed tasks fade, visual nudges signal overload.
**FRs covered:** FR5, FR9, FR10, FR11

---

## Epic 1: Project Foundation & Core Task Management

**Goal:** Users can create, view, complete, and delete todos with persistent storage — the complete core loop.
**FRs covered:** FR1, FR2, FR3, FR4, FR12, FR13, FR14, FR19, FR20, FR21, FR22

### Story 1.1: Project Scaffolding & Database Setup

As a developer,
I want the monorepo project structure initialized with frontend, backend, and shared type definitions,
So that all subsequent stories have a consistent foundation to build on.

**Acceptance Criteria:**

**Given** a clean project directory
**When** the initialization commands are run
**Then** the monorepo has `client/` (Vite react-ts), `server/` (Fastify ts), and `shared/types/` directories
**And** Tailwind CSS is configured in the client
**And** better-sqlite3 is installed and the todos table is created on server startup
**And** the shared `Todo` type is defined in `shared/types/todo.ts`
**And** CORS is configured for local development
**And** both dev servers start without errors

**Test Scenarios:**

*Unit Tests:*
- `db/init.ts`: todos table is created on startup; calling init twice does not error (IF NOT EXISTS)
- `shared/types/todo.ts`: Todo type has required fields (id, text, completed, createdAt)

*Integration Tests:*
- Server starts and creates SQLite database file
- Client dev server starts and serves the React app
- Client can reach the server's `/api/todos` endpoint (CORS configured correctly)

*E2E Tests:*
- Open the app in a browser — page loads without errors, dev tools console is clean
- Both servers run concurrently and communicate successfully

### Story 1.2: API CRUD Endpoints

As a user,
I want the backend to support creating, reading, updating, and deleting todos,
So that my task data can be persisted and retrieved reliably.

**Acceptance Criteria:**

**Given** the server is running
**When** `POST /api/todos` is called with `{ "text": "Buy milk" }`
**Then** a new todo is created with UUID, completed=false, and created_at timestamp, and the todo is returned as JSON with camelCase fields

**Given** todos exist in the database
**When** `GET /api/todos` is called
**Then** all todos are returned as a JSON array with camelCase fields

**Given** a todo exists
**When** `PATCH /api/todos/:id` is called with `{ "completed": true }`
**Then** the todo's completion status is updated and the updated todo is returned

**Given** a todo exists
**When** `DELETE /api/todos/:id` is called
**Then** the todo is removed from the database and a 204 response is returned

**And** all endpoints validate input using Fastify JSON Schema
**And** invalid requests return `{ "error": "..." }` with appropriate HTTP status codes
**And** error responses do not expose internal details

**Test Scenarios:**

*Unit Tests:*
- `routes/todos.ts`: POST creates todo with UUID, completed=false, created_at; returns camelCase JSON
- `routes/todos.ts`: GET returns all todos as camelCase JSON array
- `routes/todos.ts`: PATCH updates completed status; returns updated todo
- `routes/todos.ts`: DELETE removes todo; returns 204
- `routes/todos.ts`: POST with empty text returns 400 error
- `routes/todos.ts`: POST with missing text field returns 400 error
- `routes/todos.ts`: PATCH with invalid id returns 404
- `routes/todos.ts`: DELETE with invalid id returns 404
- `routes/todos.ts`: PATCH with non-boolean completed returns 400
- `schemas/todo.ts`: JSON schemas reject invalid payloads
- snake_case DB columns map to camelCase JSON fields correctly

*Integration Tests:*
- Full CRUD cycle: create a todo, read it back, update it, delete it, confirm gone
- Creating multiple todos and retrieving all returns correct count
- Concurrent create requests each get unique UUIDs

*E2E Tests:*
- Use curl/httpie to hit each endpoint and verify response shape and status codes
- Create a todo via POST, refresh GET, confirm persistence across requests

### Story 1.3: Frontend Todo List & API Integration

As a user,
I want to see my list of todos when I open the app and add new tasks,
So that I can start tracking what I need to do.

**Acceptance Criteria:**

**Given** the user opens the app
**When** the page loads
**Then** all persisted todos are fetched from the API and displayed in a list

**Given** the todo list is displayed
**When** the user types a task description and submits
**Then** the todo appears in the list immediately via optimistic update
**And** the todo is persisted via the API

**Given** no todos exist
**When** the user opens the app
**Then** a meaningful empty state is displayed prompting the user to add a task

**Test Scenarios:**

*Unit Tests:*
- `api/todos.ts`: fetchTodos calls GET /api/todos and returns parsed Todo[]
- `api/todos.ts`: createTodo calls POST with text and returns new Todo
- `useTodos.ts`: hook initializes with isLoading=true, fetches todos, sets isLoading=false
- `useTodos.ts`: addTodo optimistically adds todo to state before API resolves
- `TodoInput.tsx`: renders input field and submit button; submit calls addTodo with input value; input clears after submit
- `TodoInput.tsx`: empty input does not trigger addTodo
- `TodoList.tsx`: renders a TodoItem for each todo in the list
- `TodoItem.tsx`: displays todo text
- `EmptyState.tsx`: renders when todos array is empty and isLoading is false

*Integration Tests:*
- `useTodos` hook fetches from real API and populates component tree
- Adding a todo via TodoInput updates the list and persists to the API

*E2E Tests:*
- Open app with existing todos — list renders with correct items
- Type a new todo and submit — it appears in the list immediately
- Open app with no todos — empty state is displayed
- Add a todo, refresh the page — todo persists and reappears

### Story 1.4: Complete & Delete Todos

As a user,
I want to mark tasks as done and remove tasks I no longer need,
So that I can manage my list and track progress.

**Acceptance Criteria:**

**Given** an active todo is displayed
**When** the user clicks/taps to complete it
**Then** the todo is marked as completed immediately via optimistic update
**And** the completion status is persisted via the API
**And** the completed todo is visually distinguishable from active todos

**Given** a todo is displayed (active or completed)
**When** the user triggers the delete action
**Then** the todo is removed from the list immediately via optimistic update
**And** the todo is deleted via the API

**Given** an API call fails (create, complete, or delete)
**When** the error is detected
**Then** the optimistic update is rolled back
**And** an inline error message is displayed
**And** no user data is lost

**Test Scenarios:**

*Unit Tests:*
- `useTodos.ts`: completeTodo optimistically sets completed=true in state
- `useTodos.ts`: deleteTodo optimistically removes todo from state
- `useTodos.ts`: on API failure, completeTodo rolls back to previous state
- `useTodos.ts`: on API failure, deleteTodo rolls back (todo reappears)
- `useTodos.ts`: on API failure, error state is set with message
- `TodoItem.tsx`: completed todo renders with visual distinction (class/style differs from active)
- `TodoItem.tsx`: clicking complete triggers completeTodo callback
- `TodoItem.tsx`: clicking delete triggers deleteTodo callback
- `ErrorMessage.tsx`: renders error text when error state is non-null

*Integration Tests:*
- Complete a todo → verify PATCH sent → verify UI reflects completed state
- Delete a todo → verify DELETE sent → verify todo removed from list
- Simulate API failure on complete → verify rollback and error message displayed
- Simulate API failure on delete → verify rollback and error message displayed

*E2E Tests:*
- Complete a todo, refresh page — todo is still marked completed
- Delete a todo, refresh page — todo is gone
- Complete a todo then delete it — both actions persist correctly
- With network throttling/offline: attempt action, verify error message appears and todo state is preserved

---

## Epic 2: Visual Feedback, Rewards & Polish

**Goal:** Users experience satisfying animations, celebrations, and polished app states.
**FRs covered:** FR6, FR7, FR8, FR15, FR16, FR17, FR18

### Story 2.1: Task Completion Animation

As a user,
I want a satisfying visual animation when I complete a task,
So that completing tasks feels rewarding and reinforces the behavior.

**Acceptance Criteria:**

**Given** an active todo is displayed
**When** the user marks it as complete
**Then** a CSS completion animation plays (e.g., strikethrough sweep, fade transition)
**And** the animation runs at 60fps without frame drops
**And** the animation does not block user interaction with other todos
**And** if prefers-reduced-motion is enabled, the animation is skipped or minimized

**Test Scenarios:**

*Unit Tests:*
- `TodoItem.tsx`: completing a todo adds the animation CSS class/transition
- `TodoItem.tsx`: with prefers-reduced-motion mocked, animation class is not applied or uses reduced variant
- Animation CSS: keyframe/transition defined for completion effect (strikethrough, opacity, etc.)

*Integration Tests:*
- Complete a todo in rendered component — verify animation class is applied and removed after transition ends
- With prefers-reduced-motion media query active — verify no animation plays

*E2E Tests:*
- Complete a todo in browser — visually verify animation plays smoothly
- Enable reduced motion in OS settings — verify animation is skipped/minimal
- Complete multiple todos rapidly — verify animations don't stack or cause jank

### Story 2.2: Zero-List Celebration

As a user,
I want an expressive celebration when I complete all my tasks,
So that clearing my list feels like an accomplishment worth repeating.

**Acceptance Criteria:**

**Given** the user has one or more active todos
**When** the user completes the last active todo (list reaches zero)
**Then** a canvas-confetti celebration animation fires
**And** the celebration is visually expressive and feels rewarding
**And** the animation runs smoothly without frame drops on mobile
**And** the celebration does not block the UI — user can still add new tasks
**And** if prefers-reduced-motion is enabled, the celebration is skipped or replaced with a subtle alternative

**Test Scenarios:**

*Unit Tests:*
- `useTodos.ts`: when last active todo is completed, a celebration trigger flag is set
- `CelebrationOverlay.tsx`: renders and calls canvas-confetti when triggered
- `CelebrationOverlay.tsx`: does not fire when active todos remain
- `CelebrationOverlay.tsx`: with prefers-reduced-motion mocked, confetti does not fire (or fires subtle alternative)

*Integration Tests:*
- Complete the last active todo in rendered app — verify canvas-confetti is called
- Complete a todo when others remain — verify no celebration fires
- Add a new todo after celebration — verify celebration dismisses and app is usable

*E2E Tests:*
- Create 2 todos, complete both — verify confetti fires on second completion
- Complete last todo, immediately add a new one — verify UI remains interactive during celebration
- Enable reduced motion — verify no confetti on zero-list
- Complete last todo on mobile viewport — verify smooth performance

### Story 2.3: Application States Polish

As a user,
I want clear visual feedback for loading, empty, and error states,
So that the app always feels responsive and I'm never confused about what's happening.

**Acceptance Criteria:**

**Given** the app is fetching data on initial load
**When** the API request is in-flight
**Then** a loading state is displayed

**Given** the API request completes with no todos
**When** the empty state is rendered
**Then** it displays a meaningful message encouraging the user to add their first task

**Given** an API request fails
**When** the error state is rendered
**Then** an inline error message is displayed (no alert dialogs)
**And** the error clears on the next successful action

**And** all interactive elements are keyboard-navigable
**And** screen readers can announce task content and status changes
**And** color is not the sole indicator of task status
**And** touch targets are at least 44x44px on mobile

**Test Scenarios:**

*Unit Tests:*
- `LoadingState.tsx`: renders loading indicator when isLoading=true
- `EmptyState.tsx`: renders encouragement message when todos=[] and isLoading=false
- `ErrorMessage.tsx`: renders error text; does not render when error is null
- `useTodos.ts`: error state clears on next successful action (add, complete, delete)
- `TodoItem.tsx`: interactive elements have tabIndex and keyboard event handlers
- `TodoItem.tsx`: completed vs active todos have distinct non-color indicators (icon, text decoration)
- `TodoItem.tsx`: buttons/touch targets render at minimum 44x44px (check computed styles)

*Integration Tests:*
- Mock slow API — verify loading state appears then disappears when data arrives
- Mock API returning empty array — verify empty state renders
- Mock API failure — verify error message renders inline, not as alert
- Trigger error then successful action — verify error clears
- Tab through all interactive elements — verify correct focus order

*E2E Tests:*
- Throttle network to slow — verify loading spinner appears on page load
- Clear all todos — verify empty state with meaningful message
- Kill the API server — attempt an action — verify inline error, no data loss
- Navigate entire app with keyboard only — all actions reachable
- Use screen reader — verify announcements for task content and status
- Test on mobile viewport — verify 44x44px touch targets

---

## Epic 3: Anti-Hoarding & Behavior Design

**Goal:** The list actively discourages accumulation through auto-fade and visual nudges.
**FRs covered:** FR5, FR9, FR10, FR11

### Story 3.1: Completed Task Auto-Fade

As a user,
I want completed tasks to gradually fade and disappear over time,
So that my list stays clean without me having to manually delete finished tasks.

**Acceptance Criteria:**

**Given** a todo has been marked as complete
**When** a configurable time period has elapsed since completion
**Then** the todo's visual opacity decreases (CSS transition)
**And** after fully fading, the todo is removed from the visible list

**Given** completed todos exist with varying ages
**When** the user views the list
**Then** newer completed todos are more visible than older ones
**And** the fade is driven by comparing the current time to the todo's created_at/completed timestamp on the client side

**Test Scenarios:**

*Unit Tests:*
- `useTodos.ts`: fade logic calculates opacity based on elapsed time since completion
- `useTodos.ts`: todos past the fade threshold are filtered from the visible list
- `useTodos.ts`: newly completed todo has full opacity; older completed todo has reduced opacity
- `TodoItem.tsx`: renders with correct opacity style based on fade value
- Fade duration is configurable via a constant

*Integration Tests:*
- Complete a todo, advance time (mock timers) — verify opacity decreases progressively
- Complete a todo, advance past full fade threshold — verify todo removed from visible list
- Multiple completed todos at different ages — verify correct relative opacity ordering

*E2E Tests:*
- Complete a todo, wait (or use short fade config) — visually verify gradual fade
- Complete a todo, wait past threshold — verify it disappears from the list
- Complete multiple todos at staggered times — verify newer ones are more visible

### Story 3.2: List Length Warning & Hoarding Nudge

As a user,
I want a visual indicator when my list gets too long,
So that I'm gently nudged to complete or clean up tasks before the list becomes overwhelming.

**Acceptance Criteria:**

**Given** the number of active (non-completed) todos exceeds a defined threshold
**When** the list is rendered
**Then** a subtle visual indicator signals the list is getting long (e.g., color shift, gentle warning)
**And** the indicator is not punishing — it's a nudge, not an alarm

**Given** the user reduces the active count below the threshold
**When** the list re-renders
**Then** the visual indicator disappears

**And** the threshold value is configurable (default value set in code)

**Test Scenarios:**

*Unit Tests:*
- `useTodos.ts` or `TodoList.tsx`: when active todo count > threshold, warning flag is set
- `useTodos.ts` or `TodoList.tsx`: when active todo count <= threshold, warning flag is false
- `TodoList.tsx`: warning indicator renders when flag is true; hidden when false
- Threshold value is configurable via a constant (e.g., MAX_LIST_THRESHOLD)
- Warning indicator does not render for completed todos (only active count matters)

*Integration Tests:*
- Add todos beyond the threshold — verify warning indicator appears
- Delete/complete todos to drop below threshold — verify warning disappears
- Threshold boundary: at exactly threshold count, no warning; at threshold+1, warning appears

*E2E Tests:*
- Add many todos past the threshold — visually verify subtle warning indicator
- Complete enough to drop below threshold — verify warning disappears
- Verify the nudge is subtle (color shift, gentle visual) not alarming
