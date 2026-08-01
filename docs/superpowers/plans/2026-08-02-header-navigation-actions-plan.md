# Header navigation actions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Place desktop navigation beside the brand and make pin/overflow controls visually identical across breakpoints.

**Architecture:** Keep existing Angular routes, account menu, and `details` overflow behavior. Adjust only header layout CSS/template classes and introduce one shared action-button style used by both controls.

**Tech Stack:** Angular standalone components, component CSS, Vitest via Angular test runner, Prettier.

---

### Task 1: Header layout

**Files:**
- Modify: `frontend/src/app/shared/app-header/app-header.component.css`
- Test: `frontend/src/app/shared/app-header/app-header.component.spec.ts`

- [ ] Add a test asserting the header contains the brand, two navigation links, and account control in the same `.header-main` container.
- [ ] Move the existing `.primary-tabs` navigation into `.header-main` while preserving route links and active state.
- [ ] Use desktop flex layout with tabs sized to content; retain a mobile media rule that makes the tabs a full-width second row.

### Task 2: Shared task action controls

**Files:**
- Modify: `frontend/src/app/features/tasks/pages/dashboard/dashboard.component.html`
- Modify: `frontend/src/styles.css`
- Test: `frontend/src/app/features/tasks/pages/dashboard/dashboard.component.spec.ts`

- [ ] Add a shared `task-action-button` class to desktop and mobile pin buttons and overflow summaries.
- [ ] Replace differing control dimensions with one 40px square style, matching border, radius, background, hover, and centered icon rules.
- [ ] Keep the active pin color modifier and existing menu semantics unchanged.
- [ ] Add a test that both controls expose the shared class in desktop and mobile task markup.

### Task 3: Verification

**Files:**
- Check: `frontend/src/app/shared/app-header/app-header.component.css`
- Check: `frontend/src/styles.css`

- [ ] Run `npm test -- --watch=false` and confirm all tests pass.
- [ ] Run `npm run build` and confirm the production bundle succeeds.
- [ ] Run Prettier check and `git diff --check`.
