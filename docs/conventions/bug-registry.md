# Bug Registry Convention

This convention defines the starting rules for planned bug registry work. It is intentionally practical and should be revisited before the first real planned bug implementation task.

## Source of Truth

The bug registry is the source of truth for planned educational bugs. Closed guide pages may add hints, walkthrough notes, and mentor-friendly context, but registry files own the canonical planned bug metadata.

## Registration Before Implementation

A planned bug must be registered before implementation starts.

Planned bug tasks must reference the registry ID. Codex must not introduce planned bug behavior without an approved planned bug task and registry entry.

## Clean App First

The corresponding clean feature must exist before a planned bug is implemented for it.

The first implementation path is:

1. Build clean feature behavior.
2. Verify clean feature behavior.
3. Register planned bug.
4. Implement planned bug through the bug layer.
5. Verify clean and bugged behavior separately.

## Initial Metadata Minimum

Each planned bug entry should include at least:

- ID.
- Title.
- Category.
- Difficulty level, L1-L5.
- Status.
- Affected feature.
- Affected surfaces, such as UI, API, UX, mobile, docs, or accessibility.
- Clean expected behavior.
- Bugged behavior.
- Flag name and default state.
- Public docs spoiler impact.
- Closed guide impact.
- Test impact.
- Safety notes, especially for security bugs.

This metadata minimum is accepted as the starting point. Revisit and refine it before the first planned bug implementation task, once the actual bug layer and file format are clearer.

## Categories

Use the existing category folders:

- `functional`
- `api`
- `security`
- `accessibility`
- `performance`
- `localization`
- `mobile`
- `reliability`

Do not add a separate `ux/` folder at the start. UX defects should use the closest existing category plus metadata such as `surface: UX`.

## IDs

Use stable IDs. The exact ID format can be refined later, but IDs should be readable and category-aware.

Examples:

- `FUNCTIONAL-001`
- `API-001`
- `SECURITY-001`

Avoid renaming IDs after implementation unless a migration note is added.

## Flags

Initial planned bugs should be flag-controlled.

Always-on bugs and default-on training packs can be introduced later only through approved tasks after the clean app, bug layer, and verification strategy are stable.

## Public Docs

Public docs must not reveal spoiler details:

- No planned bug IDs.
- No direct expected-vs-actual spoiler.
- No trigger or flag names.
- No closed guide hints.

Public docs may describe safe testing boundaries, feature behavior, and general training areas.

## Closed Guide

Closed guide content may include:

- Planned bug IDs.
- Symptoms.
- Hints.
- Discovery paths.
- Related endpoints and pages.
- Expected bug reports.
- Verification notes.

The closed guide should not replace the registry. It should read well for humans while the registry remains the canonical metadata source.
