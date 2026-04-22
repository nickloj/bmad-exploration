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
