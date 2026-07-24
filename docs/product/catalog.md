# Clean Catalog Domain

## Purpose

This document defines the clean Phase 1 catalog behavior for QA Comics Gym.
It is the product source for catalog terminology and business rules used by
the Prisma schema, clean seed data, and future API contract, tests, and UI.

The catalog must behave correctly without planned bugs. Planned defect
behavior, including broken media, invalid prices, or inconsistent translations,
requires a future registered Planned Bug task.

## Scope

The Phase 1 catalog represents sellable fictional comic issues and standalone
volumes. It supports:

- Published catalog browsing.
- Product detail by stable slug.
- RU and EN catalog content.
- Exact money values.
- Stock visibility.
- Series, creator, and genre relationships.
- Deterministic ordering.
- Stable local cover media with a clean fallback.

Search, filters, auth, cart, checkout, orders, admin mutation, public Swagger,
and planned bugs are separate tasks.

## Terminology

- Comic: One sellable comic issue or standalone volume.
- Translation: Localized title and description for one catalog entity.
- Series: Optional grouping for related comics.
- Creator: Person credited as a writer or artist.
- Genre: Localized catalog classification.
- Comparison price: Optional higher display price used to present a discounted
  item without a discount engine.
- Published catalog: Comics whose publication state is `PUBLISHED`.

## Domain Boundary

### Comic

A Comic owns sellable and public catalog state:

- Database-generated integer internal ID.
- Stable unique slug.
- Stable unique SKU.
- Optional series relationship.
- Optional positive issue number for a series item.
- Non-negative price in integer minor units.
- Optional comparison price in integer minor units.
- Uppercase ISO 4217 currency code.
- Non-negative stock quantity.
- Publication state.
- Optional local cover asset path.
- Non-negative merchandising sort order.
- Creation and update timestamps.

The internal ID is predictable by design for local QA scenarios, but it is not
an authorization mechanism. Seed scripts, contracts, and automation should use
slug or SKU when they need stable identity across resets.

### ComicTranslation

A ComicTranslation belongs to one Comic and one supported locale:

- Locale code.
- Non-empty title.
- Non-empty description.

The comic and locale pair is unique.

### Series

A Series groups related comics:

- Database-generated integer internal ID.
- Stable unique slug.
- Creation and update timestamps.

A Comic may be standalone and have no series. Series display text lives in
SeriesTranslation.

### SeriesTranslation

A SeriesTranslation belongs to one Series and one supported locale:

- Locale code.
- Non-empty title.

The series and locale pair is unique.

### Creator

A Creator represents a fictional credited person:

- Database-generated integer internal ID.
- Stable unique slug.
- Non-empty Unicode display name.
- Creation and update timestamps.

Creator names are not localized in the initial model.

### ComicCreator

A ComicCreator relates one Comic to one Creator:

- Role: `WRITER` or `ARTIST`.
- Non-negative credit sort order.

The comic, creator, and role combination is unique. Credit sort order provides
deterministic display when multiple creators have the same role.

### Genre

A Genre is a reusable catalog classification:

- Database-generated integer internal ID.
- Stable unique slug.
- Creation and update timestamps.

Genre display text lives in GenreTranslation.

### GenreTranslation

A GenreTranslation belongs to one Genre and one supported locale:

- Locale code.
- Non-empty name.

The genre and locale pair is unique.

### ComicGenre

A ComicGenre relates one Comic to one Genre.

The comic and genre combination is unique.

## Identity Rules

- Internal IDs are database-generated integers.
- Slugs are lowercase ASCII and use hyphens between words.
- Comic, series, creator, and genre slugs are unique within their entity type.
- Comic SKUs are uppercase stable business identifiers.
- URLs use comic slug rather than localized title or internal ID.
- Slugs and SKUs do not change when the active locale changes.
- Seed and automation references prefer slug or SKU over a generated ID.

Implemented schema limits are:

- Comic, series, and creator slug: 120 characters.
- Genre slug: 80 characters.
- Comic SKU: 64 characters.

PostgreSQL checks enforce lowercase hyphenated ASCII slugs and uppercase
hyphenated ASCII comic SKUs.

## Localization Rules

- Initial supported locales are `en` and `ru`.
- Every standard clean seed Comic, Series, and Genre has both EN and RU
  translations.
- EN is the fallback locale if runtime content is unexpectedly incomplete.
- Visible clean seed data does not rely on fallback behavior.
- Locale fallback must not expose translation records from another entity.
- Slugs, SKUs, creator names, money, stock, and publication state are
  locale-independent.
- Translation uniqueness is enforced per parent entity and locale.

The frontend uses i18next with explicit localized URL prefixes. Initial
catalog routes are `/en/comics`, `/ru/comics`, and their slug-detail variants.
The route locale controls UI messages, document language, and the API locale.
No browser-language detection or locale persistence is used.

## Money Rules

- `priceMinor` is a non-negative integer.
- `currencyCode` is an uppercase ISO 4217 code.
- The initial clean seed uses only `USD`.
- `compareAtPriceMinor` is nullable.
- When present, comparison price is greater than the current price.
- Comparison price is display-only.
- No percentage, savings, tax, promocode, campaign, or dynamic pricing logic is
  part of the catalog foundation.
- API contracts serialize integer minor units and currency code without
  floating-point conversion.
- UI formatting may vary by locale, but the stored amount and currency do not.

The initial migration enforces non-negative price, a greater comparison price
when present, and a three-uppercase-letter currency code. Application
validation and seed integrity checks must enforce the same rules.

## Stock Rules

- Stock quantity is a non-negative integer.
- Zero stock is a valid clean state.
- Published out-of-stock comics remain visible.
- Catalog reads expose availability derived from stock quantity.
- Phase 1 does not reserve stock or decrement it through catalog reads.
- Warehouses, stock history, backorders, and inventory reservations are out of
  scope.

## Publication Rules

Publication states are:

- `DRAFT`: Not visible through public catalog reads.
- `PUBLISHED`: Visible through public list and detail reads.
- `ARCHIVED`: Not visible through public catalog reads.

Public detail lookup for a draft, archived, or unknown slug returns the same
not-found behavior. Exact HTTP status and error shape belong to the internal API
contract.

## Series Rules

- Series relationship is optional.
- A standalone Comic has no series and no issue number.
- A series Comic has a positive issue number.
- The same issue number cannot repeat within one series.
- Series order is not inferred from database ID.

The database enforces that series and issue number are either both absent or
both present, that issue number is positive, and that the series/issue pair is
unique.

## Creator Rules

- Initial roles are `WRITER` and `ARTIST`.
- One Creator may have more than one role on the same Comic.
- Duplicate credit for the same comic, creator, and role is invalid.
- Credit display uses role and credit sort order, never incidental join order.

Publisher, editor, colorist, letterer, cover artist, and arbitrary role values
are deferred until a real feature requires them.

## Genre Rules

- A Comic may have multiple genres.
- Duplicate comic-to-genre relationships are invalid.
- Genre names are localized; genre slugs are stable and locale-independent.
- Genre display order in a comic response must be deterministic. The exact
  ordering rule belongs to the internal API contract.

## Media Rules

- A clean cover path is a stable repository-backed relative path.
- Clean behavior does not depend on third-party image hosts.
- Cover path may be absent.
- An absent cover uses one deterministic local fallback asset.
- The fallback includes meaningful accessible alternative text in the UI.
- A broken URL, missing committed asset, or random remote failure is not a clean
  seed scenario.

All comic titles, creator identities, descriptions, and cover artwork must be
fictional and original or otherwise explicitly licensed for repository use. Do
not copy real commercial comic covers or brand assets into the seed.

The implemented assets are 1024 by 1536 PNG files under
`apps/web/public/media/comics/`. Database paths use
`media/comics/<slug>.png`. The deterministic clean fallback is
`cover-fallback.png`.

## Catalog Read Rules

The first read slice supports:

- Paginated list of published comics.
- Product detail by stable slug.
- Deterministic default ordering.

Default list order is:

1. Merchandising sort order ascending.
2. Internal comic ID ascending as a stable tie-breaker.

The implemented internal API contract uses:

- `GET /api/v1/comics` and `GET /api/v1/comics/:slug`.
- Page-based pagination with defaults `page=1` and `pageSize=12`.
- Maximum `pageSize=50`.
- Query locale `en` or `ru`, defaulting to `en`.
- Stable product DTOs that do not expose numeric database IDs.
- Zod request validation and a stable JSON error envelope.

Exact response and error shapes are defined in
`docs/internal/api/catalog.md`. Cache behavior remains deferred.

The frontend validates these response shapes with frontend-owned Zod schemas
before exposing data to catalog UI code. TanStack Query owns list/detail server
state and includes locale and request identity in query keys.

Search and filters for genre, creator, series, price, and availability remain
Phase 1 Clean Features but follow list/detail in separate tasks.

## Minimal Clean Seed

The implemented Phase 1 seed contains exactly ten fictional comics: eight
published, one draft, and one archived. Scenarios overlap, and the set includes:

- Normal published in-stock comic.
- Published out-of-stock comic.
- Comic with long EN and RU titles.
- Comic without a cover path that uses the clean fallback.
- Display-only discounted comic with a valid comparison price.
- Unicode creator and title data.
- Cheap and expensive price boundaries.
- Limited-stock item.
- At least one multi-issue series.
- At least one standalone item.
- Multiple genres.
- Multiple writers or artists on at least one comic.
- Draft and archived records that remain absent from public reads.

The clean seed:

- Be deterministic and repeatable.
- Use slug and SKU as stable upsert identity.
- Use only `USD`.
- Include both EN and RU translations for visible standard records.
- Reference only committed local media or the clean fallback.
- Contain no negative stock, invalid money, duplicate identity, broken media,
  or planned defect.
- Support reset without depending on previously generated integer IDs.

The exact fixture values and scenario map are documented in
`docs/product/catalog-seed.md`.

## Integrity Expectations

Schema and seed verification should cover:

- Unique slugs and SKUs.
- Unique parent-locale translations.
- Required EN and RU standard seed translations.
- Non-negative money, stock, and sort order.
- Valid comparison price.
- Valid publication visibility.
- Unique comic relationships.
- Stable seed reruns.
- No missing referenced local asset.

The initial migration enforces structural uniqueness, numeric invariants,
identity formats, non-blank display text, and series/issue consistency. EN/RU
seed completeness, asset existence, repeatable seed behavior, and public
visibility remain verification responsibilities of later implementation tasks.

## Contract Direction

The repository-first internal catalog API contract lives at:

```text
docs/internal/api/catalog.md
```

It defines clean list/detail behavior, pagination, locale selection, fallback
behavior, response fields, money serialization, not-found behavior, and
deterministic ordering. The implementation and database-backed contract tests
must stay aligned with it.

Public Swagger/OpenAPI publication remains Phase 5 scope.

## Implementation Sequence

The approved proposed sequence is:

1. `0012` - Catalog Domain Schema and Initial Migration.
2. `0013` - Clean Catalog Seed and Local Media.
3. `0014` - Backend Test Foundation.
4. `0015` - Catalog Read API and Internal Contract.
5. `0016` - Frontend Catalog Foundation.
6. `0017` - Catalog List and Product Detail UI.
7. Later Phase 1 tasks - catalog search, filters, and expanded automation.

Each task requires its own document and approval.

## Deferred Decisions

- Search semantics and filter query syntax.
- Cache and ETag behavior.
- Frontend form and UI kit choices.
- Additional creator roles.
- Additional currencies or multi-currency commerce.
