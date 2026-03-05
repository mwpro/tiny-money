using System.Linq;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

namespace MW.TinyMoney.Api.Vendors;

public interface IVendorMatchingService
{
    Task<Vendor?> SuggestVendor(string description);
    Task<Func<string, Vendor?>> CreateMatcher();
}

public class VendorMatchingService : IVendorMatchingService
{
    private readonly IVendorStore _vendorStore;

    public VendorMatchingService(IVendorStore vendorStore)
    {
        _vendorStore = vendorStore;
    }

    public async Task<Vendor?> SuggestVendor(string description)
    {
        var matcher = await CreateMatcher();
        return matcher(description);
    }

    /// <summary>
    /// Loads vendors and aliases once, returns a synchronous match function for batch use.
    /// </summary>
    public async Task<Func<string, Vendor?>> CreateMatcher()
    {
        var vendors = (await _vendorStore.GetVendors()).ToList();
        var aliases = (await _vendorStore.GetAllAliases()).ToList();

        // Pre-build candidate list: (normalizedPattern, vendorId), sorted longest-first
        var candidates = aliases
            .Select(a => (pattern: Normalize(a.Alias), vendorId: a.VendorId))
            .Concat(vendors.Select(v => (pattern: Normalize(v.Name), vendorId: v.Id)))
            .Where(c => c.pattern.Length >= 3)
            .OrderByDescending(c => c.pattern.Length)
            .ToList();

        var vendorById = vendors.ToDictionary(v => v.Id);

        return description =>
        {
            if (string.IsNullOrWhiteSpace(description))
                return null;

            var normalizedDescription = Normalize(description);
            var match = candidates.FirstOrDefault(c => normalizedDescription.Contains(c.pattern));
            return match.vendorId != 0 && vendorById.TryGetValue(match.vendorId, out var vendor)
                ? vendor
                : null;
        };
    }

    private static string Normalize(string text)
        => Regex.Replace(text.ToLowerInvariant().Trim(), @"\s+", " ");
}
