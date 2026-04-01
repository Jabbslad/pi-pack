# Global Pi Instructions

This repo is the source of truth for a portable global Pi setup.

## Repo conventions
- Keep the setup simple, portable, and easy to bootstrap on a fresh machine.
- Prefer portable global Pi configuration under `~/.pi/agent/`.
- When proposing portability solutions, favor:
  1. a single source-of-truth git repo
  2. a no-clone bootstrap command
  3. local editable sync scripts only when useful
- Keep implementations minimal; avoid adding tooling layers unless they provide immediate value.

## File responsibilities
- `config/APPEND_SYSTEM.md` contains global additive system-prompt behavior.
- `config/AGENTS.md` contains repo/workflow conventions.
- `config/settings.json` contains shared Pi settings.
- `config/keybindings.json` contains shared Pi keybindings.
- `scripts/remote-install.sh` is the no-clone bootstrap path.
- `scripts/sync.sh` is for local editable checkouts.

## Change guidelines
- When editing setup/config files, keep `README.md` aligned with actual behavior.
- Prefer editing existing files over creating new ones.
- Make scripts idempotent where practical.
- Back up user files before overwriting them.
- Clearly print what changed and where.
- Remove obsolete files and simplify the repo when requirements change.

## Workflow
- After changing synced config, ensure the resulting files still make sense under `~/.pi/agent/`.
- Prefer solutions that work both for remote bootstrap users and local-clone users.
- If a change only benefits one machine or one-off local usage, say so plainly.
