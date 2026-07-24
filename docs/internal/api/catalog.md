# Internal Catalog API Contract

## Status and Audience

Status: Implemented contract target for task `0015`.

This is an internal developer contract for clean catalog behavior. It is not
the public training Swagger/OpenAPI document and contains no planned bug or
closed guide information.

## Base Routes

- List: `GET /api/v1/comics`
- Detail: `GET /api/v1/comics/{slug}`

The platform health route remains `GET /health` and is not part of this product
API namespace.

All successful and error responses use JSON.

## Supported Locales

The supported API locale values are:

- `en`
- `ru`

Both routes accept the optional query parameter `locale`. Omitted locale means
`en`.

Examples:

```text
GET /api/v1/comics?locale=ru
GET /api/v1/comics/neon-harbor-1?locale=en
```

Unsupported, empty, or repeated locale values are invalid. Regional values
such as `en-US` are not accepted in the initial contract.

If a requested translation is unexpectedly absent, the API selects the EN
translation for that entity. Comic, series, and genre fallback are independent.
Every localized object exposes `contentLocale` with the locale actually used.
The standard clean seed contains complete EN and RU content and does not rely
on fallback.

## Money

Money is serialized as:

```json
{
  "amountMinor": 1299,
  "currencyCode": "USD"
}
```

`amountMinor` is an integer minor-unit value. The API does not return floating
point amounts, formatted prices, percentage discounts, or converted currency.

`compareAtPrice` is either the same money shape or `null`.

## Stock

Stock is serialized as:

```json
{
  "quantity": 24,
  "inStock": true
}
```

`inStock` is exactly `quantity > 0`. Published out-of-stock comics remain
visible.

## Catalog Item Shapes

### List Item

```json
{
  "slug": "neon-harbor-1",
  "sku": "QCG-NH-001",
  "title": "Neon Harbor: The Vanishing Beacon",
  "contentLocale": "en",
  "series": {
    "slug": "neon-harbor",
    "title": "Neon Harbor",
    "contentLocale": "en",
    "issueNumber": 1
  },
  "creators": [
    {
      "slug": "nora-vale",
      "displayName": "Nora Vale",
      "role": "WRITER"
    }
  ],
  "genres": [
    {
      "slug": "mystery",
      "name": "Mystery",
      "contentLocale": "en"
    }
  ],
  "price": {
    "amountMinor": 1299,
    "currencyCode": "USD"
  },
  "compareAtPrice": null,
  "stock": {
    "quantity": 24,
    "inStock": true
  },
  "coverPath": "media/comics/neon-harbor-1.png"
}
```

Standalone comics return `series: null`. A missing database cover path returns
`coverPath: null`; frontend behavior selects the repository fallback asset.

### Detail Item

The detail item contains every list item field and adds:

```json
{
  "description": "Localized comic description."
}
```

The API does not expose:

- Numeric database IDs.
- Publication state.
- Merchandising sort order.
- Creation or update timestamps.
- Raw translation arrays.

## Creator and Genre Ordering

Creator response order is:

1. `WRITER` before `ARTIST`.
2. Credit sort order ascending.
3. Creator slug ascending.

Genre response order is genre slug ascending. This avoids database-collation
differences and remains stable across locales.

## List Endpoint

### Request

```text
GET /api/v1/comics
```

Supported query parameters:

| Parameter | Required | Default | Rules |
| --- | --- | --- | --- |
| `page` | No | `1` | Decimal positive integer |
| `pageSize` | No | `12` | Decimal positive integer, maximum `50` |
| `locale` | No | `en` | `en` or `ru` |

Unknown query parameters are rejected. Repeated values are rejected.

### Visibility and Ordering

Only `PUBLISHED` comics are returned.

Default list order is:

1. Merchandising sort order ascending.
2. Internal comic ID ascending as a tie-breaker.

The internal values used for ordering are not returned.

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

`data` contains list items. A page beyond the final page returns HTTP `200`
with an empty `data` array while preserving total metadata.

`totalPages` is `0` when `totalItems` is `0`. Otherwise it is
`ceil(totalItems / pageSize)`.

## Detail Endpoint

### Request

```text
GET /api/v1/comics/{slug}
```

The slug must:

- Be at most 120 characters.
- Contain lowercase ASCII letters, digits, and single hyphen separators.
- Start and end with a letter or digit.

The only supported query parameter is optional `locale=en|ru`. Unknown query
parameters are rejected.

### Success

Status: HTTP `200`.

```json
{
  "data": {
    "slug": "neon-harbor-1",
    "description": "Localized comic description."
  }
}
```

The abbreviated example above does not replace the complete detail item shape.

### Not Found

A valid slug returns the same HTTP `404` response when it is:

- Unknown.
- A draft comic.
- An archived comic.

The response does not reveal whether an unpublished record exists.

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
  "path": "page",
  "message": "Expected a positive integer."
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
| `page` | `Expected a positive integer.` |
| `pageSize` | `Expected an integer from 1 to 50.` |
| `locale` | `Expected one of: en, ru.` |
| `slug` | `Expected a valid comic slug.` |
| Unknown query key | `Unknown query parameter.` |

### Comic Not Found

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

The response must not contain a stack trace, SQL, Prisma metadata, PostgreSQL
details, environment values, or another internal exception message.

## Database and Lifecycle Behavior

- Prisma Client uses the repository schema and PostgreSQL adapter.
- API startup requires a valid `DATABASE_URL`.
- Database connections close when the Nest application closes.
- Catalog reads do not mutate stock, seed data, or any catalog record.

## Deferred Behavior

This contract does not define:

- Search.
- Filters.
- Alternate sorting.
- Cursor pagination.
- Catalog writes.
- Authentication or authorization.
- Caching or ETags.
- Public Swagger/OpenAPI.
- Planned bug behavior.
