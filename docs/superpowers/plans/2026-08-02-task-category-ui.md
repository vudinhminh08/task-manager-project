# Task Category and Form UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace free-text task categories with a shared 12-tag dropdown and refine form/filter select spacing for a cleaner responsive UI.

**Architecture:** Add one small shared category constant under the tasks feature. Bind it to the task form and dashboard filter while preserving the existing string payload/API contract. Add a reusable local CSS select wrapper pattern in each component stylesheet so native keyboard behavior remains intact while the visual arrow has right-side spacing.

**Tech Stack:** Angular 21 standalone components, reactive forms, TypeScript, component-scoped CSS, Vitest through Angular CLI.

---

### Task 1: Add the shared category list and failing tests

**Files:**
- Create: `frontend/src/app/features/tasks/task-categories.ts`
- Modify: `frontend/src/app/features/tasks/pages/task-form/task-form.component.spec.ts`
- Modify: `frontend/src/app/features/tasks/pages/dashboard/dashboard.component.spec.ts`

- [ ] **Step 1: Add the shared constant and tests that describe the required options**

Add `TASK_CATEGORIES` with the exact 12 labels from the design spec. Add tests that query the rendered task form and dashboard for those options; the tests must initially fail because the templates do not yet render category selects.

- [ ] **Step 2: Run the focused tests and verify the expected failure**

Run:

```bash
cd BTL/task-manager/frontend
npx ng test --watch=false --include='src/app/features/tasks/pages/task-form/task-form.component.spec.ts' --include='src/app/features/tasks/pages/dashboard/dashboard.component.spec.ts'
```

Expected: the new option assertions fail because the current category controls are text inputs and the dashboard test has no category options.

### Task 2: Implement category dropdown behavior

**Files:**
- Modify: `frontend/src/app/features/tasks/pages/task-form/task-form.component.ts`
- Modify: `frontend/src/app/features/tasks/pages/task-form/task-form.component.html`
- Modify: `frontend/src/app/features/tasks/pages/dashboard/dashboard.component.ts`
- Modify: `frontend/src/app/features/tasks/pages/dashboard/dashboard.component.html`

- [ ] **Step 1: Expose the shared categories to both templates**

Import `TASK_CATEGORIES` and expose it as a readonly component property. Keep the existing `category` form controls as strings.

- [ ] **Step 2: Replace the task form category input with a required select**

Render a disabled placeholder followed by all 12 categories with `@for`. Preserve the existing `formControlName`, required validation, field error IDs, and edit-mode values.

- [ ] **Step 3: Replace the dashboard category text filter with a select**

Render `Tất cả` with an empty value followed by the same 12 categories. Keep the existing `activeFilters()` behavior so empty means no category filter.

- [ ] **Step 4: Run the focused tests and verify they pass**

Run the same focused command from Task 1. Expected: all focused tests pass.

### Task 3: Refine select and form visual styling

**Files:**
- Modify: `frontend/src/app/features/tasks/pages/task-form/task-form.component.html`
- Modify: `frontend/src/app/features/tasks/pages/task-form/task-form.component.css`
- Modify: `frontend/src/app/features/tasks/pages/dashboard/dashboard.component.html`
- Modify: `frontend/src/app/features/tasks/pages/dashboard/dashboard.component.css`

- [ ] **Step 1: Add select wrappers**

Wrap every task-form and dashboard filter select in `.select-shell` so a decorative chevron can be positioned independently of the native select.

- [ ] **Step 2: Add consistent spacing and alignment**

Set `.select-shell` to `position: relative`, remove native appearance from its select, add right padding of at least `2.5rem`, and position a non-interactive chevron `0.75rem` from the right edge. Keep controls at a minimum height of 44px and make grid items align at the top.

- [ ] **Step 3: Run the full frontend test suite and production build**

Run:

```bash
cd BTL/task-manager/frontend
npm test -- --watch=false
npm run build
```

Expected: 47 existing tests plus the new UI assertions pass, and Angular produces `dist/frontend/browser/index.html`.

### Task 4: Review and commit the UI change

**Files:**
- Review all files changed by Tasks 1–3.

- [ ] **Step 1: Inspect the diff and check formatting**

Run:

```bash
cd BTL/task-manager
git diff --check
git status --short
```

- [ ] **Step 2: Commit the implementation**

```bash
git add frontend/src/app/features/tasks
git commit -m "style(web): refine task category selectors"
```
