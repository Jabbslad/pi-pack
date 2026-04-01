# pi-pack

Portable Pi setup without a dotfile manager.

## What this repo does

- acts as a local Pi package for your personal extensions, prompts, skills, and themes
- stores your global Pi config source files in `config/`
- provides scripts to sync everything into `~/.pi/agent`

## Layout

```text
pi-pack/
  package.json
  extensions/
  prompts/
  skills/
  themes/
  config/
    settings.template.json
    AGENTS.md
    keybindings.json
  scripts/
    install.sh
    sync.sh
```

## Usage

From this repo:

```bash
./scripts/install.sh
```

That will:
- install `pi` if missing
- generate `~/.pi/agent/settings.json`
- symlink `~/.pi/agent/AGENTS.md`
- symlink `~/.pi/agent/keybindings.json`

## How settings work

`config/settings.template.json` contains `__PACKAGE_PATH__`.

During sync, that placeholder is replaced with this repo's absolute path, so Pi loads this repo directly as a local package.

## Daily workflow

- add your custom extensions to `extensions/`
- add prompts to `prompts/`
- add skills to `skills/`
- add themes to `themes/`
- edit `config/settings.template.json` for package list / defaults
- run `./scripts/sync.sh` after config changes

## New machine

```bash
git clone <your-repo-url> ~/src/pi-pack
cd ~/src/pi-pack
./scripts/install.sh
```

## Notes

- existing `~/.pi/agent/settings.json` is backed up before replacement
- this repo is the source of truth
- if you want machine-specific tweaks later, add a second script or a local untracked overlay file
