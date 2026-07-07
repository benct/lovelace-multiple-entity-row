# CLAUDE.md

The canonical rules for AI coding agents working on this repository
live in [`AGENTS.md`](AGENTS.md). Read it first. Everything below is
Claude-specific supplement, not override.

## Claude-specific notes

- Per-user Claude Code memory under `~/.claude/projects/<project>/`
  is your working knowledge — saved context from prior sessions
  (user preferences, decisions, release state). It complements
  [`AGENTS.md`](AGENTS.md); it does **not** override it. If a
  memory entry conflicts with [`AGENTS.md`](AGENTS.md),
  [`AGENTS.md`](AGENTS.md) wins and the memory entry should be
  updated.
- The user's global instructions (their personal `~/.claude/CLAUDE.md`)
  may impose additional rules — most commonly around when not to
  push, commit, or post publicly without explicit approval. Respect
  those on top of the project rules. Two rules survive any
  session-level autonomy grant: "always allow the user to test code
  before pushing it" and "never post public content (PRs, issues,
  comments, releases) without approval of the exact text at posting
  time."
- The **diagnostic discipline** in [`AGENTS.md`](AGENTS.md) ("no
  fixes without understanding") is load-bearing. The canonical
  example in this repo is the per-entity action fix
  ([#338](https://github.com/benct/lovelace-multiple-entity-row/issues/338)):
  the `catchInteraction` property looked like it disabled HA's row
  interaction but only gated part of it — only grepping HA's
  minified bundle revealed the real listener set. Diagnose in the
  bundle before coding a workaround.
- `master` is the canonical and only long-lived branch.
- This repo was maintained by benct until early 2026 and inherited
  ~85 open issues; the current maintainer is jpettitt (the user).
  Fixes reference the issues they close, and multi-issue root-cause
  fixes are preferred over point patches.
