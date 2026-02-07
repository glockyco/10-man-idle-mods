namespace TenManIdleMods;

public interface IGameMod
{
    string Name { get; }
    string Version { get; }
    int Priority => 0;
    void Initialize();
}
