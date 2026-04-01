# pi-pack

Portable Pi setup without a dotfile manager.

Use the no-clone bootstrap:

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/Jabbslad/pi-pack/main/scripts/remote-install.sh)
```

## What this repo does

- stores your global Pi config source files in `config/`
- provides scripts to sync everything into `~/.pi/agent`
- keeps global additive prompt behavior separate from repo/workflow conventions
- serves as the source of truth for your portable Pi setup across machines

## Layout

```text
pi-pack/
  config/
    settings.json
    AGENTS.md
    APPEND_SYSTEM.md
    keybindings.json
  scripts/
    remote-install.sh
    sync.sh
```

## Usage

From a fresh machine, the simplest full setup is:

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/Jabbslad/pi-pack/main/scripts/remote-install.sh)
```

That will:
- install `pi` if missing
- copy `config/settings.json` to `~/.pi/agent/settings.json`
- copy `config/AGENTS.md` to `~/.pi/agent/AGENTS.md`
- copy `config/APPEND_SYSTEM.md` to `~/.pi/agent/APPEND_SYSTEM.md`
- copy `config/keybindings.json` to `~/.pi/agent/keybindings.json`

If you already cloned the repo locally, you can run:

```bash
./scripts/sync.sh
```

## How settings work

`config/settings.json` is a normal Pi settings file.

It contains the defaults and package list you want shared across machines.

In this repo, the important defaults are:

```json
{
  "defaultProvider": "openai-codex",
  "defaultModel": "gpt-5.4"
}
```

That means Pi will try to use that provider/model pair unless you change it in `config/settings.json` or switch models inside Pi.

## Provider login and model selection

The easy-to-miss step in Pi is that syncing `settings.json` is not enough by itself.

After bootstrap/sync, you should:

1. launch `pi`
2. run `/login`
3. authenticate the provider you want to use
4. optionally run `/model` to confirm or switch the selected model

In this repo, `config/settings.json` sets the default provider and model:

```json
{
  "defaultProvider": "openai-codex",
  "defaultModel": "gpt-5.4"
}
```

So on a fresh machine, the practical flow is:

```bash
pi
```

Then inside Pi:

```text
/login
```

After login succeeds, Pi can actually use the configured provider.

If needed, also check the active model:

```text
/model
```

A few practical notes:

- this repo syncs shared Pi config, but it does **not** authenticate providers for you
- provider authentication is a separate step you do inside Pi with `/login`
- if the default provider/model is set but you have not logged in yet, Pi may still not be usable
- machine-local custom providers/models can still be defined in `~/.pi/agent/models.json`, but that is separate from the `/login` step

## Daily workflow

- edit `config/settings.json` for package list / defaults
- edit `config/AGENTS.md` for repo/workflow conventions
- edit `config/APPEND_SYSTEM.md` for global additive agent behavior
- edit `config/keybindings.json` for shared keybindings
- run `./scripts/sync.sh` after config changes

## New machine

Full setup without cloning:

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/Jabbslad/pi-pack/main/scripts/remote-install.sh)
```

If you want a local editable checkout too, prefer `gh` when it is installed:

```bash
gh repo clone Jabbslad/pi-pack ~/src/pi-pack
cd ~/src/pi-pack
./scripts/sync.sh
```

Fallback with plain git:

```bash
git clone https://github.com/Jabbslad/pi-pack.git ~/src/pi-pack
cd ~/src/pi-pack
./scripts/sync.sh
```

## Notes

- existing `~/.pi/agent/settings.json` is backed up before replacement
- `config/APPEND_SYSTEM.md` is synced to Pi's global appended system prompt file for additive behavior
- the shared prompt currently prefers `gh` for GitHub-related git operations when it is already installed, and falls back to plain `git` when that is simpler or `gh` is unavailable
- `config/AGENTS.md` is synced to Pi's global context file for repo/workflow conventions
- `scripts/remote-install.sh` is the simplest way to get the full setup without cloning
- `scripts/sync.sh` is for local editable checkouts
- this repo is the source of truth
- if you want machine-specific tweaks later, add a second script or a local untracked overlay file
