# pi-pack

Portable Pi setup without a dotfile manager.

You can install the package directly from GitHub:

```bash
pi install git:github.com/Jabbslad/pi-pack
```

Or do a full no-clone bootstrap of package + config:

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/Jabbslad/pi-pack/main/scripts/remote-install.sh)
```

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

From a fresh machine, the simplest full setup is:

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/Jabbslad/pi-pack/main/scripts/remote-install.sh)
```

That will:
- install `pi` if missing
- install the package from GitHub
- copy `config/settings.template.json` to `~/.pi/agent/settings.json`
- copy `config/AGENTS.md` to `~/.pi/agent/AGENTS.md`
- copy `config/keybindings.json` to `~/.pi/agent/keybindings.json`

If you already cloned the repo locally, you can still run:

```bash
./scripts/install.sh
```

## Direct package install

If you only want the Pi package resources and not the config sync scripts, this is enough:

```bash
pi install git:github.com/Jabbslad/pi-pack
```

or:

```bash
pi install https://github.com/Jabbslad/pi-pack
```

## How settings work

`config/settings.template.json` is a normal Pi settings file.

It points at the GitHub package source directly, so your setup stays portable across machines.

## What the package currently installs

Right now the package intentionally installs only one real resource:

- extension: `extensions/pi-pack-status.ts`

The `prompts/`, `skills/`, and `themes/` directories are kept empty until you add real resources.

## Daily workflow

- add your custom extensions to `extensions/`
- add real prompt templates to `prompts/`
- add real skills to `skills/<name>/SKILL.md`
- add real theme JSON files to `themes/`
- edit `config/settings.template.json` for package list / defaults
- run `./scripts/sync.sh` after config changes

## New machine

Package only:

```bash
pi install git:github.com/Jabbslad/pi-pack
```

Full setup without cloning:

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/Jabbslad/pi-pack/main/scripts/remote-install.sh)
```

If you want a local editable checkout too:

```bash
git clone https://github.com/Jabbslad/pi-pack.git ~/src/pi-pack
cd ~/src/pi-pack
./scripts/install.sh
```

## Notes

- existing `~/.pi/agent/settings.json` is backed up before replacement
- `pi install git:github.com/Jabbslad/pi-pack` is the simplest way to get the package itself
- `scripts/remote-install.sh` is the simplest way to get package + config without cloning
- package resource directories are intentionally empty unless they contain real Pi resources
- this repo is the source of truth
- if you want machine-specific tweaks later, add a second script or a local untracked overlay file
