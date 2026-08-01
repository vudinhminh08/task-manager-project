# Task Manager

Task Manager is a local Angular SPA, Spring Boot REST API, and PostgreSQL
application for authenticated task CRUD. A task has a title, optional
description, status, priority, category, and optional due date. The frontend
derives its overdue presentation from the due date and current status.

## Architecture

```text
Angular development server (localhost:4200)
    -> local Spring Boot REST API (localhost:8080)
    -> local PostgreSQL database
```

The API authenticates requests with a JWT bearer token. Every task query is
scoped to the authenticated user, so an account cannot read or modify another
account's tasks.

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
- A local PostgreSQL database and a database user with schema-creation rights.

Maven does not need a global install; the repository ships `backend/mvnw`.

## Backend environment variables

Create `backend/.env` locally and keep it out of Git. Use a development
database. `backend/.env.example` shows the safe shape.

| Name | Purpose |
| --- | --- |
| `SPRING_DATASOURCE_URL` | JDBC URL of the local PostgreSQL database |
| `SPRING_DATASOURCE_USERNAME` | Database user |
| `SPRING_DATASOURCE_PASSWORD` | Database password |
| `JWT_SECRET` | JWT signing key, at least 32 random bytes |
| `JWT_EXPIRATION_SECONDS` | Access token lifetime; the contract uses `7200` |
| `CORS_ALLOWED_ORIGINS` | Allowed browser origin, normally `http://localhost:4200` |
| `PORT` | Backend port; defaults to `8080` |

## Running locally

Terminal 1, backend:

```bash
cd backend
set -a; source .env; set +a
./mvnw spring-boot:run
```

The schema is applied idempotently and JPA validates the mapping at startup.
Check the public health endpoint:

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

Open `http://localhost:4200`. The development proxy forwards `/api` to the
local backend at `http://localhost:8080`.

## API

Base path `/api`, JSON payloads. Register, login, and health are public;
everything else needs `Authorization: Bearer <token>`. Task payloads never
carry `userId` — the backend takes ownership from the verified token.

Task fields:

- `title` — required and non-blank.
- `description` — optional string, including `null`.
- `status` — `TODO`, `IN_PROGRESS`, or `DONE`.
- `priority` — `LOW`, `MEDIUM`, or `HIGH`.
- `category` — required string used by the category filter.
- `dueDate` — optional ISO date (`YYYY-MM-DD`), including `null`.
- `overdue` — frontend-derived presentation state; it is not an API request or response field.

| Method and path | Success | Behaviour |
| --- | --- | --- |
| `POST /api/auth/register` | `201` | Creates an account and returns a token |
| `POST /api/auth/login` | `200` | Returns a token |
| `GET /api/tasks` | `200` | Current user's tasks |
| `GET /api/tasks/{id}` | `200` | One task owned by the current user |
| `POST /api/tasks` | `201` | Creates a task and sets `Location` |
| `PUT /api/tasks/{id}` | `200` | Replaces the editable task fields |
| `DELETE /api/tasks/{id}` | `204` | Removes the task |
| `GET /api/health` | `200` | `{"status":"UP"}`, public |

`GET /api/tasks` accepts optional `status`, `priority`, and `category` query
parameters. Category matching is case-insensitive; supplied filters combine
with AND and remain scoped to the current user.

Every error uses one JSON shape with `status`, `code`, `message`, `path`, and
optional `fieldErrors`. Relevant codes include `VALIDATION_ERROR`,
`MALFORMED_REQUEST`, `INVALID_CREDENTIALS`, `UNAUTHORIZED`,
`TASK_NOT_FOUND`, `EMAIL_ALREADY_EXISTS`, and `INTERNAL_ERROR`. A `500` never
carries a stack trace, SQL, or exception name.

## Test and build commands

Backend:

```bash
cd backend
./mvnw clean test
./mvnw -DskipTests clean package
test -f target/task-manager-api.jar
```

Frontend:

```bash
cd frontend
npm ci
npm test -- --watch=false
npm run build
```

With the backend running against local PostgreSQL:

```bash
./deploy/api-smoke.sh                 # defaults to http://localhost:8080
./deploy/api-smoke.sh http://localhost:8080
```

The smoke script creates throwaway users and tasks. It is a local release check;
it does not publish the application or record a hosted environment.

## Current status

- [x] JWT authentication with BCrypt password hashing.
- [x] Task create, list, detail, update, and delete endpoints.
- [x] Status, priority, and case-insensitive category filters with AND semantics.
- [x] Per-user ownership enforcement and centralized error JSON.
- [x] Optional due dates with frontend overdue presentation.
- [ ] Browser acceptance checklist in `deploy/smoke-test.md` still needs to be run on the submitted commit.

See [deploy/smoke-test.md](deploy/smoke-test.md) for the local API and browser
acceptance checklist.
