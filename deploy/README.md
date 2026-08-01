# Deployment Runbook

## Target

```text
Angular frontend  -> Vercel
Spring Boot API   -> Railway
PostgreSQL        -> Neon
```

The source repository is a monorepo. Vercel uses `frontend/` as its root
directory; Railway uses `backend/`.

## 1. Provision Neon

1. Create `expense-tracker-dev` and `expense-tracker-prod` projects.
2. Select a supported PostgreSQL version.
3. Copy the production host, database, username, and password into a password
   manager.
4. Keep SSL enabled.
5. Do not commit the connection string or paste it into screenshots.

## 2. Deploy Railway API

Railway service settings:

```text
Root Directory: backend
Build Command: ./mvnw -B -DskipTests clean package
Start Command: java -jar target/expense-tracker-api.jar
Healthcheck Path: /api/health
```

Required variables:

```text
PORT=8080
SPRING_PROFILES_ACTIVE=prod
SPRING_DATASOURCE_URL=jdbc:postgresql://<neon-host>/<database>?sslmode=require
SPRING_DATASOURCE_USERNAME=<database-user>
SPRING_DATASOURCE_PASSWORD=<database-password>
JWT_SECRET=<random-secret-with-at-least-32-bytes>
JWT_EXPIRATION_SECONDS=7200
CORS_ALLOWED_ORIGINS=http://localhost:4200
```

The bracketed values describe secret shapes and are never copied into tracked
files. Create the JWT secret locally with:

```bash
openssl rand -base64 48
```

After deployment:

```bash
curl -i https://<railway-domain>/api/health
```

Expected: `HTTP/2 200` and `{"status":"UP"}`.

## 3. Deploy Vercel Frontend

1. Set Vercel Root Directory to `frontend`.
2. Use the Angular framework preset.
3. Use `npm ci` as install command and `npm run build` as build command.
4. Confirm the Angular output directory shown by the local production build.
5. Put the public Railway URL in
   `frontend/src/environments/environment.production.ts`.
6. Add an SPA rewrite in `frontend/vercel.json` so a refreshed route returns
   `index.html`.
7. Deploy and copy the stable production domain.

The API URL is public configuration. Database credentials and JWT secrets must
never enter Angular source or Vercel frontend variables.

## 4. Close the CORS Loop

Update Railway:

```text
CORS_ALLOWED_ORIGINS=https://<vercel-production-domain>
```

Redeploy the backend and verify the Angular application can call it without a
CORS or mixed-content error.

## 5. Demo Data

1. Open the production Vercel URL in an incognito browser.
2. Register `demo.expense@example.com` with the agreed demo-only password.
3. Create at least two income and five expense transactions in the current month.
4. Include at least three categories.
5. Verify the summary cards and all filters.
6. Record the demo credentials only in the final submission report and the local
   password manager.

## 6. Release Freeze

1. Run backend tests.
2. Run frontend tests and production build.
3. Complete `deploy/smoke-test.md`.
4. Tag the accepted commit `it4409-submission`.
5. Record public URLs and commit SHA in `deploy/evidence/deployment-urls.md`.
6. Re-open every link in an incognito browser.
7. Only severity P0 or P1 fixes are allowed after freeze; repeat the full smoke
   test after each such fix.
