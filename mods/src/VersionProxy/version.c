/*
 * version.dll proxy for 10-Man Idle mod loader auto-repair.
 *
 * Optional enhancement: if coreclr.dll loads version.dll (uncertain),
 * this proxy auto-patches runtimeconfig.json to add DOTNET_STARTUP_HOOKS
 * on every game launch, surviving Steam updates that reset the config.
 *
 * All 17 version.dll exports are forwarded to the real System32 DLL.
 */

#define WIN32_LEAN_AND_MEAN
#include <windows.h>
#include <stdio.h>

/* Real function pointers */
static HMODULE hReal = NULL;

typedef DWORD(WINAPI *fn_GetFileVersionInfoSizeA)(LPCSTR, LPDWORD);
typedef DWORD(WINAPI *fn_GetFileVersionInfoSizeW)(LPCWSTR, LPDWORD);
typedef BOOL(WINAPI *fn_GetFileVersionInfoA)(LPCSTR, DWORD, DWORD, LPVOID);
typedef BOOL(WINAPI *fn_GetFileVersionInfoW)(LPCWSTR, DWORD, DWORD, LPVOID);
typedef BOOL(WINAPI *fn_VerQueryValueA)(LPCVOID, LPCSTR, LPVOID *, PUINT);
typedef BOOL(WINAPI *fn_VerQueryValueW)(LPCVOID, LPCWSTR, LPVOID *, PUINT);
typedef DWORD(WINAPI *fn_GetFileVersionInfoSizeExA)(DWORD, LPCSTR, LPDWORD);
typedef DWORD(WINAPI *fn_GetFileVersionInfoSizeExW)(DWORD, LPCWSTR, LPDWORD);
typedef BOOL(WINAPI *fn_GetFileVersionInfoExA)(DWORD, LPCSTR, DWORD, DWORD, LPVOID);
typedef BOOL(WINAPI *fn_GetFileVersionInfoExW)(DWORD, LPCWSTR, DWORD, DWORD, LPVOID);
typedef DWORD(WINAPI *fn_VerFindFileA)(DWORD, LPCSTR, LPCSTR, LPCSTR, LPSTR, PUINT, LPSTR, PUINT);
typedef DWORD(WINAPI *fn_VerFindFileW)(DWORD, LPCWSTR, LPCWSTR, LPCWSTR, LPWSTR, PUINT, LPWSTR, PUINT);
typedef DWORD(WINAPI *fn_VerInstallFileA)(DWORD, LPCSTR, LPCSTR, LPCSTR, LPCSTR, LPCSTR, LPSTR, PUINT);
typedef DWORD(WINAPI *fn_VerInstallFileW)(DWORD, LPCWSTR, LPCWSTR, LPCWSTR, LPCWSTR, LPCWSTR, LPWSTR, PUINT);
typedef DWORD(WINAPI *fn_VerLanguageNameA)(DWORD, LPSTR, DWORD);
typedef DWORD(WINAPI *fn_VerLanguageNameW)(DWORD, LPWSTR, DWORD);
typedef DWORD(WINAPI *fn_GetFileVersionInfoByHandle)(DWORD, LPCWSTR, DWORD, DWORD, LPVOID);

static fn_GetFileVersionInfoSizeA pGetFileVersionInfoSizeA;
static fn_GetFileVersionInfoSizeW pGetFileVersionInfoSizeW;
static fn_GetFileVersionInfoA pGetFileVersionInfoA;
static fn_GetFileVersionInfoW pGetFileVersionInfoW;
static fn_VerQueryValueA pVerQueryValueA;
static fn_VerQueryValueW pVerQueryValueW;
static fn_GetFileVersionInfoSizeExA pGetFileVersionInfoSizeExA;
static fn_GetFileVersionInfoSizeExW pGetFileVersionInfoSizeExW;
static fn_GetFileVersionInfoExA pGetFileVersionInfoExA;
static fn_GetFileVersionInfoExW pGetFileVersionInfoExW;
static fn_VerFindFileA pVerFindFileA;
static fn_VerFindFileW pVerFindFileW;
static fn_VerInstallFileA pVerInstallFileA;
static fn_VerInstallFileW pVerInstallFileW;
static fn_VerLanguageNameA pVerLanguageNameA;
static fn_VerLanguageNameW pVerLanguageNameW;
static fn_GetFileVersionInfoByHandle pGetFileVersionInfoByHandle;

static BOOL load_real_dll(void)
{
    char sys[MAX_PATH];
    GetSystemDirectoryA(sys, MAX_PATH);
    strcat_s(sys, MAX_PATH, "\\version.dll");
    hReal = LoadLibraryA(sys);
    if (!hReal)
        return FALSE;

    pGetFileVersionInfoSizeA = (fn_GetFileVersionInfoSizeA)GetProcAddress(hReal, "GetFileVersionInfoSizeA");
    pGetFileVersionInfoSizeW = (fn_GetFileVersionInfoSizeW)GetProcAddress(hReal, "GetFileVersionInfoSizeW");
    pGetFileVersionInfoA = (fn_GetFileVersionInfoA)GetProcAddress(hReal, "GetFileVersionInfoA");
    pGetFileVersionInfoW = (fn_GetFileVersionInfoW)GetProcAddress(hReal, "GetFileVersionInfoW");
    pVerQueryValueA = (fn_VerQueryValueA)GetProcAddress(hReal, "VerQueryValueA");
    pVerQueryValueW = (fn_VerQueryValueW)GetProcAddress(hReal, "VerQueryValueW");
    pGetFileVersionInfoSizeExA = (fn_GetFileVersionInfoSizeExA)GetProcAddress(hReal, "GetFileVersionInfoSizeExA");
    pGetFileVersionInfoSizeExW = (fn_GetFileVersionInfoSizeExW)GetProcAddress(hReal, "GetFileVersionInfoSizeExW");
    pGetFileVersionInfoExA = (fn_GetFileVersionInfoExA)GetProcAddress(hReal, "GetFileVersionInfoExA");
    pGetFileVersionInfoExW = (fn_GetFileVersionInfoExW)GetProcAddress(hReal, "GetFileVersionInfoExW");
    pVerFindFileA = (fn_VerFindFileA)GetProcAddress(hReal, "VerFindFileA");
    pVerFindFileW = (fn_VerFindFileW)GetProcAddress(hReal, "VerFindFileW");
    pVerInstallFileA = (fn_VerInstallFileA)GetProcAddress(hReal, "VerInstallFileA");
    pVerInstallFileW = (fn_VerInstallFileW)GetProcAddress(hReal, "VerInstallFileW");
    pVerLanguageNameA = (fn_VerLanguageNameA)GetProcAddress(hReal, "VerLanguageNameA");
    pVerLanguageNameW = (fn_VerLanguageNameW)GetProcAddress(hReal, "VerLanguageNameW");
    pGetFileVersionInfoByHandle = (fn_GetFileVersionInfoByHandle)GetProcAddress(hReal, "GetFileVersionInfoByHandle");

    return TRUE;
}

/*
 * Check runtimeconfig.json next to the exe. If DOTNET_STARTUP_HOOKS is
 * missing from configProperties, patch it in and ask for a restart.
 */
static void ensure_startup_hooks(void)
{
    /* Find our DLL path to derive the game directory */
    char dllPath[MAX_PATH];
    HMODULE hSelf;
    GetModuleHandleExA(
        GET_MODULE_HANDLE_EX_FLAG_FROM_ADDRESS | GET_MODULE_HANDLE_EX_FLAG_UNCHANGED_REFCOUNT,
        (LPCSTR)ensure_startup_hooks, &hSelf);
    GetModuleFileNameA(hSelf, dllPath, MAX_PATH);

    /* Derive directory */
    char *lastSlash = strrchr(dllPath, '\\');
    if (!lastSlash)
        return;

    char dir[MAX_PATH];
    size_t dirLen = (size_t)(lastSlash - dllPath);
    memcpy(dir, dllPath, dirLen);
    dir[dirLen] = '\0';

    /* Build paths */
    char configPath[MAX_PATH];
    snprintf(configPath, MAX_PATH, "%s\\10ManIdle.runtimeconfig.json", dir);

    char loaderPath[MAX_PATH];
    snprintf(loaderPath, MAX_PATH, "%s\\ModLoader.dll", dir);

    /* Read the config file */
    HANDLE hFile = CreateFileA(configPath, GENERIC_READ, FILE_SHARE_READ,
                               NULL, OPEN_EXISTING, 0, NULL);
    if (hFile == INVALID_HANDLE_VALUE)
        return;

    DWORD fileSize = GetFileSize(hFile, NULL);
    if (fileSize == 0 || fileSize > 1024 * 1024)
    {
        CloseHandle(hFile);
        return;
    }

    char *buf = (char *)HeapAlloc(GetProcessHeap(), 0, fileSize + 1);
    if (!buf)
    {
        CloseHandle(hFile);
        return;
    }

    DWORD bytesRead;
    ReadFile(hFile, buf, fileSize, &bytesRead, NULL);
    CloseHandle(hFile);
    buf[bytesRead] = '\0';

    /* Check if DOTNET_STARTUP_HOOKS is already present */
    if (strstr(buf, "DOTNET_STARTUP_HOOKS"))
    {
        HeapFree(GetProcessHeap(), 0, buf);
        return;
    }

    /* Find configProperties to insert into */
    char *propStart = strstr(buf, "\"configProperties\"");
    if (!propStart)
    {
        HeapFree(GetProcessHeap(), 0, buf);
        return;
    }

    char *brace = strchr(propStart, '{');
    if (!brace)
    {
        HeapFree(GetProcessHeap(), 0, buf);
        return;
    }

    /* Build the insertion string with escaped backslashes */
    char escapedLoader[MAX_PATH * 2];
    int ei = 0;
    for (int i = 0; loaderPath[i] && ei < (int)sizeof(escapedLoader) - 2; i++)
    {
        if (loaderPath[i] == '\\')
            escapedLoader[ei++] = '\\';
        escapedLoader[ei++] = loaderPath[i];
    }
    escapedLoader[ei] = '\0';

    char insertion[MAX_PATH * 2 + 64];
    snprintf(insertion, sizeof(insertion),
             "\n      \"DOTNET_STARTUP_HOOKS\": \"%s\",", escapedLoader);

    size_t insertionLen = strlen(insertion);
    size_t insertPos = (size_t)(brace - buf) + 1;

    /* Write patched config */
    char *newBuf = (char *)HeapAlloc(GetProcessHeap(), 0, bytesRead + insertionLen + 1);
    if (!newBuf)
    {
        HeapFree(GetProcessHeap(), 0, buf);
        return;
    }

    memcpy(newBuf, buf, insertPos);
    memcpy(newBuf + insertPos, insertion, insertionLen);
    memcpy(newBuf + insertPos + insertionLen, buf + insertPos, bytesRead - insertPos);
    newBuf[bytesRead + insertionLen] = '\0';

    HeapFree(GetProcessHeap(), 0, buf);

    hFile = CreateFileA(configPath, GENERIC_WRITE, 0, NULL,
                        CREATE_ALWAYS, FILE_ATTRIBUTE_NORMAL, NULL);
    if (hFile == INVALID_HANDLE_VALUE)
    {
        HeapFree(GetProcessHeap(), 0, newBuf);
        return;
    }

    DWORD written;
    WriteFile(hFile, newBuf, (DWORD)(bytesRead + insertionLen), &written, NULL);
    CloseHandle(hFile);
    HeapFree(GetProcessHeap(), 0, newBuf);

    MessageBoxA(NULL,
                "10-Man Idle Mods: runtimeconfig.json has been patched.\n"
                "Please restart the game for mods to load.",
                "Mod Loader", MB_OK | MB_ICONINFORMATION);
    ExitProcess(0);
}

BOOL APIENTRY DllMain(HMODULE hModule, DWORD reason, LPVOID reserved)
{
    (void)hModule;
    (void)reserved;

    if (reason == DLL_PROCESS_ATTACH)
    {
        if (!load_real_dll())
            return TRUE; /* fail gracefully */
        ensure_startup_hooks();
    }
    else if (reason == DLL_PROCESS_DETACH)
    {
        if (hReal)
            FreeLibrary(hReal);
    }

    return TRUE;
}

/* Forwarded exports */
__declspec(dllexport) DWORD WINAPI GetFileVersionInfoSizeA(LPCSTR a, LPDWORD b) { return pGetFileVersionInfoSizeA ? pGetFileVersionInfoSizeA(a, b) : 0; }
__declspec(dllexport) DWORD WINAPI GetFileVersionInfoSizeW(LPCWSTR a, LPDWORD b) { return pGetFileVersionInfoSizeW ? pGetFileVersionInfoSizeW(a, b) : 0; }
__declspec(dllexport) BOOL WINAPI GetFileVersionInfoA(LPCSTR a, DWORD b, DWORD c, LPVOID d) { return pGetFileVersionInfoA ? pGetFileVersionInfoA(a, b, c, d) : FALSE; }
__declspec(dllexport) BOOL WINAPI GetFileVersionInfoW(LPCWSTR a, DWORD b, DWORD c, LPVOID d) { return pGetFileVersionInfoW ? pGetFileVersionInfoW(a, b, c, d) : FALSE; }
__declspec(dllexport) BOOL WINAPI VerQueryValueA(LPCVOID a, LPCSTR b, LPVOID *c, PUINT d) { return pVerQueryValueA ? pVerQueryValueA(a, b, c, d) : FALSE; }
__declspec(dllexport) BOOL WINAPI VerQueryValueW(LPCVOID a, LPCWSTR b, LPVOID *c, PUINT d) { return pVerQueryValueW ? pVerQueryValueW(a, b, c, d) : FALSE; }
__declspec(dllexport) DWORD WINAPI GetFileVersionInfoSizeExA(DWORD a, LPCSTR b, LPDWORD c) { return pGetFileVersionInfoSizeExA ? pGetFileVersionInfoSizeExA(a, b, c) : 0; }
__declspec(dllexport) DWORD WINAPI GetFileVersionInfoSizeExW(DWORD a, LPCWSTR b, LPDWORD c) { return pGetFileVersionInfoSizeExW ? pGetFileVersionInfoSizeExW(a, b, c) : 0; }
__declspec(dllexport) BOOL WINAPI GetFileVersionInfoExA(DWORD a, LPCSTR b, DWORD c, DWORD d, LPVOID e) { return pGetFileVersionInfoExA ? pGetFileVersionInfoExA(a, b, c, d, e) : FALSE; }
__declspec(dllexport) BOOL WINAPI GetFileVersionInfoExW(DWORD a, LPCWSTR b, DWORD c, DWORD d, LPVOID e) { return pGetFileVersionInfoExW ? pGetFileVersionInfoExW(a, b, c, d, e) : FALSE; }
__declspec(dllexport) DWORD WINAPI VerFindFileA(DWORD a, LPCSTR b, LPCSTR c, LPCSTR d, LPSTR e, PUINT f, LPSTR g, PUINT h) { return pVerFindFileA ? pVerFindFileA(a, b, c, d, e, f, g, h) : 0; }
__declspec(dllexport) DWORD WINAPI VerFindFileW(DWORD a, LPCWSTR b, LPCWSTR c, LPCWSTR d, LPWSTR e, PUINT f, LPWSTR g, PUINT h) { return pVerFindFileW ? pVerFindFileW(a, b, c, d, e, f, g, h) : 0; }
__declspec(dllexport) DWORD WINAPI VerInstallFileA(DWORD a, LPCSTR b, LPCSTR c, LPCSTR d, LPCSTR e, LPCSTR f, LPSTR g, PUINT h) { return pVerInstallFileA ? pVerInstallFileA(a, b, c, d, e, f, g, h) : 0; }
__declspec(dllexport) DWORD WINAPI VerInstallFileW(DWORD a, LPCWSTR b, LPCWSTR c, LPCWSTR d, LPCWSTR e, LPCWSTR f, LPWSTR g, PUINT h) { return pVerInstallFileW ? pVerInstallFileW(a, b, c, d, e, f, g, h) : 0; }
__declspec(dllexport) DWORD WINAPI VerLanguageNameA(DWORD a, LPSTR b, DWORD c) { return pVerLanguageNameA ? pVerLanguageNameA(a, b, c) : 0; }
__declspec(dllexport) DWORD WINAPI VerLanguageNameW(DWORD a, LPWSTR b, DWORD c) { return pVerLanguageNameW ? pVerLanguageNameW(a, b, c) : 0; }
__declspec(dllexport) DWORD WINAPI GetFileVersionInfoByHandle(DWORD a, LPCWSTR b, DWORD c, DWORD d, LPVOID e) { return pGetFileVersionInfoByHandle ? pGetFileVersionInfoByHandle(a, b, c, d, e) : 0; }
