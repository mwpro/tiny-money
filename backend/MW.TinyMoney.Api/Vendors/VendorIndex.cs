#nullable enable
using System;
using System.Collections.Generic;
using System.Linq;
using MW.TinyMoney.Api.Vendors.Matching;

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

    public IEnumerable<Vendor> Match(string description, int limit = 1)
    {
        if (string.IsNullOrWhiteSpace(description))
            return [];

        var preprocessed = _preprocessor.Preprocess(description);
        var scores = new Dictionary<int, int>();

        var tokens = _preprocessor.Tokenize(preprocessed)
            .Concat(_preprocessor.GenerateShatteredCombinations(preprocessed)).ToList();
        
        foreach (var token in tokens)
        {
            if (!_index.TryGetValue(token, out var entries)) continue;
            foreach (var (vendorId, score) in entries)
                scores[vendorId] = scores.GetValueOrDefault(vendorId) + score;
        }

        if (scores.Count == 0)
            return [];

        return scores
            .OrderByDescending(kv => kv.Value)
            .Select(bestId => _vendorById.GetValueOrDefault(bestId.Key))
            .Where(v => v != null)
            .Take(limit)
            .ToList();
    }
}
