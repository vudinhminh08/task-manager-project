# Task Category and Form UI Design

## Scope

This is a frontend-only visual and interaction update for the Angular Task Manager. It does not change the Spring Boot API, PostgreSQL schema, or category validation on the server.

## Decisions

- The task form category control is a required native `<select>`.
- Users choose exactly one of these 12 predefined tags:
  1. Học tập
  2. Công việc
  3. Cá nhân
  4. Gia đình
  5. Sức khỏe
  6. Tài chính
  7. Mua sắm
  8. Dự án
  9. Kế hoạch
  10. Việc nhà
  11. Giải trí
  12. Khác
- The dashboard category filter uses the same shared list, preceded by `Tất cả`.
- Select controls use a small custom CSS chevron with right padding so the arrow is visually separated from the border.
- The form keeps the existing responsive two-column layout and receives consistent spacing, alignment, and control sizing improvements.

## Data flow

The shared `TASK_CATEGORIES` constant is imported by the task form and dashboard. The form stores the selected label in the existing `category` string control and sends it unchanged in `TaskPayload`. The dashboard sends the selected label as the existing category filter value; an empty `Tất cả` value means no category filter.

## Accessibility and compatibility

Native selects retain keyboard navigation and screen-reader semantics. The custom chevron is decorative and has `pointer-events: none`. Existing validation, edit-mode loading, API payloads, and responsive breakpoints remain unchanged.

## Verification

- A focused category-list test verifies the exact 12 labels, while existing form and dashboard tests continue to verify payload and filter behavior.
- Dashboard tests verify the category filter options use the shared list.
- `npm test -- --watch=false` and `npm run build` must pass from `frontend/`.
