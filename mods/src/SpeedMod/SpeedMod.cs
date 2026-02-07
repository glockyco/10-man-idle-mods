using HarmonyLib;

namespace TenManIdleMods.SpeedMod;

public sealed class SpeedMod : IGameMod
{
    public string Name => "SpeedMod";
    public string Version => "1.0.0";
    public int Priority => 0;

    public void Initialize()
    {
        var configDir = Path.Combine(AppContext.BaseDirectory, "Mods", "config");
        var configPath = Path.Combine(configDir, "SpeedMod.json");
        var config = ModConfig.Load(configPath);
        SpeedPatch.Config = config;

        ModLogger.Log(Name, $"Toggle key: {config.ToggleKey}");
        ModLogger.Log(Name, $"Speed multipliers: [{string.Join(", ", config.SpeedMultipliers)}]");

        var harmony = new Harmony("com.tenmanidlemods.speedmod");
        harmony.PatchAll(typeof(SpeedPatch).Assembly);

        ModLogger.Log(Name, "Harmony patches applied");
    }
}
