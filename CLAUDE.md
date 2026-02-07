# 10-Man Idle Mods + Wiki

Monorepo for game mods and a data wiki for "10-Man Idle"
(MonoGame / .NET 8).

## Repository layout

- mods/          game mod framework + plugins
- tools/         standalone data extraction tool
- data/          generated SQLite database (committed)
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

Data extraction:

    dotnet run --project tools/DataExtractor

Outputs data/10man-idle.db and copies to website/public/.

Website (requires Node.js + pnpm):

    cd website && pnpm install && pnpm run build

Dev server: pnpm dev

The native version.dll proxy (mods/src/VersionProxy/) is compiled
separately — see mods/src/VersionProxy/build.bat.

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
- Scopes: mods, speed-mod, mod-loader, proxy, extractor, website
- Subject line: imperative mood, no period, max 72 chars with prefix
- Body: explain what and why (not how), wrap at 72 characters
- Separate subject and body with a blank line

## Key game types (from decompilation)

All in TacticsGuildIdle namespace (despite assembly name 10ManIdle):

- Game1 (10ManIdle.dll) — main game class, Update loop
- Core.GameManager — singleton via .Instance
- Core.GameTimeManager — TimeMultiplier property scales all systems
- Core.DataManager — all game data dictionaries
- Entities.Character — player character with skills/gear/inventory
- Systems.* — GatheringSystem, CraftingSystem, DungeonSystem, etc.

## Code style

- C# with file-scoped namespaces, 4-space indent
- TypeScript for website (strict mode), 2-space indent
- Astro components for pages, Svelte for interactive islands
- No unnecessary abstractions
- Harmony 2.3+ (required for .NET 8 tiered compilation compat)

## Tooling

Pre-commit hooks via Lefthook. Install after clone:

    lefthook install
    dotnet tool restore
    cd website && pnpm install

Hooks run automatically on commit:
- Biome (format + lint TS/Astro/Svelte)
- CSharpier (format C#)
- svelte-check (type checking)
- commitlint (conventional commit enforcement)
