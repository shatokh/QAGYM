# Bug Registry

The bug registry will be the source of truth for planned educational bugs in QA Comics Gym.

Planned bugs must be registered before implementation. A planned bug without a registry entry should not be implemented.

## Purpose

The registry exists to:

- Give every planned bug a stable ID.
- Keep planned bugs separate from accidental bugs.
- Track category, difficulty, scope, flags, spoiler risk, and verification notes.
- Keep docs, tests, seed data, and closed bug guide entries consistent.
- Keep UX-oriented defects in existing categories with metadata instead of adding a separate `ux/` category at the start.

## Categories

Planned bug categories:

- `functional`
- `api`
- `security`
- `accessibility`
- `performance`
- `localization`
- `mobile`
- `reliability`

UX-oriented defects should use the closest existing category plus metadata such as `surface: UX`.

## Required Metadata

Each planned bug should include:

- ID.
- Title.
- Category.
- Difficulty level, from L1 to L5.
- Status.
- Behavior summary.
- Clean expected behavior.
- Bugged behavior.
- Trigger or flag.
- Affected feature.
- Surface metadata, such as UI, API, UX, mobile, or docs.
- Public docs impact.
- Closed guide impact.
- Test impact.
- Safety notes, especially for security bugs.

## Planned Structure

Registry entries will live under category folders:

```text
bug-registry/
  functional/
  api/
  security/
  accessibility/
  performance/
  localization/
  mobile/
  reliability/
```

The exact file format is still pending. Markdown with YAML-like front matter or standalone YAML/JSON are both acceptable starting points.

## Example Entry

```yaml
id: FUNCTIONAL-001
title: Cart total does not update after quantity change
category: functional
difficulty: L2
status: proposed
affected_feature: cart
trigger: BUG_FUNCTIONAL_001_CART_TOTAL_STALE
surface: UX
clean_expected_behavior: Cart total updates immediately after quantity changes.
bugged_behavior: Cart total remains stale until the page is refreshed.
public_docs_impact: Do not mention the defect in public docs.
closed_guide_impact: Add symptom, discovery path, and expected report notes.
test_impact:
  clean_core: Verify total updates when bug flag is disabled.
  bug_verification: Verify stale total when bug flag is enabled.
safety_notes: No security impact.
```

## Registration Rule

Before any planned bug is implemented:

1. Create or update its registry entry.
2. Reference the registry ID in the planned bug task.
3. Define clean expected behavior and bugged behavior.
4. Define verification expectations.
5. Confirm that public docs do not leak spoiler details.
