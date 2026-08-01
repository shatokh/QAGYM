# Local Runbook

This is the practical Windows PowerShell sequence for starting QA Comics Gym
and running its clean application and test suites from a fresh local checkout.
Run commands from the repository root:

```powershell
Set-Location C:\Users\User\StudioProjects\QAGym
```

## 1. Prepare the Environment

Use Node.js `22.13.0` or newer, Docker Desktop with Docker Compose v2, and
Corepack:

```powershell
node --version
docker --version
docker compose version
corepack enable
corepack pnpm --version
```

Create the local environment file once:

```powershell
if (-not (Test-Path .env)) {
  Copy-Item .env.example .env
}
```

Install dependencies and generate Prisma Client:

```powershell
corepack pnpm install
```

## 2. Start PostgreSQL and Prepare Data

Start the local PostgreSQL container:

```powershell
corepack pnpm infra:up
corepack pnpm infra:status
```

Apply committed migrations and load the deterministic clean seed:

```powershell
corepack pnpm exec prisma migrate deploy
corepack pnpm db:seed
```

Verify the database container is healthy before starting the API. The seed is
repeatable and replaces the catalog/auth fixture; do not run it against data
that must be preserved.

The seed creates these public local demo accounts without preexisting sessions:

| Scenario | Email | Password | Role |
| --- | --- | --- | --- |
| User | `user@qacomics.local` | `DemoUserPassphrase2026!` | `USER` |
| Admin | `admin@qacomics.local` | `DemoAdminPassphrase2026!` | `ADMIN` |

The backend auth API and frontend login UI are implemented. Browser auth smoke
coverage is planned as a later task.

## 3. Start the Application

Use three PowerShell windows, all opened at the repository root.

### Console A: API

```powershell
corepack pnpm dev:api
```

The API listens on `http://localhost:3000`.

### Console B: Frontend

```powershell
corepack pnpm dev:web
```

The frontend listens on `http://localhost:5173` and proxies browser API calls
to the API.

### Console C: Health Check and Browser

Run the health check:

```powershell
Invoke-RestMethod http://localhost:3000/health
```

Expected result:

```text
status
------
ok
```

Open the clean application:

```text
http://localhost:5173/en/comics
http://localhost:5173/ru/comics
http://localhost:5173/en/login
http://localhost:5173/ru/login
```

Useful direct API checks:

```powershell
Invoke-RestMethod "http://localhost:3000/api/v1/comics?page=1&pageSize=6&locale=en"
Invoke-RestMethod "http://localhost:3000/api/v1/comics/neon-harbor-1?locale=en"
```

Useful backend auth checks:

```powershell
$body = @{
  email = "user@qacomics.local"
  password = "DemoUserPassphrase2026!"
} | ConvertTo-Json

$login = Invoke-WebRequest `
  -Method Post `
  -Uri "http://localhost:3000/api/v1/auth/login" `
  -ContentType "application/json" `
  -Body $body `
  -SessionVariable qcgSession

$login.Content
Invoke-RestMethod "http://localhost:3000/api/v1/auth/me" -WebSession $qcgSession
Invoke-WebRequest `
  -Method Post `
  -Uri "http://localhost:3000/api/v1/auth/logout" `
  -ContentType "application/json" `
  -Body "{}" `
  -WebSession $qcgSession
```

## 4. Run Verification

Run these commands from a repository-root console. Unit and component tests do
not require the API process to be running. The database-backed API suite does
require the PostgreSQL migration and seed from step 2.

```powershell
corepack pnpm typecheck:web
corepack pnpm typecheck:api
corepack pnpm test:web
corepack pnpm test:unit:api
corepack pnpm test:api
corepack pnpm build:web
corepack pnpm build:api
corepack pnpm test
```

Run the browser smoke suite separately. It starts managed API and Vite servers
on its configured ports, reusing an existing API outside CI when possible:

```powershell
corepack pnpm exec playwright install chromium
corepack pnpm test:e2e
```

The Playwright suite is read-only and expects the clean PostgreSQL seed. It
writes reports to ignored `playwright-report/` and `test-results/` directories.

Validate repository governance after documentation or task changes:

```powershell
node scripts/validate-task-governance.mjs
git diff --check
git status --short
```

## 5. Stop the Application

In the API and frontend consoles, press `Ctrl+C`.

Stop PostgreSQL while preserving its named volume:

```powershell
corepack pnpm infra:down
```

The next run starts again from step 2. Migrations are idempotent; rerun the
seed only when a deterministic catalog reset is required.

## Troubleshooting

### Docker is unavailable

Start Docker Desktop and confirm:

```powershell
docker info
corepack pnpm infra:status
```

Do not run the database-backed API suite or browser E2E until PostgreSQL is
healthy and the clean seed has been loaded.

### The PostgreSQL port is unavailable

Change `POSTGRES_PORT` and the matching port in `DATABASE_URL` in the ignored
`.env` file, then recreate the Compose container:

```powershell
corepack pnpm infra:down
corepack pnpm infra:up
```

### Port 3000 or 5173 is already in use

Stop the existing process or use the approved local port configuration. The
frontend proxy target must match the API port in `VITE_API_PROXY_TARGET`.

### PowerShell blocks `pnpm.ps1`

Use `corepack pnpm ...` as shown in this runbook. Do not bypass package
registry TLS verification. Configure a trusted local CA or use the documented
Node certificate-store configuration instead.
