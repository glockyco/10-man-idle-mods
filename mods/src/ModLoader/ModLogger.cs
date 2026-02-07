namespace TenManIdleMods;

public static class ModLogger
{
    private static StreamWriter? _writer;
    private static readonly object Lock = new();

    public static void Initialize(string logPath)
    {
        _writer = new StreamWriter(logPath, append: false) { AutoFlush = true };
        Log("ModLoader", $"Log started at {DateTime.Now:O}");
    }

    public static void Log(string source, string message)
    {
        var line = $"[{DateTime.Now:HH:mm:ss.fff}] [{source}] {message}";
        lock (Lock)
        {
            _writer?.WriteLine(line);
        }
    }

    public static void Close()
    {
        _writer?.Dispose();
        _writer = null;
    }
}
