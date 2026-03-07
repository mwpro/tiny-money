using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Caching.Memory;

namespace MW.TinyMoney.Api.Vendors.Matching;

public interface IVendorMatchingService
{
    Task<IEnumerable<Vendor>> SuggestVendor(string description, int limit);
    Task<IVendorMatcher> CreateMatcher();
}

public class VendorMatchingService : IVendorMatchingService
{
    public const string IndexCacheKey = "vendor_matching_index";

    private readonly IVendorStore _vendorStore;
    private readonly IMemoryCache _cache;
    private readonly IDescriptionPreprocessor _preprocessor;

    public VendorMatchingService(IVendorStore vendorStore, IMemoryCache cache, IDescriptionPreprocessor preprocessor)
    {
        _vendorStore = vendorStore;
        _cache = cache;
        _preprocessor = preprocessor;
    }

    public async Task<IEnumerable<Vendor>> SuggestVendor(string description, int limit)
    {
        var matcher = await CreateMatcher();
        return matcher.Match(description, limit);
    }

    public async Task<IVendorMatcher> CreateMatcher()
    {
        if (_cache.TryGetValue<IVendorMatcher>(IndexCacheKey, out var cached))
            return cached!;

        var vendors = (await _vendorStore.GetVendors()).ToList();
        var aliases = (await _vendorStore.GetAllAliases()).ToList();

        var matcher = new VendorMatcher(vendors, aliases, _preprocessor);
        _cache.Set(IndexCacheKey, matcher);
        return matcher;
    }
}
