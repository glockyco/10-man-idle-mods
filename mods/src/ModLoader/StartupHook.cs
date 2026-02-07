using System.Reflection;
using System.Runtime.Loader;
using TenManIdleMods;

internal sealed class StartupHook
{
    public static void Initialize()
    {
        try
        {
            var baseDir = AppContext.BaseDirectory;
            var modsDir = Path.Combine(baseDir, "Mods");
            var pluginsDir = Path.Combine(modsDir, "plugins");
            var logPath = Path.Combine(modsDir, "modloader.log");

            Directory.CreateDirectory(pluginsDir);

            ModLogger.Initialize(logPath);
            ModLogger.Log("ModLoader", $"Base directory: {baseDir}");
            ModLogger.Log("ModLoader", $"Plugins directory: {pluginsDir}");

            // Register assembly resolver for game root and plugins directory
            AssemblyLoadContext.Default.Resolving += (context, name) =>
            {
                var fileName = name.Name + ".dll";

                var gamePath = Path.Combine(baseDir, fileName);
                if (File.Exists(gamePath))
                    return context.LoadFromAssemblyPath(gamePath);

                var pluginPath = Path.Combine(pluginsDir, fileName);
                if (File.Exists(pluginPath))
                    return context.LoadFromAssemblyPath(pluginPath);

                return null;
            };

            // Discover and load mods
            var mods = new List<IGameMod>();
            foreach (var dll in Directory.GetFiles(pluginsDir, "*.dll"))
            {
                try
                {
                    var assembly = AssemblyLoadContext.Default.LoadFromAssemblyPath(
                        Path.GetFullPath(dll)
                    );

                    Type[] types;
                    try
                    {
                        types = assembly.GetTypes();
                    }
                    catch (ReflectionTypeLoadException ex)
                    {
                        types = ex.Types.Where(t => t != null).ToArray()!;
                        foreach (var le in ex.LoaderExceptions)
                            ModLogger.Log("ModLoader", $"  Loader exception: {le?.Message}");
                    }

                    foreach (var type in types)
                    {
                        if (typeof(IGameMod).IsAssignableFrom(type) && !type.IsInterface && !type.IsAbstract)
                        {
                            if (Activator.CreateInstance(type) is IGameMod mod)
                            {
                                mods.Add(mod);
                                ModLogger.Log("ModLoader", $"Discovered: {mod.Name} v{mod.Version}");
                            }
                        }
                    }
                }
                catch (Exception ex)
                {
                    ModLogger.Log("ModLoader", $"Failed to load {Path.GetFileName(dll)}: {ex.Message}");
                }
            }

            // Sort by priority (lower = earlier), then by name
            mods.Sort((a, b) =>
            {
                var cmp = a.Priority.CompareTo(b.Priority);
                return cmp != 0 ? cmp : string.Compare(a.Name, b.Name, StringComparison.Ordinal);
            });

            // Initialize mods
            foreach (var mod in mods)
            {
                try
                {
                    mod.Initialize();
                    ModLogger.Log("ModLoader", $"Initialized: {mod.Name} v{mod.Version}");
                }
                catch (Exception ex)
                {
                    ModLogger.Log("ModLoader", $"Failed to initialize {mod.Name}: {ex}");
                }
            }

            ModLogger.Log("ModLoader", $"Loaded {mods.Count} mod(s)");
        }
        catch (Exception ex)
        {
            // Last resort — never crash the game
            try
            {
                var fallbackLog = Path.Combine(AppContext.BaseDirectory, "Mods", "modloader-error.log");
                File.WriteAllText(fallbackLog, $"{DateTime.Now:O}\n{ex}");
            }
            catch
            {
                // Nothing we can do
            }
        }
    }
}
