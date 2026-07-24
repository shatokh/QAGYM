# Local Development

Local development is being introduced incrementally through approved
infrastructure tasks. The frontend, backend, catalog database schema, initial
migration, clean catalog seed, and local PostgreSQL runtime are currently
available. Test commands will be added by later tasks.

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
database service. The clean catalog schema and initial migration are committed.
The clean catalog seed is configured; Prisma Client is not configured yet.

Define `DATABASE_URL` in the local environment or an untracked root `.env`
file. `.env.example` contains the non-secret local connection template.

Validate the Prisma schema:

```powershell
corepack pnpm db:validate
```

Format the Prisma schema:

```powershell
corepack pnpm db:format
```

Inspect migration state:

```powershell
corepack pnpm exec prisma migrate status
```

Apply committed migrations in local development:

```powershell
corepack pnpm exec prisma migrate dev
```

When an approved task needs a custom migration, create it without applying it:

```powershell
corepack pnpm exec prisma migrate dev --name <migration-name> --create-only
```

Review and edit the generated SQL before applying it with `prisma migrate dev`.
Do not create a migration without an approved task. Client generation and
Studio remain unavailable.

Seed the clean catalog explicitly after applying migrations:

```powershell
corepack pnpm db:seed
```

The seed replaces all nine catalog tables in one transaction and restarts their
identity sequences. It does not use `CASCADE` and does not reset the migration
history. Do not run it against a database whose catalog data must be preserved.

Prisma ORM 7 does not run this seed automatically during migration commands.
The stable seed fixture reference is `docs/product/catalog-seed.md`.

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

If another PostgreSQL instance already uses host port `5432`, choose a free
port in the untracked `.env` file and use the same port in both values:

```dotenv
POSTGRES_PORT=55432
DATABASE_URL="postgresql://qa_gym:qa_gym@localhost:55432/qa_comics_gym?schema=public"
```

Recreate only the Compose container after changing the port:

```powershell
corepack pnpm infra:down
corepack pnpm infra:up
```

This preserves the named database volume.

## Not Available Yet

- Application containers and verified Podman support.
- Prisma Client integration.
- Lint command.
- Unit, API, E2E, contract, and k6 test commands.
