using System.Text.Json;
using Microsoft.Xna.Framework.Input;

namespace TenManIdleMods.SpeedMod;

public sealed class ModConfig
{
    public string ToggleKey { get; set; } = "F1";
    public float[] SpeedMultipliers { get; set; } = [1f, 2f, 5f, 10f];

    public Keys GetToggleKey()
    {
        if (Enum.TryParse<Keys>(ToggleKey, ignoreCase: true, out var key))
            return key;
        return Keys.F1;
    }

    public static ModConfig Load(string path)
    {
        try
        {
            if (File.Exists(path))
            {
                var json = File.ReadAllText(path);
                return JsonSerializer.Deserialize<ModConfig>(json) ?? new ModConfig();
            }
        }
        catch
        {
            // Fall back to defaults
        }

        return new ModConfig();
    }
}
