#nullable enable
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;

namespace MW.TinyMoney.Api.Vendors.Matching;

public interface IDescriptionPreprocessor
{
    string Preprocess(string text);
    IReadOnlyCollection<string> Tokenize(string preprocessed);
    IReadOnlyCollection<string> GenerateShatteredCombinations(string preprocessed);
}

public class DescriptionPreprocessor : IDescriptionPreprocessor
{
    private const int MinTokenLength = 3;
    
    private readonly Regex? _stopWordsPattern;
    private readonly IReadOnlyCollection<Regex> _stopPatterns;

    public DescriptionPreprocessor(IEnumerable<string> stopTokens, IEnumerable<string> stopPatterns)
    {
        var tokens = stopTokens.Select(Regex.Escape).ToList();
        _stopWordsPattern = tokens.Count > 0
            ? new Regex($@"\b({string.Join("|", tokens)})\b", RegexOptions.IgnoreCase | RegexOptions.Compiled, TimeSpan.FromMilliseconds(100))
            : null;
        _stopPatterns = stopPatterns.Select(p => new Regex(p.Split("#").First(), RegexOptions.Compiled, TimeSpan.FromMilliseconds(100))).ToList();
    }

    public static DescriptionPreprocessor CreateFromFiles()
    {
        var stopTokens = File.ReadAllLines("Vendors/Matching/StopTokens.txt");
        var stopPatterns = File.ReadAllLines("Vendors/Matching/StopPatterns.txt");
        return new DescriptionPreprocessor(stopTokens, stopPatterns);
    }

    public string Preprocess(string text)
    {
        var s = text.ToLowerInvariant().Trim();
        if (_stopWordsPattern is not null)
            s = _stopWordsPattern.Replace(s, " ");
        foreach (var pattern in _stopPatterns)
            s = pattern.Replace(s, " ");
        return s.Trim();
    }

    public IReadOnlyCollection<string> Tokenize(string preprocessed)
        => preprocessed
            .Split(' ', StringSplitOptions.RemoveEmptyEntries)
            .Where(t => t.Length >= MinTokenLength)
            .ToList();

    private const int MaxShatterPieces = 3;
    
    public IReadOnlyCollection<string> GenerateShatteredCombinations(string preprocessed)
    {
        var fragments = preprocessed.Split(' ', StringSplitOptions.RemoveEmptyEntries);
        var combinations = new List<string>();
        for (var start = 0; start < fragments.Length - 1; start++)
        {
            var combination = fragments[start];
            for (var end = start + 1; end < fragments.Length && end - start < MaxShatterPieces; end++)
            {
                combination += fragments[end];
                combinations.Add(combination);
            }
        }
        return combinations;
    }
}
