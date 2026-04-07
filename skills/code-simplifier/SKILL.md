---
name: code-simplifier
description: Simplifies recently modified code for clarity, consistency, and maintainability while preserving exact behavior. Use after writing or changing code, or when asked to clean up an implementation without changing functionality.
license: Apache-2.0
metadata:
  source: claude-plugins-official/code-simplifier 1.0.0
---

# Code Simplifier

Port of Anthropic's Claude `code-simplifier` agent as a Pi skill.

Use this skill when you want to improve the structure of existing code **without changing what it does**.

## Goals

Refine code so it is:

- clearer to read
- more consistent with the project
- easier to maintain
- no less correct than before

Functionality must remain unchanged unless the user explicitly asks for behavior changes.

## Working Rules

1. **Preserve behavior exactly**
   - Do not change outputs, side effects, public interfaces, or edge-case behavior unless the user requested it.
   - If a simplification would risk semantic drift, skip it or verify it carefully.

2. **Follow project conventions first**
   - Read the most relevant project guidance before editing, especially `README.md`, `AGENTS.md`, and nearby config files.
   - Match the repo's existing naming, formatting, module structure, error-handling style, and framework conventions.
   - Do not blindly apply Claude-specific conventions like `CLAUDE.md`; in Pi, use the repo's actual instructions.

3. **Prefer clarity over cleverness**
   - Reduce unnecessary nesting.
   - Remove redundant abstractions and dead weight.
   - Use explicit, understandable control flow.
   - Avoid dense one-liners and nested ternaries when they make code harder to read.
   - Keep useful abstractions; do not flatten structure just to save lines.

4. **Keep scope tight**
   - Focus on files or code paths that were just modified, are in the current diff, or are explicitly requested.
   - Do not opportunistically refactor unrelated parts of the codebase.

5. **Verify when practical**
   - After changes, run the narrowest relevant test, typecheck, lint, or build command that gives confidence the simplification did not break anything.
   - If no verification was run, say so plainly.

## Practical Workflow

1. Inspect the current diff or target files.
2. Read local project guidance.
3. Identify simplifications that improve clarity without changing behavior.
4. Make the smallest useful edits.
5. Verify with the narrowest relevant command.
6. Report what changed and what was verified.

## Common Simplifications

Look for opportunities like these:

- replacing convoluted branching with clearer `if`/`else` or `switch` logic
- extracting repeated logic only when it genuinely improves readability
- inlining pointless wrappers or pass-through helpers
- renaming vague variables or functions when the rename is local and safe
- removing redundant state, temporary variables, or comments that only restate the code
- collapsing unnecessary nesting via early returns
- making data flow more explicit

## Avoid These Traps

Do **not**:

- change behavior under the guise of cleanup
- introduce clever abstractions with weak payoff
- refactor broad areas that were not requested
- optimize for fewer lines instead of readability
- remove diagnostics, validation, or structure that helps maintenance

## Pi-Specific Notes

- Use Pi's normal tools and project instructions.
- Prefer reading `README.md`, `AGENTS.md`, and relevant config before editing.
- If the task is ambiguous, ask the user what scope they want simplified.
- If the user wants this skill applied explicitly, they can run `/skill:code-simplifier`.
