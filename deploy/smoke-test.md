# Production Smoke Test

Run the scripted API checks first, then work through the browser items below.
The script covers the API contract; it cannot judge layout, console output, or
anything that needs a rendered page.

```bash
./deploy/api-smoke.sh https://<railway-host>
```

Expected: `RESULT: 47 passed, 0 failed` and exit status `0`. The script registers
throwaway accounts, so point it at production only when that is acceptable, and
record the run in `deploy/evidence/deployment-urls.md`.

- [ ] `deploy/api-smoke.sh` passes against the deployed backend.
- [ ] `GET /api/health` returns `200` and `{"status":"UP"}`.
- [ ] Vercel root opens in an incognito browser.
- [ ] Refreshing `/dashboard` does not return `404`.
- [ ] Registration creates a new user.
- [ ] Duplicate normalized email returns a visible `409` message.
- [ ] Valid credentials log in and invalid credentials return a visible `401`.
- [ ] Create one income and one expense transaction.
- [ ] List shows only the authenticated user's transactions.
- [ ] Type, category, and month filters return the expected rows.
- [ ] Detail view shows the selected transaction.
- [ ] Update changes amount, category, description, and date.
- [ ] Delete requires confirmation and removes the transaction.
- [ ] Summary income, expense, and balance update after create, edit, and delete.
- [ ] User B cannot view, update, or delete User A's transaction.
- [ ] Zero or negative amount returns field validation.
- [ ] Future date returns field validation.
- [ ] Expired or missing token returns `401` and redirects to login.
- [ ] Desktop layout has no overlap or clipped controls.
- [ ] 375 px mobile layout remains readable and usable.
- [ ] Browser console has no CORS, mixed-content, or uncaught errors.
- [ ] Frontend bundle contains no database password or JWT secret.
- [ ] Backend logs contain no repeated stack trace or connection failure.
- [ ] Backend redeploy preserves all Neon data.
- [ ] GitHub, Vercel, Railway health, and demo credential links work from another browser.

