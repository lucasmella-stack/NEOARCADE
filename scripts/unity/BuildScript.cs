// Place this file in the MetalSlugClone Unity project at:
//   Assets/Editor/BuildScript.cs
//
// Then run the build via scripts/build-slug.sh (or manually with Unity Editor).

using UnityEditor;
using UnityEngine;
using System.IO;

public static class BuildScript
{
    public static void BuildWebGL()
    {
        string outputPath = System.Environment.GetCommandLineArgs()
            .GetArg("-customBuildPath") ?? "WebGL-Build";

        Directory.CreateDirectory(outputPath);

        var scenes = EditorBuildSettings.scenes
            .Where(s => s.enabled)
            .Select(s => s.path)
            .ToArray();

        var report = BuildPipeline.BuildPlayer(new BuildPlayerOptions
        {
            scenes            = scenes,
            locationPathName  = outputPath,
            target            = BuildTarget.WebGL,
            options           = BuildOptions.None,
        });

        if (report.summary.result == UnityEditor.Build.Reporting.BuildResult.Succeeded)
        {
            Debug.Log($"[BuildScript] WebGL build succeeded → {outputPath}");
        }
        else
        {
            Debug.LogError($"[BuildScript] WebGL build FAILED: {report.summary.result}");
            EditorApplication.Exit(1);
        }
    }
}

// Extension helper
public static class ArrayExtensions
{
    public static string GetArg(this string[] args, string flag)
    {
        for (int i = 0; i < args.Length - 1; i++)
            if (args[i] == flag) return args[i + 1];
        return null;
    }
}
