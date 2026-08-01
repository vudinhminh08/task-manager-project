# Header navigation and task-action button design

## Scope

Improve the Task Manager header and task-list action controls without changing routing or business behavior.

## Design

- On desktop, the brand, Dashboard tab, Thống kê tab, and account control share one horizontal header row.
- On mobile, the brand/account row remains separate and the two navigation tabs stay in a second full-width row for readability.
- Dashboard and Thống kê retain active-link styling and their existing routes.
- Pin and overflow-menu controls use one shared visual contract on desktop and mobile: equal 40px square dimensions, the same border, radius, background, hover state, and centered icon. The pinned state may change only the icon color.
- The overflow menu remains implemented with the existing `details` element and keeps its current open/close behavior.

## Validation

- Component tests verify both navigation links remain available and action controls expose the shared visual class.
- Full frontend tests, production build, Prettier, and `git diff --check` must pass.
