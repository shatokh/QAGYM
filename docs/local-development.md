# Local Development

Local development is being introduced incrementally through approved
infrastructure tasks. The frontend and backend skeletons are currently
available; database, Docker, seed, and test commands will be added by later
tasks.

## Prerequisites

- Node.js `22.13.0` or newer.
- Corepack, included with the currently selected Node.js toolchain.

The repository pins pnpm `11.17.0` through the root `packageManager` field.

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

Prisma is configured for PostgreSQL, but no database service or product model
exists yet.

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

## Not Available Yet

- Docker Compose and PostgreSQL.
- Prisma migrations and seed data.
- Lint command.
- Unit, API, E2E, contract, and k6 test commands.
