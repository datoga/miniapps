# Agent Team Structure Design

**Date:** 2026-02-28
**Status:** Approved

## Problem

Need a structured agent team to parallelize development work across the miniapps monorepo, with clear role separation and a quality gate before code lands.

## Architecture

Uses Claude Code **Agent Teams** (experimental). The main session acts as the **Product Owner (Lead)**, spawning specialist teammates as needed per task.

```
User
  └─ Main Session (PO Lead)
       ├─ SW Architect — design decisions, pattern review
       ├─ Frontend — UI implementation (worktree)
       ├─ Backend — storage, APIs, service workers (worktree)
       ├─ UX — accessibility, user flows, design critique
       ├─ DevOps — build, deploy, config (worktree)
       ├─ QA — typecheck, lint, build validation
       └─ Staff Engineer — final quality gate
```

## Agent Definitions

All agents defined in `.claude/agents/`. PO instructions in CLAUDE.md.

| Agent | Tools | Worktree | Role |
|---|---|---|---|
| SW Architect | Read, Glob, Grep, Bash | No | Architecture decisions, pattern review |
| Frontend | All | Yes | React/Next.js UI, components, i18n, Tailwind |
| Backend | All | Yes | Storage, service workers, data pipelines |
| UX | Read, Glob, Grep, Bash | No | Accessibility, user flows, mobile, design review |
| DevOps | All | Yes | Vercel, turbo, build config, scaffolding |
| QA | Read, Glob, Grep, Bash | No | Build/lint/typecheck validation |
| Staff Engineer | Read, Glob, Grep, Bash | No | Final gate, quality review, can reject |

## Workflow

1. User describes feature/task
2. PO analyzes, decides which teammates to spawn
3. PO optionally consults SW Architect for design
4. PO creates task list with dependencies
5. Implementation teammates work in parallel (worktrees)
6. QA validates
7. Staff Engineer reviews all changes
8. PO reports back to user

## Configuration

- Agent Teams enabled via `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` in `~/.claude/settings.json`
- Agent files in `.claude/agents/`
- PO orchestration instructions in CLAUDE.md team mode section

## Constraints

- Not every task needs all 7 teammates — PO decides per task
- Staff Engineer is always spawned last (reviews completed work)
- Worktrees only for agents that write code
- Reviewers get read-only tools to prevent accidental modifications
