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
    // A single vendor name or alias, tokenized. Vendors are scored by their best entry,
    // so having many aliases that share a word does not inflate a vendor's score.
    private sealed record Entry(int VendorId, bool IsAlias, IReadOnlyCollection<string> Tokens);

    // Compared lexicographically: more matched words wins; on a tie, a prefix hit (autocomplete),
    // then the entry whose words are covered more completely ("carrefour" fully covers vendor
    // "Carrefour" but only half of "Carrefour Express"), then aliases over vendor names.
    private readonly record struct EntryScore(int MatchedTokens, bool PrefixHit, double Coverage, bool IsAlias)
        : IComparable<EntryScore>
    {
        public int CompareTo(EntryScore other)
        {
            var c = MatchedTokens.CompareTo(other.MatchedTokens);
            if (c != 0) return c;
            c = PrefixHit.CompareTo(other.PrefixHit);
            if (c != 0) return c;
            c = Coverage.CompareTo(other.Coverage);
            if (c != 0) return c;
            return IsAlias.CompareTo(other.IsAlias);
        }
    }

    private readonly Dictionary<string, List<Entry>> _index;
    private readonly Dictionary<int, Vendor> _vendorById;
    private readonly IDescriptionPreprocessor _preprocessor;

    public VendorMatcher(IReadOnlyCollection<Vendor> vendors, IReadOnlyCollection<VendorAlias> aliases, IDescriptionPreprocessor preprocessor)
    {
        _preprocessor = preprocessor;
        _vendorById = vendors.ToDictionary(v => v.Id);
        _index = new Dictionary<string, List<Entry>>(StringComparer.Ordinal);

        foreach (var alias in aliases)
            AddToIndex(alias.Alias, alias.VendorId, isAlias: true);
        foreach (var vendor in vendors)
            AddToIndex(vendor.Name, vendor.Id, isAlias: false);
    }

    private void AddToIndex(string text, int vendorId, bool isAlias)
    {
        var tokens = _preprocessor.Tokenize(_preprocessor.Preprocess(text)).Distinct().ToList();
        if (tokens.Count == 0)
            return;

        var entry = new Entry(vendorId, isAlias, tokens);
        foreach (var token in tokens)
        {
            if (!_index.TryGetValue(token, out var list))
                _index[token] = list = new List<Entry>();
            list.Add(entry);
        }
    }

    private IEnumerable<string> LookupTokens(string preprocessed)
        => _preprocessor.Tokenize(preprocessed)
            .Concat(_preprocessor.GenerateShatteredCombinations(preprocessed))
            .Distinct();

    public bool MatchesVendor(int vendorId, string description)
    {
        if (string.IsNullOrWhiteSpace(description))
            return false;

        var preprocessed = _preprocessor.Preprocess(description);

        foreach (var token in LookupTokens(preprocessed))
        {
            if (_index.TryGetValue(token, out var entries) && entries.Any(e => e.VendorId == vendorId))
                return true;
        }

        return false;
    }

    public IEnumerable<Vendor> Match(string description, int limit = 1, bool prefixMatching = false)
    {
        if (string.IsNullOrWhiteSpace(description))
            return [];

        var preprocessed = _preprocessor.Preprocess(description);
        if (string.IsNullOrWhiteSpace(preprocessed))
            return [];

        var matchedTokens = new Dictionary<Entry, int>(ReferenceEqualityComparer.Instance);
        foreach (var token in LookupTokens(preprocessed))
        {
            if (!_index.TryGetValue(token, out var entries)) continue;
            foreach (var entry in entries)
                matchedTokens[entry] = matchedTokens.GetValueOrDefault(entry) + 1;
        }

        var prefixHits = new HashSet<Entry>(ReferenceEqualityComparer.Instance);
        if (prefixMatching)
        {
            foreach (var (token, entries) in _index)
            {
                if (!token.StartsWith(preprocessed, StringComparison.OrdinalIgnoreCase)) continue;
                prefixHits.UnionWith(entries);
            }
        }

        var bestByVendor = new Dictionary<int, EntryScore>();
        foreach (var entry in matchedTokens.Keys.Concat(prefixHits).Distinct(ReferenceEqualityComparer.Instance).Cast<Entry>())
        {
            var matched = matchedTokens.GetValueOrDefault(entry);
            var score = new EntryScore(
                matched,
                prefixHits.Contains(entry),
                (double)matched / entry.Tokens.Count,
                entry.IsAlias);

            if (!bestByVendor.TryGetValue(entry.VendorId, out var best) || score.CompareTo(best) > 0)
                bestByVendor[entry.VendorId] = score;
        }

        return bestByVendor
            .OrderByDescending(kv => kv.Value)
            .ThenBy(kv => kv.Key)
            .Select(kv => _vendorById.GetValueOrDefault(kv.Key))
            .Where(v => v != null)
            .Take(limit)
            .ToList();
    }
}
