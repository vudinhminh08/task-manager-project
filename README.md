# IT4409 Expense Tracker

Personal income and expense manager for the IT4409 final project, built as an
Angular SPA, Spring Boot REST API, and PostgreSQL database.

## Architecture

```text
Angular on Vercel
    -> Spring Boot REST API on Railway
    -> PostgreSQL on Neon
```

Angular calls the API with a JWT bearer token. Spring Security resolves the
current user from that token, and every transaction query is scoped by the
authenticated user id, so one account can never read or modify another's data.

## Tech stack

| Layer | Choice |
| --- | --- |
| Frontend | Angular 21, standalone components, reactive forms |
| Backend | Java 21, Spring Boot 4.1, Spring Web MVC, Spring Data JPA, Spring Security |
| Database | PostgreSQL, schema applied from `backend/src/main/resources/schema.sql` |
| Build | Maven Wrapper (`backend/mvnw`), Angular CLI |

## Requirements

- Node.js 22.12 or newer, with npm.
- JDK 21, with `JAVA_HOME` pointing at it.
- A PostgreSQL database (local or a Neon development branch).

Maven does not need a global install; the repository ships `backend/mvnw`.

## Backend environment variables

Create `backend/.env` locally and keep it out of Git. Use a development
database, never production. `backend/.env.example` shows the safe shape.

| Name | Purpose |
| --- | --- |
| `SPRING_DATASOURCE_URL` | JDBC URL of the PostgreSQL database |
| `SPRING_DATASOURCE_USERNAME` | Database user |
| `SPRING_DATASOURCE_PASSWORD` | Database password |
| `JWT_SECRET` | JWT signing key, at least 32 random bytes |
| `JWT_EXPIRATION_SECONDS` | Access token lifetime; the contract uses `7200` |
| `CORS_ALLOWED_ORIGINS` | Allowed browser origin, e.g. `http://localhost:4200` |
| `PORT` | Backend port; defaults to `8080` |

## Running locally

Terminal 1, backend:

```bash
cd backend
set -a; source .env; set +a
./mvnw spring-boot:run
```

`schema.sql` creates the schema idempotently and JPA verifies the mapping with
`ddl-auto=validate`. Check the public health endpoint:

```bash
curl --fail-with-body http://localhost:8080/api/health
# {"status":"UP"}
```

Terminal 2, frontend:

```bash
cd frontend
npm ci
npm start
```

Open `http://localhost:4200`. `npm start` uses `frontend/proxy.conf.json` to
forward `/api` to `http://localhost:8080`, so no source change is needed
locally.

## API

Base path `/api`, JSON payloads. Register, login, and health are public;
everything else needs `Authorization: Bearer <token>`. Transaction payloads
never carry a `userId` — the backend always takes it from the verified token.

| Method and path | Success | Behaviour |
| --- | --- | --- |
| `POST /api/auth/register` | `201` | Creates an account and returns a token |
| `POST /api/auth/login` | `200` | Returns a token |
| `GET /api/transactions` | `200` | Current user's transactions, newest first |
| `GET /api/transactions/{id}` | `200` | One transaction owned by the current user |
| `POST /api/transactions` | `201` | Creates a transaction, sets `Location` |
| `PUT /api/transactions/{id}` | `200` | Replaces the editable fields |
| `DELETE /api/transactions/{id}` | `204` | Removes the transaction |
| `GET /api/health` | `200` | `{"status":"UP"}`, public |

`GET /api/transactions` accepts optional `type` (`INCOME`/`EXPENSE`),
`category` (whole-value, case-insensitive), and `month` (`YYYY-MM`). Filters
combine with AND and are always scoped to the current user.

Every error uses one shape:

```json
{
  "timestamp": "2026-07-31T09:20:11Z",
  "status": 400,
  "code": "VALIDATION_ERROR",
  "message": "Dữ liệu không hợp lệ",
  "path": "/api/transactions",
  "fieldErrors": { "amount": "Số tiền phải lớn hơn 0" }
}
```

Codes in use: `VALIDATION_ERROR`, `MALFORMED_REQUEST`, `INVALID_CREDENTIALS`,
`UNAUTHORIZED`, `TRANSACTION_NOT_FOUND`, `EMAIL_ALREADY_EXISTS`,
`INTERNAL_ERROR`. A `500` never carries a stack trace, SQL, or exception name.

## Test and build commands

Backend:

```bash
cd backend
./mvnw clean test
./mvnw -DskipTests clean package
test -f target/expense-tracker-api.jar
```

Frontend:

```bash
cd frontend
npm ci
npm test -- --watch=false
npm run build
```

Against a running backend on PostgreSQL:

```bash
./deploy/api-smoke.sh                        # defaults to localhost:8080
./deploy/api-smoke.sh https://<railway-host> # a deployed backend
```

Last recorded run: backend 59 tests pass and the packaged jar is produced;
frontend 55 tests across 13 files pass and the production bundle builds; the API
smoke run reports 47 passed, 0 failed against PostgreSQL 16; the browser
walkthrough passes on desktop and at 375 px. Re-run all of these on the commit
you actually submit rather than trusting this line.

### Two limitations worth knowing

The automated backend suite runs on H2, which accepts SQL that PostgreSQL
rejects. Run `deploy/api-smoke.sh` against PostgreSQL before believing the API
works.

`npm test` cannot replace opening the app in a browser. TestBed installs its own
zone regardless of how the application is configured, so every component test
can pass while the running app never repaints.

## Current status

- [x] Auth with BCrypt hashing and stateless JWT.
- [x] Transaction create, list, detail, update, delete.
- [x] Type, category, and month filters.
- [x] Income, expense, and balance summary cards.
- [x] Ownership enforcement, backend validation, centralized error JSON.
- [x] Responsive desktop and mobile layout, verified at 1280 px and 375 px.
- [ ] Public deployment URLs and production smoke evidence, to be recorded only
      after a successful deployment.
- [ ] `frontend/src/environments/environment.production.ts` still points at a
      placeholder Railway host and must be set to the real domain before the
      Vercel build.

## Deployment

See [deploy/README.md](deploy/README.md) for the runbook and
[deploy/smoke-test.md](deploy/smoke-test.md) for the production checklist.
