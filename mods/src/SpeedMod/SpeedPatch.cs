using HarmonyLib;
using Microsoft.Xna.Framework;
using Microsoft.Xna.Framework.Input;
using TacticsGuildIdle.Core;

namespace TenManIdleMods.SpeedMod;

[HarmonyPatch(typeof(TacticsGuildIdle.Game1), "Update", [typeof(GameTime)])]
internal static class SpeedPatch
{
    private static KeyboardState _prevKeyboard;
    private static int _speedIndex;
    private static bool _initialized;

    internal static ModConfig Config { get; set; } = new();

    private static void Postfix()
    {
        var currentKeyboard = Keyboard.GetState();

        if (!_initialized)
        {
            _prevKeyboard = currentKeyboard;
            _initialized = true;
            return;
        }

        var toggleKey = Config.GetToggleKey();

        if (currentKeyboard.IsKeyDown(toggleKey) && _prevKeyboard.IsKeyUp(toggleKey))
        {
            var multipliers = Config.SpeedMultipliers;
            if (multipliers.Length == 0)
            {
                _prevKeyboard = currentKeyboard;
                return;
            }

            _speedIndex = (_speedIndex + 1) % multipliers.Length;
            var newSpeed = multipliers[_speedIndex];

            GameManager.Instance.TimeManager.TimeMultiplier = newSpeed;
            ModLogger.Log("SpeedMod", $"Speed set to {newSpeed}x (index {_speedIndex})");
        }

        _prevKeyboard = currentKeyboard;
    }
}
