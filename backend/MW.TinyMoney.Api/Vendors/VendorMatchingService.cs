#nullable enable
using System;
using System.Linq;
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

    private readonly IVendorStore _vendorStore;
    private readonly IMemoryCache _cache;
    private readonly DescriptionPreprocessor _preprocessor;

    public VendorMatchingService(IVendorStore vendorStore, IMemoryCache cache, DescriptionPreprocessor preprocessor)
    {
        _vendorStore = vendorStore;
        _cache = cache;
        _preprocessor = preprocessor;
    }

    public async Task<Vendor?> SuggestVendor(string description)
    {
        var matcher = await CreateMatcher();
        return matcher(description);
    }

    public async Task<Func<string, Vendor?>> CreateMatcher()
    {
        if (_cache.TryGetValue(IndexCacheKey, out Func<string, Vendor?> cached))
            return cached!;

        var vendors = (await _vendorStore.GetVendors()).ToList();
        var aliases = (await _vendorStore.GetAllAliases()).ToList();

        var index = new VendorIndex(vendors, aliases, _preprocessor);
        _cache.Set(IndexCacheKey, (Func<string, Vendor?>)index.Match);
        return index.Match;
    }
}
