# 10-Man Idle Mods + Wiki

Monorepo for game mods and a data wiki for "10-Man Idle"
(MonoGame / .NET 8).

## Repository layout

- mods/          game mod framework + plugins (incl. data exporter)
- data/          committed game-data export used to build the site
- website/       Astro static wiki site
- scripts/       build and extraction scripts

## Build commands

Mods (requires .NET 8 SDK):

    dotnet build mods/10ManIdle-Mods.sln

Game DLL references require a GameDir property pointing to the
game installation. Set it up by copying the template:

    cp Directory.Build.props.user.template Directory.Build.props.user

Then edit Directory.Build.props.user with your game path, e.g.:

    <GameDir>E:\SteamLibrary\steamapps\common\10-Man Idle</GameDir>

Or pass it on the command line:

    dotnet build -p:GameDir="E:\path\to\10-Man Idle"

Data export (requires running the game once with mods installed):

    mods/run_modded.bat
    scripts/export-data.bat

The DataExporter mod writes Mods/export/10man-idle.db on first
frame. The script copies it to data/ and website/public/.

Website (requires Node.js and pnpm):

    pnpm install --frozen-lockfile
    pnpm --dir website build

The committed database lets the website build without the game.
Run `pnpm --dir website dev` for the development server.

The native version.dll proxy (mods/src/VersionProxy/) is compiled
separately. See mods/src/VersionProxy/build.bat.

## Dev testing (mods)

    mods/run_modded.bat

Builds mods and launches the game with DOTNET_STARTUP_HOOKS set
directly, bypassing the version.dll proxy.

## Adding a new mod

1. Create a class library project under mods/src/
2. Reference the ModLoader project for the IGameMod interface
3. Implement IGameMod (Name, Version, Initialize)
4. Register Harmony patches in Initialize()
5. Add the project to mods/10ManIdle-Mods.sln

## Commits

Conventional commits following cbea.ms guidelines:

- Format: type(scope): subject
- Types: feat, fix, chore, docs, refactor, test, build, ci
- Allowed scopes are defined in commitlint.config.js.
- Subject line: imperative mood, no period, max 72 chars with prefix
- Body: explain what and why (not how), wrap at 72 characters
- Separate subject and body with a blank line

## Key game types (from decompilation)

All in TacticsGuildIdle namespace (despite assembly name 10ManIdle):

- Game1 (10ManIdle.dll): main game class, Update loop
- Core.GameManager: singleton via .Instance
- Core.GameTimeManager: TimeMultiplier property scales all systems
- Core.DataManager: all game data dictionaries
- Entities.Character: player character with skills/gear/inventory
- Systems.*: GatheringSystem, CraftingSystem, DungeonSystem, etc.

## Code style

- C# with file-scoped namespaces, 4-space indent
- TypeScript for website (strict mode), 2-space indent
- Astro components for pages and browser scripts for interactivity
- No unnecessary abstractions
- Harmony 2.3+ (required for .NET 8 tiered compilation compat)

## Tooling

Install dependencies from the repository root, then enable Lefthook:

    pnpm install --frozen-lockfile
    dotnet tool restore
    lefthook install

The root package supplies repository-wide tools. The pnpm workspace
configuration includes the website and permits native dependency builds.
Use the root lockfile for reproducible installs.

Hooks run automatically on commit:
- Biome checks website formatting, lint and imports.
- CSharpier checks C# formatting.
- commitlint checks the commit message.

Run all source hooks with `lefthook run pre-commit --all-files`.
The hook commands and file selection live in lefthook.yml.
