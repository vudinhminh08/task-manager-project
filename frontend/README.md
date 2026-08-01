# Expense Tracker Frontend

Standalone Angular 21 application for the Expense Tracker.

## Prerequisites

- Node.js 22.12 or newer
- The backend running at `http://localhost:8080`

Install dependencies once:

```bash
npm install
```

## Start the development server

```bash
npm start
```

The application is available at `http://localhost:4200`. Requests to `/api` are
proxied to the local backend at `http://localhost:8080`.

## Run tests

```bash
npm test -- --watch=false
```

## Create a production build

```bash
npm run build
```

Build artifacts are written to `dist/frontend/browser`.
