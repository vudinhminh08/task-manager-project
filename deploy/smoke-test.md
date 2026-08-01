# Local Task Manager Smoke Test

Run the scripted API checks against a running Spring Boot API connected to
local PostgreSQL, then work through the browser acceptance items. The script
creates throwaway users and tasks and exits non-zero when an API assertion
fails.

## API check

Start PostgreSQL and the backend with the variables in `backend/.env`, then:

```bash
./deploy/api-smoke.sh
```

The default target is `http://localhost:8080`. A different local target may be
passed as the first argument. The script intentionally does not target or
describe a hosted environment.

Expected output ends with `RESULT: <passed> passed, 0 failed` and exit status 0.
If PostgreSQL is unavailable, record that limitation and still run `bash -n`
and ShellCheck (when installed); static checks do not replace the runtime API
check.

## Browser acceptance

- [ ] `GET /api/health` returns `200` and `{"status":"UP"}`.
- [ ] Registration creates two separate users; duplicate normalized email is rejected visibly.
- [ ] Valid login succeeds; invalid credentials show a visible error.
- [ ] The task list initially contains only the signed-in user's tasks.
- [ ] Create a TODO task with title, description, LOW/MEDIUM/HIGH priority, category, and a due date.
- [ ] Create a task with `dueDate: null`; the UI leaves the due date empty.
- [ ] The frontend shows a task as overdue only when a non-DONE task's due date has passed.
- [ ] Update changes title, description, status, priority, category, and due date.
- [ ] Delete requires confirmation and removes the task.
- [ ] Status, priority, and case-insensitive category filters produce the expected rows.
- [ ] Combining filters applies AND semantics.
- [ ] User B cannot view, update, or delete User A's task.
- [ ] Blank title and invalid enum values show validation feedback.
- [ ] Missing or expired authentication returns `401` and returns the user to login.
- [ ] Desktop layout has no overlap or clipped controls.
- [ ] A 375 px-wide viewport remains readable and usable.
- [ ] Browser console has no CORS, mixed-content, or uncaught errors.
- [ ] The local frontend bundle contains no database password or JWT secret.
