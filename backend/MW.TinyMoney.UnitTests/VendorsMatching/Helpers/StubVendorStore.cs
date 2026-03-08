using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using MW.TinyMoney.Api.Infrastructure;
using MW.TinyMoney.Api.Vendors;

namespace MW.TinyMoney.UnitTests.VendorsMatching.Helpers;

public class StubVendorStore : IVendorStore
{
    private readonly IEnumerable<Vendor> _vendors;
    private readonly IEnumerable<VendorAlias> _aliases;

    public int GetVendorsCallCount { get; private set; }

    public StubVendorStore(IEnumerable<Vendor> vendors, IEnumerable<VendorAlias> aliases = null)
    {
        _vendors = vendors;
        _aliases = aliases ?? [];
    }

    public Task<IEnumerable<Vendor>> GetVendors()
    {
        GetVendorsCallCount++;
        return Task.FromResult(_vendors);
    }

    public Task<IEnumerable<VendorAlias>> GetAllAliases() => Task.FromResult(_aliases);

    public Task SaveVendor(Vendor vendor) => throw new NotImplementedException();
    public Task<IEnumerable<VendorDetails>> GetDetailedVendors() => throw new NotImplementedException();
    public Task<VendorWithAliases> GetVendorWithAliases(int vendorId) => throw new NotImplementedException();
    public Task UpdateVendor(int vendorId, Vendor vendor) => throw new NotImplementedException();
    public Task DeleteVendor(VendorDetails vendorToDelete, int? mergeToVendorId) => throw new NotImplementedException();
    public Task<Result<VendorAlias>> AddVendorAlias(int vendorId, string alias) => throw new NotImplementedException();
    public Task DeleteVendorAlias(int vendorId, int aliasId) => throw new NotImplementedException();
}