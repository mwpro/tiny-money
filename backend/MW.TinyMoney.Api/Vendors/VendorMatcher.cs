using System;
using System.Collections.Generic;
using System.Linq;
using MW.TinyMoney.Api.Vendors.Matching;

namespace MW.TinyMoney.Api.Vendors;

public interface IVendorMatcher
{
    IEnumerable<Vendor> Match(string description, int limit = 1, bool prefixMatching = false);
    bool MatchesVendor(int vendorId, string description);
}

public class VendorMatcher : IVendorMatcher
{
    private readonly Dictionary<string, List<(int vendorId, int score)>> _index;
    private readonly Dictionary<int, Vendor> _vendorById;
    private readonly IDescriptionPreprocessor _preprocessor;

    public VendorMatcher(IReadOnlyCollection<Vendor> vendors, IReadOnlyCollection<VendorAlias> aliases, IDescriptionPreprocessor preprocessor)
    {
        _preprocessor = preprocessor;
        _vendorById = vendors.ToDictionary(v => v.Id);
        _index = new Dictionary<string, List<(int vendorId, int score)>>(StringComparer.Ordinal);

        // Alias tokens score 3 (explicit user mapping), vendor name tokens score 2 (implicit)
        foreach (var alias in aliases)
            AddToIndex(alias.Alias, alias.VendorId, 3);
        foreach (var vendor in vendors)
            AddToIndex(vendor.Name, vendor.Id, 2);
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

    public bool MatchesVendor(int vendorId, string description)
    {
        if (string.IsNullOrWhiteSpace(description))
            return false;

        var preprocessed = _preprocessor.Preprocess(description);
        var tokens = _preprocessor.Tokenize(preprocessed)
            .Concat(_preprocessor.GenerateShatteredCombinations(preprocessed));

        foreach (var token in tokens)
        {
            if (_index.TryGetValue(token, out var entries) && entries.Any(e => e.vendorId == vendorId))
                return true;
        }

        return false;
    }

    public IEnumerable<Vendor> Match(string description, int limit = 1, bool prefixMatching = false)
    {
        if (string.IsNullOrWhiteSpace(description))
            return [];

        var scores = new Dictionary<int, int>();

        var preprocessed = _preprocessor.Preprocess(description);

        if (prefixMatching)
        {
            foreach (var (token, entries) in _index)
            {
                if (!token.StartsWith(preprocessed, StringComparison.OrdinalIgnoreCase)) continue;
                foreach (var (vendorId, score) in entries)
                    scores[vendorId] = scores.GetValueOrDefault(vendorId) + 1;
            }
        }
        var tokens = _preprocessor.Tokenize(preprocessed)
            .Concat(_preprocessor.GenerateShatteredCombinations(preprocessed));
        foreach (var token in tokens)
        {
            if (!_index.TryGetValue(token, out var entries)) continue;
            foreach (var (vendorId, score) in entries)
                scores[vendorId] = scores.GetValueOrDefault(vendorId) + score;
        }

        return scores
            .OrderByDescending(kv => kv.Value)
            .Select(kv => _vendorById.GetValueOrDefault(kv.Key))
            .Where(v => v != null)
            .Take(limit)
            .ToList();
    }
}
