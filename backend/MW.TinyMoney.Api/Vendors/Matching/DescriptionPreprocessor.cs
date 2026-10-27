using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Text;
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
    private const int MinTokenLength = 2;
    private const int MaxShatterPieces = 3;
    private static readonly TimeSpan RegexTimeout = TimeSpan.FromSeconds(1);

    private readonly Regex _stopWordsPattern;
    private readonly IReadOnlyCollection<Regex> _stopPatterns;
    private readonly IReadOnlyCollection<Regex> _joinPatterns;

    public DescriptionPreprocessor(IEnumerable<string> stopTokens, IEnumerable<string> stopPatterns, IEnumerable<string> joinPatterns)
    {
        var tokens = stopTokens.Select(t => Regex.Escape(RemoveDiacritics(t.ToLowerInvariant()))).Distinct().ToList();
        _stopWordsPattern = tokens.Count > 0
            ? new Regex($@"\b({string.Join("|", tokens)})\b", RegexOptions.IgnoreCase | RegexOptions.Compiled, RegexTimeout)
            : null;
        _stopPatterns = stopPatterns.Select(p => new Regex(p.Split("#").First(), RegexOptions.Compiled, RegexTimeout)).ToList();
        _joinPatterns = joinPatterns.Select(p => new Regex(p.Split("#").First(), RegexOptions.Compiled, RegexTimeout)).ToList();
    }

    public static DescriptionPreprocessor CreateFromFiles()
    {
        var stopTokens = File.ReadAllLines("Vendors/Matching/StopTokens.txt");
        var stopPatterns = File.ReadAllLines("Vendors/Matching/StopPatterns.txt");
        var joinPatterns = File.ReadAllLines("Vendors/Matching/JoinPatterns.txt");
        return new DescriptionPreprocessor(stopTokens, stopPatterns, joinPatterns);
    }

    public string Preprocess(string text)
    {
        var s = RemoveDiacritics(text.ToLowerInvariant()).Trim();

        foreach (var pattern in _joinPatterns)
        {
            s = pattern.Replace(s, string.Empty);
        }

        if (_stopWordsPattern is not null)
        {
            s = _stopWordsPattern.Replace(s, " ");
        }
        
        foreach (var pattern in _stopPatterns)
        {
            s = pattern.Replace(s, " ");
        }

        return s.Trim();
    }

    // Bank statements are inconsistent with Polish characters, so "żabka" must match "zabka".
    // 'ł' has no Unicode decomposition and is mapped explicitly.
    private static string RemoveDiacritics(string text)
    {
        var decomposed = text.Normalize(NormalizationForm.FormD);
        var sb = new StringBuilder(decomposed.Length);
        foreach (var c in decomposed)
        {
            if (CharUnicodeInfo.GetUnicodeCategory(c) != UnicodeCategory.NonSpacingMark)
                sb.Append(c == 'ł' ? 'l' : c);
        }
        return sb.ToString().Normalize(NormalizationForm.FormC);
    }

    public IReadOnlyCollection<string> Tokenize(string preprocessed)
        => preprocessed
            .Split(' ', StringSplitOptions.RemoveEmptyEntries)
            .Where(t => t.Length >= MinTokenLength)
            .Distinct()
            .ToList();
    
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
