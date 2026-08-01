# Environment Variable Matrix

| Variable | Local backend | Railway backend | Frontend | Secret |
| --- | --- | --- | --- | --- |
| `SPRING_PROFILES_ACTIVE` | `dev` | `prod` | Not used | No |
| `SPRING_DATASOURCE_URL` | Development Neon JDBC URL | Production Neon JDBC URL | Never | Yes |
| `SPRING_DATASOURCE_USERNAME` | Development DB user | Production DB user | Never | Yes |
| `SPRING_DATASOURCE_PASSWORD` | Development DB password | Production DB password | Never | Yes |
| `JWT_SECRET` | Local random value | Railway sealed value | Never | Yes |
| `JWT_EXPIRATION_SECONDS` | `7200` | `7200` | Never | No |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:4200` | Exact Vercel domain | Never | No |
| API base URL | `http://localhost:8080/api` | Not used | Railway public URL | No |

Rules:

- Local values live in environment variables or an untracked `.env`.
- Safe example files contain variable names, not working credentials.
- Frontend code contains only a public API base URL.
- Logs and screenshots redact all database and JWT values.

