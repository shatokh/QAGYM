# Local Development

Local development is being introduced incrementally through approved
infrastructure tasks. The frontend, backend, Prisma configuration, and local
PostgreSQL runtime are currently available. Seed and test commands will be
added by later tasks.

## Prerequisites

- Node.js `22.13.0` or newer.
- Corepack, included with the currently selected Node.js toolchain.
- Docker Engine or Docker Desktop with Docker Compose v2.

The repository pins pnpm `11.17.0` through the root `packageManager` field.

Docker Compose is the primary supported container runtime for the MVP. Podman
compatibility is deferred and has not been verified.

## Local Environment

Create the ignored local environment file from the committed example:

```powershell
Copy-Item .env.example .env
```

The example contains non-secret local demo credentials only. Do not reuse them
for production or shared environments.

If `POSTGRES_PORT` is changed, update the port in `DATABASE_URL` to match.

## Install Dependencies

From the repository root:

```powershell
corepack pnpm install
```

Using `corepack pnpm` is compatible with PowerShell environments where direct
execution of the `pnpm.ps1` shim is restricted. If pnpm is already activated,
the equivalent `pnpm` commands may be used.

Do not disable TLS verification if package registry certificate validation
fails. Configure the approved local CA through the operating system or
`NODE_EXTRA_CA_CERTS`.

## Frontend

Start the frontend development server:

```powershell
corepack pnpm dev:web
```

The default local URL is `http://localhost:5173/`.

Run the frontend typecheck:

```powershell
corepack pnpm typecheck:web
```

Build the frontend:

```powershell
corepack pnpm build:web
```

Preview the production build:

```powershell
corepack pnpm preview:web
```

The default preview URL is `http://localhost:4173/`.

## Backend

Start the backend development server:

```powershell
corepack pnpm dev:api
```

The API uses port `3000` by default. Its current platform endpoint is:

```text
GET http://localhost:3000/health
```

Expected response:

```json
{
  "status": "ok"
}
```

Run the backend typecheck:

```powershell
corepack pnpm typecheck:api
```

Build the backend:

```powershell
corepack pnpm build:api
```

Start the compiled backend after a successful build:

```powershell
corepack pnpm start:api
```

To use another valid numeric port in PowerShell:

```powershell
$env:PORT = "3101"
corepack pnpm start:api
```

## Prisma

Prisma is configured for PostgreSQL, and Docker Compose provides the local
database service. No product model exists yet.

Define `DATABASE_URL` in the local environment or an untracked root `.env`
file. `.env.example` contains the non-secret local connection template intended
for the future Docker runtime.

Validate the Prisma schema:

```powershell
corepack pnpm db:validate
```

Format the Prisma schema:

```powershell
corepack pnpm db:format
```

These commands currently validate and format configuration only. Migration,
client generation, Studio, and seed commands are intentionally unavailable.

## PostgreSQL

Start PostgreSQL in the background:

```powershell
corepack pnpm infra:up
```

Inspect service and health status:

```powershell
corepack pnpm infra:status
```

Follow PostgreSQL logs:

```powershell
corepack pnpm infra:logs
```

Stop the service:

```powershell
corepack pnpm infra:down
```

Stopping the service does not delete the named data volume. No destructive
database reset command is provided.

## Not Available Yet

- Application containers and verified Podman support.
- Prisma migrations and seed data.
- Lint command.
- Unit, API, E2E, contract, and k6 test commands.
