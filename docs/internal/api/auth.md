# Internal Auth API Contract

## Status and Audience

Status: Planned contract target for Phase 2 implementation tasks.

This is an internal developer contract for clean authentication, session, and
role behavior. It is not the public training Swagger/OpenAPI document and
contains no planned bug or closed guide information.

No auth route is implemented yet. Future approved implementation tasks must
match this contract or amend it first.

## Base Routes

- Login: `POST /api/v1/auth/login`
- Logout: `POST /api/v1/auth/logout`
- Current user: `GET /api/v1/auth/me`

The platform health route remains `GET /health`, stays public, and is not part
of this product API namespace.

All successful and error responses use JSON.

## Auth Model

Guest is not a database role. Guest means no valid authenticated session.

Initial account roles are:

- `USER`
- `ADMIN`

Each account has exactly one role in the MVP. Future permission matrices or
multiple roles require a separate approved task.

## Session Model

The planned MVP session strategy is a database-backed opaque session token:

- The browser receives an opaque session identifier in one cookie.
- Session tokens are generated with a cryptographically secure random number
  generator.
- Session tokens provide at least `128` bits of entropy.
- The database stores only a hash of the session token.
- The raw session token must never be stored in the database or returned in a
  JSON response.
- Expired or revoked sessions do not authenticate.
- Logout revokes or deletes the active session.
- Demo account passwords are public local fixtures, but password hashes and
  session hashes remain implementation data and are never exposed through the
  API.

## Password Hashing Direction

The exact password hashing dependency remains future implementation-task scope,
but the approved direction is:

- Prefer Argon2id.
- Use Argon2id with at least `19 MiB` memory, `2` iterations, and parallelism
  `1`, unless implementation benchmarking justifies stronger parameters.
- Use bcrypt only as a fallback if Argon2id is not practical in the supported
  local Windows setup.
- If bcrypt is selected, use a work factor of at least `10` and account for the
  common `72` byte password input limit.
- Do not use plain SHA hashing for password storage.
- Store password hashes only, never plaintext passwords.

## Cookie Contract

Planned local MVP cookie name:

```text
qcg_session
```

Future HTTPS deployment should use the host-prefixed cookie name:

```text
__Host-qcg_session
```

The `__Host-` name is not used for the first local HTTP runtime because it
requires `Secure` and therefore HTTPS.

Cookie attributes:

| Attribute | Local MVP expectation |
| --- | --- |
| `HttpOnly` | Always enabled |
| `SameSite` | `Lax` |
| `Secure` | `false` for local HTTP, `true` for future HTTPS deployment |
| `Path` | `/` |
| `Max-Age` | Matches the server-side absolute session expiration |

Recommended initial session lifetime:

- Absolute timeout: `8` hours.
- Idle timeout: `30` minutes.

Implementation may choose the exact storage column names later, but API and
browser behavior should treat the cookie name, HTTP-only behavior, logout
clearing, absolute timeout, and idle timeout as test-visible contract.

## CSRF Posture

Current Phase 2 auth writes are:

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`

Initial CSRF posture:

- SameSite `Lax` cookie is required for the first local MVP auth slice.
- SameSite is a useful browser defense, but it is not treated as the full CSRF
  strategy for future authenticated writes.
- Login and logout must accept JSON only.
- Authenticated state-changing product APIs added later must revisit CSRF
  protection before implementation.

Future cart, checkout, order, admin, and closed-guide write APIs must either
add a documented CSRF token strategy or document why the route remains safe in
the local training context. That future decision must happen in the task that
adds the first authenticated write surface beyond login/logout.

## User DTO

Successful auth responses use this user shape:

```json
{
  "id": "usr_demo_user",
  "email": "user@qacomics.local",
  "displayName": "Demo User",
  "role": "USER"
}
```

Rules:

- `id` is a stable public identifier, not a numeric database ID.
- `email` is normalized to lowercase.
- `displayName` is a stable display value.
- `role` is `USER` or `ADMIN`.

The API must not expose:

- Password.
- Password hash.
- Session token.
- Session token hash.
- Numeric database IDs.
- Internal timestamps unless a later contract explicitly needs them.
- Closed bug guide access metadata.

## Login Endpoint

### Request

```text
POST /api/v1/auth/login
Content-Type: application/json
```

Request body:

```json
{
  "email": "user@qacomics.local",
  "password": "DemoUserPassphrase2026!"
}
```

Validation rules:

| Field | Rules |
| --- | --- |
| `email` | Required string, valid email shape, maximum 254 characters |
| `password` | Required string, 1 to 200 characters |

Email lookup is case-insensitive after normalization.

Unknown body fields are rejected. Missing, empty, invalid, or wrongly typed
fields return `INVALID_REQUEST`.

### Success

Status: HTTP `200`.

The response sets the `qcg_session` cookie and returns:

```json
{
  "data": {
    "user": {
      "id": "usr_demo_user",
      "email": "user@qacomics.local",
      "displayName": "Demo User",
      "role": "USER"
    }
  }
}
```

Login creates a new session. The implementation may revoke existing sessions
for the same account or allow multiple sessions, but the chosen behavior must
be documented before backend implementation.

### Invalid Credentials

Status: HTTP `401`.

Unknown email, wrong password, disabled account, and locked account states
return the same login response:

```json
{
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid email or password.",
    "details": []
  }
}
```

The response must not reveal whether the email exists or whether the account is
disabled or locked.

### Disabled Account

`ACCOUNT_DISABLED` is not returned by the login endpoint.

Status: HTTP `403`.

```json
{
  "error": {
    "code": "ACCOUNT_DISABLED",
    "message": "Account is disabled.",
    "details": []
  }
}
```

The first clean seed should not include a disabled account unless a later task
explicitly adds one.

This code is reserved for future authenticated or admin-facing account context
where exposing disabled state is an intentional product decision. A future task
must explicitly approve any route that returns it.

### Authentication Rate Limited

Status: HTTP `429`.

```json
{
  "error": {
    "code": "AUTH_RATE_LIMITED",
    "message": "Too many authentication attempts.",
    "details": []
  }
}
```

The first backend auth implementation must include a local-friendly throttling
or delay strategy for login attempts. The response must not reveal which
counter, bucket, account, or source triggered the limit. Exact thresholds remain
implementation-task scope.

## Logout Endpoint

### Request

```text
POST /api/v1/auth/logout
Content-Type: application/json
```

Request body:

```json
{}
```

Unknown body fields are rejected. A missing JSON body may be accepted as an
empty object if the implementation supports it consistently.

### Success

Status: HTTP `204`.

Response body: empty.

Logout is idempotent:

- A valid session is revoked or deleted and the `qcg_session` cookie is cleared.
- A missing, expired, revoked, or unknown session still returns HTTP `204` and
  clears the cookie.

Logout must not reveal whether a submitted cookie previously matched a real
session.

## Current User Endpoint

### Request

```text
GET /api/v1/auth/me
```

### Authenticated Success

Status: HTTP `200`.

```json
{
  "data": {
    "user": {
      "id": "usr_demo_admin",
      "email": "admin@qacomics.local",
      "displayName": "Demo Admin",
      "role": "ADMIN"
    }
  }
}
```

### Unauthenticated

Status: HTTP `401`.

```json
{
  "error": {
    "code": "UNAUTHENTICATED",
    "message": "Authentication required.",
    "details": []
  }
}
```

The response is the same for missing, expired, revoked, malformed, or unknown
session cookies.

## Role and Access Errors

Routes that require a role must check the authenticated user explicitly.

Recommended role policy:

- `USER` routes accept `USER` and `ADMIN` unless the route says otherwise.
- `ADMIN` routes accept only `ADMIN`.
- Guest-only routes are not part of the MVP.

Forbidden response:

Status: HTTP `403`.

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Permission denied.",
    "details": []
  }
}
```

Unauthenticated requests to protected routes return `UNAUTHENTICATED`, not
`FORBIDDEN`.

## Error Envelope

Every documented error uses:

```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Request validation failed.",
    "details": []
  }
}
```

`details` is always an array. Validation details contain:

```json
{
  "path": "email",
  "message": "Expected a valid email address."
}
```

Details are ordered by path and then message.

### Invalid Request

Status: HTTP `400`.

Code: `INVALID_REQUEST`.

Message: `Request validation failed.`

Canonical field messages:

| Path | Message |
| --- | --- |
| `email` | `Expected a valid email address.` |
| `email` | `Expected at most 254 characters.` |
| `password` | `Expected a non-empty string.` |
| `password` | `Expected at most 200 characters.` |
| Unknown body key | `Unknown body field.` |

### Internal Error

Status: HTTP `500`.

```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Internal server error.",
    "details": []
  }
}
```

The response must not contain stack traces, SQL, Prisma metadata, PostgreSQL
details, password hashes, session hashes, environment values, or another
internal exception message.

## Localization

Auth API route names, request DTOs, response DTOs, and error codes are
locale-independent.

Frontend login routes are localized (`/en/login`, `/ru/login`), but the auth
API does not accept a `locale` query parameter in the initial contract. UI copy
translation belongs to frontend resources, not API response shape.

## Demo Accounts

The planned first seed contains exactly two enabled demo accounts:

| Scenario | Email | Password | Role | Public ID |
| --- | --- | --- | --- | --- |
| User | `user@qacomics.local` | `DemoUserPassphrase2026!` | `USER` | `usr_demo_user` |
| Admin | `admin@qacomics.local` | `DemoAdminPassphrase2026!` | `ADMIN` | `usr_demo_admin` |

The passwords are documentation-visible local fixtures. They must not be reused
for real services.

Seeded single-factor demo passwords must be at least `15` characters. Future
user-chosen password policy should allow long passwords and should not impose
composition rules unless a specific approved task justifies them.

## Deferred Behavior

This contract does not define:

- Registration.
- Password reset.
- Email verification.
- MFA.
- Profile editing.
- Account management.
- Admin area routes.
- Cart, checkout, orders, or payment behavior.
- Closed bug guide access.
- Public Swagger/OpenAPI publication.
- Planned bug behavior.
