using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using MW.TinyMoney.Api.Infrastructure;
using MW.TinyMoney.Api.Vendors;

namespace MW.TinyMoney.UnitTests.VendorsMatching.Helpers;

public class StubVendorStore : IVendorStore
{
    private readonly IEnumerable<Vendor> _vendors;

    public int GetVendorsCallCount { get; private set; }

    public StubVendorStore(IEnumerable<Vendor> vendors) => _vendors = vendors;

    public Task<IEnumerable<Vendor>> GetVendors()
    {
        GetVendorsCallCount++;
        return Task.FromResult(_vendors);
    }

    public Task<IEnumerable<VendorAlias>> GetAllAliases() => Task.FromResult<IEnumerable<VendorAlias>>([]);

    public Task SaveVendor(Vendor vendor) => throw new NotImplementedException();
    public Task<IEnumerable<VendorDetails>> GetDetailedVendors() => throw new NotImplementedException();
    public Task<VendorDetails> GetVendorDetails(int vendorId) => throw new NotImplementedException();
    public Task UpdateVendor(int vendorId, Vendor vendor) => throw new NotImplementedException();
    public Task DeleteVendor(VendorDetails vendorToDelete, int? mergeToVendorId) => throw new NotImplementedException();
    public Task<IEnumerable<VendorAlias>> GetVendorAliases(int vendorId) => throw new NotImplementedException();
    public Task<Result<VendorAlias>> AddVendorAlias(int vendorId, string alias) => throw new NotImplementedException();
    public Task DeleteVendorAlias(int vendorId, int aliasId) => throw new NotImplementedException();
}