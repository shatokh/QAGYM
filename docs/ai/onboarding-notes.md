# AI Onboarding Notes

Project: QA Comics Gym. Codex, task-first, code; native triumvirate is the saved mode.

Read AGENTS.md first, then the approved task, PROGRESS.md and only the architecture, contract and verification context needed for that task. Existing QAGym task formats and approval rules take precedence over generic template conventions.

The product uses Clean Core + Bug Layer. Planned bugs, seed changes, public/internal API contracts and dependencies need explicit approved scope. Task 0036 remains Ready for Review and unapproved; setup task 0037 does not approve its implementation.

Follow [project procedures](project-agent-workflow.md), [verification](verification.md), [delegation](delegation.md) and [pilot guidance](triumvirate-pilot.md). Commands require their actual prerequisites; no dependency install, service startup, migration/seed or application test is authorized merely by this installation.

Keep discovery bounded. Generated/vendor outputs include node_modules, dist and the Prisma client. Existing .session-advisor state and local diagnostics are ignored. Never copy secrets into evidence.

The advisor, next-task-planner and clean-chat-handoff retain their explicit human triggers. Hooks may capture ordinary lifecycle state without invoking the advisor workflow.
