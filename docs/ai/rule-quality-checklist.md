# Rule Quality Checklist

Use when editing agent instructions or workflow docs; preserve task approval requirements.

- AGENTS.md stays at most 200 lines; long procedures live in docs or skills.
- Review an old-to-new invariant mapping when extracting rules.
- Keep approval, scope lock, Clean Core/Bug Layer, seed/API boundaries, explicit skill triggers, commit checkpoints and Playwright limitations in force.
- Commands are verified against repository evidence; unavailable and placeholder commands are identified accurately.
- Preserve existing dirty edits and task formats; no automatic commit or scope expansion.
- Keep secrets, local overrides and diagnostics ignored while retaining .env.example.
- Primary-only team entry passes effective mode/phase; delegates do not recursively coordinate.
- Review phases do not execute project code; independent verification uses supplied isolation and never edits product inputs.
- Model config is a declared profile; native observations establish actual model/effort and role identity.
- Customized or pre-existing paths are excluded from generator ownership and reconciled manually.
- Add no new agent adapter, service, dependency or automatic lifecycle mechanism outside approved scope.
