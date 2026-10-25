# 10-Man Idle Mods and Codex

This repository contains a game-speed mod, a data exporter and 10-Man Codex, a searchable game-data site for 10-Man Idle. Use the Codex to look up items, crafting, quests, gathering, classes and dungeon or raid loot. Building the mods or refreshing the site's data requires a local game installation.

[Browse 10-Man Codex](https://10-man-codex.wowmuch1.workers.dev/).

## Run the mods

You need Windows, the .NET 8 SDK and 10-Man Idle. From the repository root in Command Prompt:

```bat
copy Directory.Build.props.user.template Directory.Build.props.user
```

Set `GameDir` in the copied file to your game installation, then run:

```bat
mods\run_modded.bat
```

The launcher builds the mods, copies them and their dependencies into the game directory, and starts the game with the mod loader enabled. SpeedMod cycles game speed with the configured key. See [mods/config/SpeedMod.json](mods/config/SpeedMod.json) for the initial settings. You can change the installed configuration under the game's `Mods/config/` directory.

DataExporter replaces `Mods/export/10man-idle.db` in the game directory on the first game frame of each launch.

## Build or change the Codex

You also need Node.js and pnpm. After launching the modded game to export its data, close the game and run these commands from the repository root in Command Prompt:

```bat
scripts\export-data.bat
cd website
pnpm install
pnpm build
pnpm dev
```

The export script copies the database into the repository's `data/` and `website/public/` directories. The Astro site reads that database to build its pages. The build also checks links and creates the Pagefind search index, which the development server needs for search. Open the address printed by the development server.

`pnpm cf-deploy`, from `website/`, builds and publishes the site through Cloudflare Wrangler. The public database copy is included in the site.

## Development

[CLAUDE.md](CLAUDE.md) covers mod development and repository tooling. [lefthook.yml](lefthook.yml) defines the source checks, and [website/package.json](website/package.json) defines site commands.
