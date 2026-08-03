# Internal Cart, Checkout and Orders API Contract

## Status and Audience

Status: Planned contract target for Phase 3 implementation tasks.

This is an internal developer contract for clean cart, checkout, and order
behavior. It is not the public training Swagger/OpenAPI document and contains
no planned bug or closed guide information.

The routes in this document are not implemented yet. Future cart, checkout,
and order implementation tasks must match this contract or amend it first.

## Base Routes

- CSRF token: `GET /api/v1/csrf-token`
- Current cart: `GET /api/v1/cart`
- Add cart line: `POST /api/v1/cart/lines`
- Update cart line: `PATCH /api/v1/cart/lines/{comicSlug}`
- Remove cart line: `DELETE /api/v1/cart/lines/{comicSlug}`
- Checkout: `POST /api/v1/checkout`
- Order list: `GET /api/v1/orders`
- Order detail: `GET /api/v1/orders/{orderNumber}`

The platform health route remains `GET /health`, stays public, and is not part
of this product API namespace.

All successful and error responses use JSON except successful empty-body
responses explicitly documented as HTTP `204`.

## Auth and Role Model

Guest is not a database role. Guest means no valid authenticated session.

Initial Phase 3 buyer routes are `USER`-only:

- `GET /api/v1/cart`
- `POST /api/v1/cart/lines`
- `PATCH /api/v1/cart/lines/{comicSlug}`
- `DELETE /api/v1/cart/lines/{comicSlug}`
- `POST /api/v1/checkout`
- `GET /api/v1/orders`
- `GET /api/v1/orders/{orderNumber}`

Rules:

- Missing, expired, revoked, malformed, or unknown sessions return
  `UNAUTHENTICATED`.
- Authenticated `ADMIN` requests to buyer-only Phase 3 cart, checkout, and
  order routes return `FORBIDDEN`.
- Admin order management remains Phase 4 scope and must use separate admin
  routes later.
- Users can read and mutate only their own cart and orders.
- Numeric database IDs are never used as authorization inputs.

This role boundary keeps Phase 3 focused on the seeded buyer scenario and
avoids implying admin order-management behavior before Phase 4.

## CSRF Contract

Phase 3 adopts an explicit same-origin CSRF token strategy for authenticated
browser writes.

SameSite `Lax` remains required for the `qcg_session` cookie, but SameSite is
not the full CSRF strategy for cart and checkout writes.

### CSRF Token Endpoint

```text
GET /api/v1/csrf-token
```

Auth: requires a valid `USER` session.

Success status: HTTP `200`.

```json
{
  "data": {
    "csrfToken": "opaque-csrf-token"
  }
}
```

Rules:

- The token is an opaque server-generated value.
- The token must provide at least `128` bits of entropy.
- The token is bound to the authenticated session server-side.
- The token is returned in JSON so frontend JavaScript can attach it to write
  requests.
- The token is not a password or session token.
- CSRF tokens must not be stored as plaintext if persisted.
- Logout invalidates or makes the token unusable with the logged-out session.

### Required Header

Authenticated state-changing Phase 3 routes require this header:

```text
X-QCG-CSRF-Token: <token>
```

Routes requiring the header:

- `POST /api/v1/cart/lines`
- `PATCH /api/v1/cart/lines/{comicSlug}`
- `DELETE /api/v1/cart/lines/{comicSlug}`
- `POST /api/v1/checkout`

The header is not required for:

- `GET /api/v1/csrf-token`
- `GET /api/v1/cart`
- `GET /api/v1/orders`
- `GET /api/v1/orders/{orderNumber}`
- Phase 2 `POST /api/v1/auth/login`
- Phase 2 `POST /api/v1/auth/logout`
- Phase 2 `GET /api/v1/auth/me`

Missing, malformed, expired, unknown, or session-mismatched CSRF tokens return:

Status: HTTP `403`.

```json
{
  "error": {
    "code": "CSRF_TOKEN_INVALID",
    "message": "Invalid CSRF token.",
    "details": []
  }
}
```

The response must not reveal whether a submitted token ever existed or which
session it belonged to.

## Localization

Cart, checkout, and order API route names, request DTOs, response DTOs, and
error codes are locale-independent.

The supported optional query parameter for read DTO localization is:

| Parameter | Required | Default | Rules |
| --- | --- | --- | --- |
| `locale` | No | `en` | `en` or `ru` |

Read endpoints accepting `locale`:

- `GET /api/v1/cart`
- `GET /api/v1/orders`
- `GET /api/v1/orders/{orderNumber}`

Write endpoints may accept optional `locale` only where the contract documents
that localized title snapshots are taken during the write:

- `POST /api/v1/checkout`

Unsupported, empty, repeated, or regional locale values are invalid.

Order-line title snapshots are stored using the checkout locale. If a requested
translation is unexpectedly absent at checkout, the API snapshots EN. The
snapshot exposes `contentLocale` with the locale actually used.

Frontend routes are localized, but localization of UI copy belongs to frontend
resources, not API response messages.

## Money

Money is serialized as:

```json
{
  "amountMinor": 1299,
  "currencyCode": "USD"
}
```

Rules:

- `amountMinor` is an integer minor-unit value.
- `currencyCode` is an uppercase ISO 4217 code.
- The API does not return floating point amounts, formatted prices, percentage
  discounts, tax, shipping, payment fees, or converted currency.
- The first Phase 3 implementation uses only `USD`, matching the catalog seed.

## Cart DTO

Current cart success responses use this shape:

```json
{
  "data": {
    "cart": {
      "items": [
        {
          "comicSlug": "neon-harbor-1",
          "sku": "QCG-NH-001",
          "title": "Neon Harbor: The Vanishing Beacon",
          "contentLocale": "en",
          "quantity": 2,
          "unitPrice": {
            "amountMinor": 1299,
            "currencyCode": "USD"
          },
          "lineTotal": {
            "amountMinor": 2598,
            "currencyCode": "USD"
          },
          "stock": {
            "quantity": 24,
            "inStock": true
          },
          "coverPath": "media/comics/neon-harbor-1.png"
        }
      ],
      "totalItems": 2,
      "subtotal": {
        "amountMinor": 2598,
        "currencyCode": "USD"
      }
    }
  }
}
```

Rules:

- An empty cart returns `items: []`, `totalItems: 0`, and a zero subtotal in
  `USD`.
- `totalItems` is the sum of quantities, not the number of cart lines.
- `subtotal` is derived from current catalog prices and cart quantities.
- Cart lines are ordered by first-added order ascending, then comic slug
  ascending as a deterministic tie-breaker.
- `coverPath` may be `null`; frontend fallback media behavior remains
  frontend-owned.

The cart DTO must not expose:

- Numeric database IDs.
- User internal IDs.
- Publication state.
- Internal cart timestamps.
- Passwords, password hashes, session tokens, or session hashes.
- Closed bug guide metadata.

## Order DTOs

### Order Summary

```json
{
  "orderNumber": "QCG-20260803-0001",
  "status": "PLACED",
  "createdAt": "2026-08-03T12:00:00.000Z",
  "totalItems": 2,
  "total": {
    "amountMinor": 2598,
    "currencyCode": "USD"
  }
}
```

### Checkout Address

```json
{
  "recipientName": "Demo User",
  "addressLine1": "101 Test Loop",
  "addressLine2": "Suite QA",
  "city": "Testville",
  "region": "CA",
  "postalCode": "90001",
  "countryCode": "US"
}
```

Rules:

- `addressLine2` and `region` may be `null`.
- Address fields are order snapshots and do not update a user profile.
- `countryCode` uses an uppercase ISO 3166-1 alpha-2 code.
- The first allowed country-code set is `US`, `PL`, and `GB`.

### Order Line

```json
{
  "comicSlug": "neon-harbor-1",
  "sku": "QCG-NH-001",
  "title": "Neon Harbor: The Vanishing Beacon",
  "contentLocale": "en",
  "quantity": 2,
  "unitPrice": {
    "amountMinor": 1299,
    "currencyCode": "USD"
  },
  "lineTotal": {
    "amountMinor": 2598,
    "currencyCode": "USD"
  }
}
```

Order line fields are snapshots captured at checkout. Historical order line
titles, prices, currency, quantities, and totals do not change when catalog
records change later.

### Order Detail

```json
{
  "data": {
    "order": {
      "orderNumber": "QCG-20260803-0001",
      "status": "PLACED",
      "createdAt": "2026-08-03T12:00:00.000Z",
      "address": {
        "recipientName": "Demo User",
        "addressLine1": "101 Test Loop",
        "addressLine2": "Suite QA",
        "city": "Testville",
        "region": "CA",
        "postalCode": "90001",
        "countryCode": "US"
      },
      "items": [],
      "totalItems": 0,
      "total": {
        "amountMinor": 0,
        "currencyCode": "USD"
      }
    }
  }
}
```

The example uses an empty `items` array only to abbreviate the shape. A created
clean order always has at least one item.

Order DTOs must not expose:

- Numeric database IDs.
- Other users' order state.
- Payment credentials.
- Payment provider identifiers.
- Internal fulfillment data.
- Closed bug guide metadata.

## Order Statuses

Initial order statuses:

- `PLACED`
- `CANCELLED`

The first checkout implementation creates `PLACED` orders only.

`CANCELLED` may be used by future seed, order-history display, or Phase 4 admin
tasks, but Phase 3 does not implement user cancellation or admin status
mutation unless a later approved task explicitly adds it.

## Current Cart Endpoint

### Request

```text
GET /api/v1/cart?locale=en
```

Auth: `USER`.

Supported query parameters:

| Parameter | Required | Default | Rules |
| --- | --- | --- | --- |
| `locale` | No | `en` | `en` or `ru` |

Unknown and repeated query parameters are rejected.

### Success

Status: HTTP `200`.

Returns the Cart DTO.

If the user has no cart, the API returns an empty cart DTO. It does not require
the client to create a cart first.

## Add Cart Line Endpoint

### Request

```text
POST /api/v1/cart/lines
Content-Type: application/json
X-QCG-CSRF-Token: <token>
```

Auth: `USER`.

Request body:

```json
{
  "comicSlug": "neon-harbor-1",
  "quantity": 1
}
```

Validation rules:

| Field | Rules |
| --- | --- |
| `comicSlug` | Required valid comic slug |
| `quantity` | Required integer from 1 to 99 |

Unknown body fields are rejected.

Clean behavior:

- Creates the user's cart if no active cart exists.
- Adds a new line when the comic is not already in cart.
- Increases the existing line quantity when the comic is already in cart.
- Rejects draft, archived, unknown, and out-of-stock comics.
- Rejects the request if the resulting quantity would exceed current stock.

### Success

Status: HTTP `200`.

Returns the updated Cart DTO.

## Update Cart Line Endpoint

### Request

```text
PATCH /api/v1/cart/lines/{comicSlug}
Content-Type: application/json
X-QCG-CSRF-Token: <token>
```

Auth: `USER`.

Path parameter:

| Parameter | Rules |
| --- | --- |
| `comicSlug` | Valid comic slug |

Request body:

```json
{
  "quantity": 2
}
```

Validation rules:

| Field | Rules |
| --- | --- |
| `quantity` | Required integer from 1 to 99 |

Unknown body fields are rejected. Quantity `0` is invalid; removal uses the
DELETE endpoint.

Clean behavior:

- Updates an existing cart line to the exact requested quantity.
- Rejects missing cart lines with `CART_LINE_NOT_FOUND`.
- Rejects the request if quantity exceeds current stock.
- Rejects stale lines whose comic is no longer purchasable.

### Success

Status: HTTP `200`.

Returns the updated Cart DTO.

## Remove Cart Line Endpoint

### Request

```text
DELETE /api/v1/cart/lines/{comicSlug}
X-QCG-CSRF-Token: <token>
```

Auth: `USER`.

Path parameter:

| Parameter | Rules |
| --- | --- |
| `comicSlug` | Valid comic slug |

### Success

Status: HTTP `204`.

Response body: empty.

Removal is idempotent for a valid authenticated user's cart: deleting a line
that is already absent still returns HTTP `204`. It must not reveal another
user's cart state.

## Checkout Endpoint

### Request

```text
POST /api/v1/checkout?locale=en
Content-Type: application/json
X-QCG-CSRF-Token: <token>
```

Auth: `USER`.

Supported query parameters:

| Parameter | Required | Default | Rules |
| --- | --- | --- | --- |
| `locale` | No | `en` | `en` or `ru` |

Request body:

```json
{
  "address": {
    "recipientName": "Demo User",
    "addressLine1": "101 Test Loop",
    "addressLine2": "Suite QA",
    "city": "Testville",
    "region": "CA",
    "postalCode": "90001",
    "countryCode": "US"
  }
}
```

Address validation rules:

| Field | Rules |
| --- | --- |
| `recipientName` | Required string, 1 to 120 characters |
| `addressLine1` | Required string, 1 to 160 characters |
| `addressLine2` | Optional string, 1 to 160 characters when present |
| `city` | Required string, 1 to 120 characters |
| `region` | Optional string, 1 to 120 characters when present |
| `postalCode` | Required string, 1 to 32 characters |
| `countryCode` | Required one of `US`, `PL`, `GB` |

Unknown body fields are rejected.

### Success

Status: HTTP `201`.

Returns the created Order Detail DTO.

### Transaction Behavior

Checkout is atomic:

- The cart is loaded for the authenticated user.
- Empty cart returns `CART_EMPTY`.
- Each cart line is revalidated against current comic publication state and
  stock.
- Order-line snapshots are captured from the current catalog record and
  checkout locale.
- The order and order lines are created.
- Stock is decremented for purchased comics.
- Purchased cart lines are cleared.

All order creation, stock decrement, and cart clearing happen in one database
transaction. If any step fails, the API must not partially create an order,
partially decrement stock, or partially clear the cart.

Concurrent checkout must not oversell stock in clean behavior. The exact
database locking or conditional update strategy belongs to implementation, but
the observable contract is no oversell.

## Order List Endpoint

### Request

```text
GET /api/v1/orders?page=1&pageSize=12
```

Auth: `USER`.

Supported query parameters:

| Parameter | Required | Default | Rules |
| --- | --- | --- | --- |
| `page` | No | `1` | Decimal positive integer |
| `pageSize` | No | `12` | Decimal positive integer, maximum `50` |

Unknown and repeated query parameters are rejected.

### Ordering

Order list order is:

1. Creation time descending.
2. Internal order ID descending as a deterministic tie-breaker.

The internal ID is not returned.

### Success

Status: HTTP `200`.

```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "pageSize": 12,
    "totalItems": 0,
    "totalPages": 0
  }
}
```

`data` contains Order Summary DTOs. A page beyond the final page returns HTTP
`200` with an empty `data` array while preserving total metadata.

## Order Detail Endpoint

### Request

```text
GET /api/v1/orders/{orderNumber}
```

Auth: `USER`.

The order number must use this initial format:

```text
QCG-YYYYMMDD-NNNN
```

Example:

```text
QCG-20260803-0001
```

### Success

Status: HTTP `200`.

Returns the Order Detail DTO.

### Not Found

A valid order number returns the same HTTP `404` response when it is:

- Unknown.
- Owned by another user.

The response does not reveal whether another user's order exists.

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
  "path": "quantity",
  "message": "Expected an integer from 1 to 99."
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
| `comicSlug` | `Expected a valid comic slug.` |
| `quantity` | `Expected an integer from 1 to 99.` |
| `locale` | `Expected one of: en, ru.` |
| `page` | `Expected a positive integer.` |
| `pageSize` | `Expected an integer from 1 to 50.` |
| `orderNumber` | `Expected a valid order number.` |
| `address.recipientName` | `Expected a string from 1 to 120 characters.` |
| `address.addressLine1` | `Expected a string from 1 to 160 characters.` |
| `address.addressLine2` | `Expected a string from 1 to 160 characters.` |
| `address.city` | `Expected a string from 1 to 120 characters.` |
| `address.region` | `Expected a string from 1 to 120 characters.` |
| `address.postalCode` | `Expected a string from 1 to 32 characters.` |
| `address.countryCode` | `Expected one of: US, PL, GB.` |
| Unknown query key | `Unknown query parameter.` |
| Unknown body key | `Unknown body field.` |

### Authentication and Authorization

Unauthenticated:

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

Forbidden:

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

CSRF invalid:

Status: HTTP `403`.

```json
{
  "error": {
    "code": "CSRF_TOKEN_INVALID",
    "message": "Invalid CSRF token.",
    "details": []
  }
}
```

### Product Not Purchasable

Status: HTTP `404`.

```json
{
  "error": {
    "code": "COMIC_NOT_FOUND",
    "message": "Comic not found.",
    "details": []
  }
}
```

The same response is used for unknown, draft, archived, and otherwise
non-purchasable comics at the cart API boundary.

### Cart Line Not Found

Status: HTTP `404`.

```json
{
  "error": {
    "code": "CART_LINE_NOT_FOUND",
    "message": "Cart line not found.",
    "details": []
  }
}
```

Used by quantity update when the user's cart does not contain the requested
comic.

### Insufficient Stock

Status: HTTP `409`.

```json
{
  "error": {
    "code": "INSUFFICIENT_STOCK",
    "message": "Insufficient stock.",
    "details": []
  }
}
```

The first implementation may include field details only if they do not expose
internal database IDs or another user's state.

### Empty Cart

Status: HTTP `409`.

```json
{
  "error": {
    "code": "CART_EMPTY",
    "message": "Cart is empty.",
    "details": []
  }
}
```

### Checkout Conflict

Status: HTTP `409`.

```json
{
  "error": {
    "code": "CHECKOUT_CONFLICT",
    "message": "Checkout could not be completed.",
    "details": []
  }
}
```

Used when cart state changes during checkout in a way that is not better
represented by `COMIC_NOT_FOUND`, `INSUFFICIENT_STOCK`, or `CART_EMPTY`.

### Order Not Found

Status: HTTP `404`.

```json
{
  "error": {
    "code": "ORDER_NOT_FOUND",
    "message": "Order not found.",
    "details": []
  }
}
```

Used for unknown orders and orders owned by another user.

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
details, password hashes, session hashes, CSRF token data, environment values,
or another internal exception message.

## Database and Lifecycle Behavior

- Prisma Client uses the repository schema and PostgreSQL adapter.
- API startup requires a valid `DATABASE_URL`.
- Database connections close when the Nest application closes.
- Cart writes and checkout require a valid authenticated session.
- Cart reads and writes do not mutate order history.
- Checkout mutates cart, order, and comic stock state only inside the checkout
  transaction.
- Seed reset must restore deterministic catalog and auth fixtures and any
  later approved cart/order fixtures.

## Deferred Behavior

This contract does not define:

- Guest or anonymous carts.
- Cart merge.
- Wishlists.
- Saved addresses.
- Profile editing.
- Registration.
- Payment providers, card data, or fake provider tokens.
- Tax, shipping costs, promotion codes, or discount engines.
- Inventory reservations, backorders, warehouses, or stock history.
- User order cancellation.
- Admin order management.
- Email confirmation.
- Public Swagger/OpenAPI.
- Planned bug behavior.
