# Task Manager Frontend

Standalone Angular 21 application for the Task Manager.

## Prerequisites

- Node.js 22.12 or newer
- The local Task Manager API running at `http://localhost:8080`

Install dependencies once:

```bash
npm ci
```

## Start the development server

```bash
npm start
```

The application is available at `http://localhost:4200`. Requests to `/api`
are proxied to the local API at `http://localhost:8080`.

## Run tests

```bash
npm test -- --watch=false
```

## Create a local production build

```bash
npm run build
```

Build artifacts are written to `dist/frontend/browser`.
