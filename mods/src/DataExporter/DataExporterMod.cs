using HarmonyLib;
using Microsoft.Xna.Framework;
using TacticsGuildIdle.Core;

namespace TenManIdleMods.DataExporter;

public sealed class DataExporterMod : IGameMod
{
    public string Name => "DataExporter";
    public string Version => "1.0.0";
    public int Priority => 100; // run after other mods

    private static bool _exported;
    private static Harmony? _harmony;

    public void Initialize()
    {
        _harmony = new Harmony("com.tenmanidlemods.dataexporter");
        _harmony.PatchAll(typeof(ExportPatch).Assembly);
        ModLogger.Log(Name, "Registered export patch — will export on first game frame");
    }

    [HarmonyPatch(typeof(TacticsGuildIdle.Game1), "Update", [typeof(GameTime)])]
    internal static class ExportPatch
    {
        private static void Postfix()
        {
            if (_exported)
                return;

            _exported = true;

            try
            {
                var dm = GameManager.Instance.DataManager;
                var exportDir = Path.Combine(AppContext.BaseDirectory, "Mods", "export");
                Directory.CreateDirectory(exportDir);
                var dbPath = Path.Combine(exportDir, "10man-idle.db");

                ModLogger.Log("DataExporter", $"Exporting game data to {dbPath}...");
                SqliteExporter.Export(dm, dbPath);
                ModLogger.Log("DataExporter", "Export complete");
            }
            catch (Exception ex)
            {
                ModLogger.Log("DataExporter", $"Export failed: {ex}");
            }

            // Unpatch ourselves — no need to run on every frame
            _harmony?.UnpatchAll("com.tenmanidlemods.dataexporter");
        }
    }
}
