# Clean Catalog Seed

## Purpose

This document records the stable Phase 1 catalog fixtures implemented by
`prisma/seed/catalog.sql`. Future API, UI, and automation work should use slug
or SKU rather than generated integer IDs.

The seed is clean product behavior. It contains no planned defect, broken
media, invalid value, or incomplete translation.

## Command and Reset Boundary

Run the explicit seed after migrations:

```powershell
corepack pnpm db:seed
```

The command replaces the reviewed local fixture boundary in one transaction,
restarts identity sequences, and does not use `CASCADE`. The current reset
boundary includes catalog tables, auth demo account tables, and the empty
cart/order scenario tables. It must fail when a future domain introduces a
referencing table that is not part of the reviewed reset boundary.

Prisma ORM 7 does not run this seed automatically during migration commands.

## Fixture Counts

- 10 comics: 8 published, 1 draft, and 1 archived.
- 3 series.
- 8 creators.
- 6 genres.
- 20 comic translations.
- 6 series issues and 4 standalone comics.
- 8 non-null local cover paths.
- 1 deterministic fallback asset.

Every comic, series, and genre has both `en` and `ru` content. Every price uses
integer minor units and `USD`.

## Empty Scenario Tables

The same deterministic reset owns the Phase 2 auth and Phase 3 cart/order
fixture boundary:

- 2 enabled demo users.
- 0 sessions.
- 0 carts.
- 0 cart lines.
- 0 orders.
- 0 order lines.

## Series

| Slug | English | Russian |
| --- | --- | --- |
| `neon-harbor` | Neon Harbor | Неоновая гавань |
| `clockwork-frontier` | Clockwork Frontier | Заводной рубеж |
| `ember-archive` | Ember Archive | Архив искр |

## Creators

| Slug | Display name |
| --- | --- |
| `nora-vale` | Nora Vale |
| `alina-sever` | Алина Север |
| `mika-tanaka` | Mika Tanaka |
| `jonas-reed` | Jonas Reed |
| `elias-voss` | Elias Voss |
| `priya-nadir` | Priya Nadir |
| `teo-markovic` | Teo Markovic |
| `sofia-chen` | Sofia Chen |

Creator names are intentionally not localized in the initial model.

## Genres

| Slug | English | Russian |
| --- | --- | --- |
| `science-fiction` | Science Fiction | Научная фантастика |
| `mystery` | Mystery | Детектив |
| `adventure` | Adventure | Приключения |
| `fantasy` | Fantasy | Фэнтези |
| `drama` | Drama | Драма |
| `retro-futurism` | Retro-futurism | Ретрофутуризм |

## Comics

| Slug / SKU | EN / RU title | State | Price | Stock | Series | Cover |
| --- | --- | --- | --- | --- | --- | --- |
| `neon-harbor-1` / `QCG-NH-001` | Neon Harbor: The Vanishing Beacon / Неоновая гавань: Исчезнувший маяк | Published | $12.99 | 24 | Neon Harbor #1 | Local |
| `neon-harbor-2` / `QCG-NH-002` | Neon Harbor: Tides of Static / Неоновая гавань: Волны помех | Published | $14.99, compare $19.99 | 2 | Neon Harbor #2 | Local |
| `neon-harbor-3` / `QCG-NH-003` | Neon Harbor: The Drowned Frequency / Неоновая гавань: Утонувшая частота | Draft | $15.99 | 10 | Neon Harbor #3 | Null |
| `clockwork-frontier-1` / `QCG-CF-001` | Clockwork Frontier: Brass Horizon / Заводной рубеж: Латунный горизонт | Published | $9.99 | 0 | Clockwork Frontier #1 | Local |
| `clockwork-frontier-2` / `QCG-CF-002` | Clockwork Frontier: The Meridian Engine / Заводной рубеж: Двигатель меридиана | Published | $49.99 | 5 | Clockwork Frontier #2 | Local |
| `ember-archive-1` / `QCG-EA-001` | Ember Archive: Ashes That Remember / Архив искр: Пепел, который помнит | Archived | $18.99 | 0 | Ember Archive #1 | Local |
| `last-tram-to-orbit` / `QCG-LTO-001` | The Last Tram to Orbit: A Farewell at the Edge of the Quiet Sky / Последний трамвай на орбиту: Прощание у края безмолвного неба | Published | $17.99 | 12 | Standalone | Null |
| `paper-moon-protocol` / `QCG-PMP-001` | Paper Moon Protocol / Протокол бумажной луны | Published | $1.99 | 50 | Standalone | Local |
| `glass-signal` / `QCG-GS-001` | Glass Signal / Стеклянный сигнал | Published | $21.99 | 7 | Standalone | Local |
| `iron-orchard` / `QCG-IO-001` | Iron Orchard / Железный сад | Published | $24.99 | 15 | Standalone | Local |

Descriptions, creator credits, genre relations, exact sort order, and stable
cover paths are source-controlled in `prisma/seed/catalog.sql`.

## Scenario Map

- Normal in-stock: `neon-harbor-1`.
- Limited stock and valid comparison price: `neon-harbor-2`.
- Draft visibility exclusion: `neon-harbor-3`.
- Published out of stock: `clockwork-frontier-1`.
- Expensive item and multiple credits: `clockwork-frontier-2`.
- Archived visibility exclusion: `ember-archive-1`.
- Long EN/RU titles and clean null cover: `last-tram-to-orbit`.
- Cheap price boundary: `paper-moon-protocol`.
- Unicode title and creator content: `glass-signal`.
- Multi-genre normal item: `iron-orchard`.

## Media Mapping

Cover files live under `apps/web/public/media/comics/`. Database values use:

```text
media/comics/<comic-slug>.png
```

`neon-harbor-3` and `last-tram-to-orbit` intentionally have null cover paths.
The committed `cover-fallback.png` is clean fallback media; runtime fallback
selection remains a frontend task.

All cover art is fictional, original/generated for this repository, and free
of embedded titles, watermarks, real brands, and commercial characters.
