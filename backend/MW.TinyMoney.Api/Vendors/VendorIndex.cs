#nullable enable
using System;
using System.Collections.Generic;
using System.Linq;

namespace MW.TinyMoney.Api.Vendors;

public class VendorIndex
{
    private readonly Dictionary<string, List<(int vendorId, int score)>> _index;
    private readonly Dictionary<int, Vendor> _vendorById;
    private readonly DescriptionPreprocessor _preprocessor;

    public VendorIndex(IList<Vendor> vendors, IList<VendorAlias> aliases, DescriptionPreprocessor preprocessor)
    {
        _preprocessor = preprocessor;
        _vendorById = vendors.ToDictionary(v => v.Id);
        _index = new Dictionary<string, List<(int vendorId, int score)>>(StringComparer.Ordinal);

        // Alias tokens score 2 (explicit user mapping), vendor name tokens score 1 (implicit)
        foreach (var alias in aliases)
            AddToIndex(alias.Alias, alias.VendorId, 2);
        foreach (var vendor in vendors)
            AddToIndex(vendor.Name, vendor.Id, 1);
    }

    private void AddToIndex(string text, int vendorId, int score)
    {
        foreach (var token in _preprocessor.Tokenize(_preprocessor.Preprocess(text)))
        {
            if (!_index.TryGetValue(token, out var list))
                _index[token] = list = new List<(int, int)>();
            list.Add((vendorId, score));
        }
    }

    public Vendor? Match(string description)
    {
        if (string.IsNullOrWhiteSpace(description))
            return null;

        var preprocessed = _preprocessor.Preprocess(description);
        var scores = new Dictionary<int, int>();

        // Step 1: exact token matching
        foreach (var token in _preprocessor.Tokenize(preprocessed))
        {
            if (!_index.TryGetValue(token, out var entries)) continue;
            foreach (var (vendorId, score) in entries)
                scores[vendorId] = scores.GetValueOrDefault(vendorId) + score;
        }

        // Step 2: fallback for shattered words (e.g. "BIEDR ONKA" → "biedronka")
        // Concatenate all non-stop fragments and substring-scan the index.
        if (scores.Count == 0)
        {
            var concatenated = preprocessed
                .Split(' ', StringSplitOptions.RemoveEmptyEntries)
                .Where(t => !_preprocessor.IsStopToken(t))
                .Aggregate(string.Empty, (acc, t) => acc + t);

            foreach (var (indexToken, entries) in _index)
            {
                if (indexToken.Length >= 4 && concatenated.Contains(indexToken, StringComparison.Ordinal))
                    foreach (var (vendorId, score) in entries)
                        scores[vendorId] = scores.GetValueOrDefault(vendorId) + score;
            }
        }

        if (scores.Count == 0)
            return null;

        var bestId = scores.MaxBy(kv => kv.Value).Key;
        return _vendorById.TryGetValue(bestId, out var vendor) ? vendor : null;
    }
}
