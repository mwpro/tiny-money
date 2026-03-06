#nullable enable
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;

namespace MW.TinyMoney.Api.Vendors;

public class DescriptionPreprocessor
{
    private readonly HashSet<string> _stopTokens;
    private readonly IReadOnlyCollection<Regex> _stopPatterns;

    public DescriptionPreprocessor(IEnumerable<string> stopTokens, IEnumerable<Regex> stopPatterns)
    {
        _stopTokens = new HashSet<string>(stopTokens, StringComparer.OrdinalIgnoreCase);
        _stopPatterns = stopPatterns.ToList();
    }

    public string Preprocess(string text)
    {
        var s = text.ToLowerInvariant().Trim();
        foreach (var pattern in _stopPatterns)
            s = pattern.Replace(s, " ");
        return s.Trim();
    }

    public IReadOnlyList<string> Tokenize(string preprocessed)
        => preprocessed
            .Split(' ', StringSplitOptions.RemoveEmptyEntries)
            .Where(t => t.Length >= 3 && !_stopTokens.Contains(t))
            .ToList();

    public bool IsStopToken(string token) => _stopTokens.Contains(token);
}
