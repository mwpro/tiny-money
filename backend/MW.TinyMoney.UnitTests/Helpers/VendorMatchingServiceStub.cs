using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using MW.TinyMoney.Api.Vendors;
using MW.TinyMoney.Api.Vendors.Matching;

namespace MW.TinyMoney.UnitTests.Helpers;

public class VendorMatchingServiceStub : IVendorMatchingService
{
    public string SuggestAliasResult { get; set; }

    public Task<string> SuggestAlias(int vendorId, string description) => Task.FromResult(SuggestAliasResult);
    public Task<IEnumerable<Vendor>> SuggestVendor(string description, int limit) => throw new NotImplementedException();
    public Task<IVendorMatcher> CreateMatcher() => throw new NotImplementedException();
}