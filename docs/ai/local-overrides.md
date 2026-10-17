# Local Instruction Files

Codex discovers AGENTS.override.md before AGENTS.md in the same directory; the override replaces that directory's base instructions. A personal override must preserve all shared governing rules. AGENTS.local.md is a legacy ignored name, not a native automatically loaded instruction file.

This pilot selects Codex only. Skills are installed under .agents/skills and roles under .codex/agents. No Claude adapter is installed by task 0037; the ignored CLAUDE.local.md pattern protects possible personal files without enabling another runtime.

Keep personal overrides, .agent-local, .codex-local, .claude-local, .local and diagnostic evidence out of Git. Review ignore rules intentionally before sharing a scoped override. Never put secrets in evidence. .env.example remains versionable.

The selected profile in .codex/config.toml and both role files is gpt-6.1-sol/high. Check actual effective configuration layers and native model observations; project files cannot switch an already-running primary. Use native model control or a new session. Do not modify global config, trust, credentials or permissions to force success.

The repository advisor, next-task-planner and clean-chat-handoff remain explicit-human-invocation workflows. Existing hooks can capture normal lifecycle events into ignored .session-advisor state; capture is not an advisor invocation.
