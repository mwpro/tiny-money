#nullable enable
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Microsoft.Extensions.Caching.Memory;

namespace MW.TinyMoney.Api.Vendors;

public interface IVendorMatchingService
{
    Task<Vendor?> SuggestVendor(string description);
    Task<Func<string, Vendor?>> CreateMatcher();
}

public class VendorMatchingService : IVendorMatchingService
{
    public const string IndexCacheKey = "vendor_matching_index";

    // Common noise tokens in Polish bank statement descriptions
    private static readonly HashSet<string> StopTokens = new(StringComparer.OrdinalIgnoreCase)
    {
        "pl", "sp", "sa", "z", "oo", "ltd", "gmbh", "inc",
        "zakup", "przy", "uzyciu", "karty", "karta", "przelew",
        "wychodzacy", "przychodzacy", "numer", "transakcja",
        "platnosc", "operacja", "via", "the", "and", "for", "pln"
    };

    private readonly IVendorStore _vendorStore;
    private readonly IMemoryCache _cache;

    public VendorMatchingService(IVendorStore vendorStore, IMemoryCache cache)
    {
        _vendorStore = vendorStore;
        _cache = cache;
    }

    public async Task<Vendor?> SuggestVendor(string description)
    {
        var matcher = await CreateMatcher();
        return matcher(description);
    }

    /// <summary>
    /// Returns a cached synchronous match function built from the current vendor/alias data.
    /// Rebuild is triggered automatically after any vendor or alias change via cache invalidation.
    /// </summary>
    public async Task<Func<string, Vendor?>> CreateMatcher()
    {
        if (_cache.TryGetValue(IndexCacheKey, out Func<string, Vendor?> cached))
            return cached!;

        var vendors = (await _vendorStore.GetVendors()).ToList();
        var aliases = (await _vendorStore.GetAllAliases()).ToList();

        var matcher = BuildMatcher(vendors, aliases);
        _cache.Set(IndexCacheKey, matcher);
        return matcher;
    }

    private static Func<string, Vendor?> BuildMatcher(
        IList<Vendor> vendors, IList<VendorAlias> aliases)
    {
        // Inverted index: token → [(vendorId, score)]
        // Alias tokens score 2 (explicit user mapping), vendor name tokens score 1 (implicit)
        var index = new Dictionary<string, List<(int vendorId, int score)>>(StringComparer.Ordinal);

        void AddToIndex(string text, int vendorId, int score)
        {
            foreach (var token in Tokenize(Preprocess(text)))
            {
                if (!index.TryGetValue(token, out var list))
                    index[token] = list = new List<(int, int)>();
                list.Add((vendorId, score));
            }
        }

        foreach (var alias in aliases)
            AddToIndex(alias.Alias, alias.VendorId, 2);
        foreach (var vendor in vendors)
            AddToIndex(vendor.Name, vendor.Id, 1);

        var vendorById = vendors.ToDictionary(v => v.Id);

        return description =>
        {
            if (string.IsNullOrWhiteSpace(description))
                return null;

            var preprocessed = Preprocess(description);
            var tokens = Tokenize(preprocessed);
            var scores = new Dictionary<int, int>();

            // Step 1: exact token matching
            foreach (var token in tokens)
            {
                if (!index.TryGetValue(token, out var entries)) continue;
                foreach (var (vendorId, score) in entries)
                    scores[vendorId] = scores.GetValueOrDefault(vendorId) + score;
            }

            // Step 2: fallback for shattered words (e.g. "BIEDR ONKA" → "biedronka")
            // Concatenate all non-stop fragments (keeping short pieces that were filtered
            // from normal tokenization) and substring-scan the index against the result.
            if (scores.Count == 0)
            {
                var concatenated = preprocessed
                    .Split(' ', StringSplitOptions.RemoveEmptyEntries)
                    .Where(t => !StopTokens.Contains(t))
                    .Aggregate(string.Empty, (acc, t) => acc + t);

                foreach (var (indexToken, entries) in index)
                {
                    if (indexToken.Length >= 4 && concatenated.Contains(indexToken, StringComparison.Ordinal))
                        foreach (var (vendorId, score) in entries)
                            scores[vendorId] = scores.GetValueOrDefault(vendorId) + score;
                }
            }

            if (scores.Count == 0)
                return null;

            var bestId = scores.MaxBy(kv => kv.Value).Key;
            return vendorById.TryGetValue(bestId, out var vendor) ? vendor : null;
        };
    }

    /// <summary>
    /// Strips banking noise from a description before tokenization:
    /// dates, card-number patterns, standalone numbers, then normalizes whitespace.
    /// </summary>
    private static string Preprocess(string text)
    {
        var s = text.ToLowerInvariant().Trim();
        s = Regex.Replace(s, @"\b\d{1,2}[./\-]\d{1,2}[./\-]\d{2,4}\b", " "); // dates
        s = Regex.Replace(s, @"(\d{4}[\s*xX]+){3}\d{4}", " ");                // card numbers
        s = Regex.Replace(s, @"\b\d+[,.]?\d*\b", " ");                         // amounts/codes
        s = Regex.Replace(s, @"[^\w\s]", " ");                                  // punctuation
        return Regex.Replace(s, @"\s+", " ").Trim();
    }

    private static IReadOnlyList<string> Tokenize(string preprocessed)
        => preprocessed
            .Split(' ', StringSplitOptions.RemoveEmptyEntries)
            .Where(t => t.Length >= 3 && !StopTokens.Contains(t))
            .ToList();
}
