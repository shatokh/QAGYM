# Local Development

Local development is being introduced incrementally through approved
infrastructure tasks. The frontend, backend, catalog database schema, initial
migration, clean catalog seed, and local PostgreSQL runtime are currently
available. Prisma Client integration, clean catalog read endpoints, backend unit
tests, and database-backed API tests are also available.

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

On a supported Node.js version for Windows, pnpm can use the operating system
certificate store for the current PowerShell session:

```powershell
$env:NODE_OPTIONS = "--use-system-ca"
corepack pnpm install
```

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

The backend requires a valid `DATABASE_URL`. Start PostgreSQL, apply committed
migrations, and seed the clean catalog before the first catalog run.

The API uses port `3000` by default. Available endpoints are:

```text
GET http://localhost:3000/health
GET http://localhost:3000/api/v1/comics
GET http://localhost:3000/api/v1/comics/{slug}
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

## Backend Tests

Run backend unit tests:

```powershell
corepack pnpm test
```

Prepare the database before running API tests:

```powershell
corepack pnpm infra:up
corepack pnpm exec prisma migrate deploy
corepack pnpm db:seed
```

Run backend API tests:

```powershell
corepack pnpm test:api
```

Run backend unit tests in watch mode:

```powershell
corepack pnpm --filter @qa-comics-gym/api test:watch
```

The API suite initializes Nest without binding a fixed application port. It
requires the migrated deterministic PostgreSQL fixture and is read-only after
preparation. Unit tests remain database-independent.

## Prisma

Prisma is configured for PostgreSQL, and Docker Compose provides the local
database service. The clean catalog schema and initial migration are committed.
The clean catalog seed and Prisma Client are configured.

Define `DATABASE_URL` in the local environment or an untracked root `.env`
file. `.env.example` contains the non-secret local connection template.

Validate the Prisma schema:

```powershell
corepack pnpm db:validate
```

Generate Prisma Client explicitly:

```powershell
corepack pnpm db:generate
```

`corepack pnpm install` also generates the client through the approved root
`postinstall` command. Generated files live under
`apps/api/src/generated/prisma/`, are ignored by Git, and must not be edited.

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
corepack pnpm exec prisma migrate deploy
```

When an approved task needs a custom migration, create it without applying it:

```powershell
corepack pnpm exec prisma migrate dev --name <migration-name> --create-only
```

Review and edit the generated SQL before applying it with `prisma migrate dev`.
Do not create a migration without an approved task. Prisma Studio remains
unavailable.

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
- Lint command.
- Frontend unit, E2E, and k6 test commands.
- Public Swagger/OpenAPI.
- Catalog search and filters.
