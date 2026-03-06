#nullable enable
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Caching.Memory;
using MW.TinyMoney.Api.Vendors.Matching;

namespace MW.TinyMoney.Api.Vendors;

public interface IVendorMatchingService
{
    Task<IEnumerable<Vendor>> SuggestVendor(string description, int limit);
    Task<VendorIndex> CreateMatcher();
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

    public async Task<IEnumerable<Vendor>> SuggestVendor(string description, int limit)
    {
        var index = await CreateMatcher();
        return index.Match(description, limit);
    }

    public async Task<VendorIndex> CreateMatcher()
    {
        if (_cache.TryGetValue(IndexCacheKey, out VendorIndex cached))
            return cached!;

        var vendors = (await _vendorStore.GetVendors()).ToList();
        var aliases = (await _vendorStore.GetAllAliases()).ToList();

        var index = new VendorIndex(vendors, aliases, _preprocessor);
        _cache.Set(IndexCacheKey, index);
        return index;
    }
}
