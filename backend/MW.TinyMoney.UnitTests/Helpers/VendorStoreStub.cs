using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using MW.TinyMoney.Api.Infrastructure;
using MW.TinyMoney.Api.Vendors;

namespace MW.TinyMoney.UnitTests.Helpers;

public class VendorStoreStub : IVendorStore
{
    public Action<Vendor> SaveVendorMutation { get; set; }
    public int SaveVendorCallCount { get; private set; }
    public Task SaveVendor(Vendor vendor) { SaveVendorCallCount++; SaveVendorMutation?.Invoke(vendor); return Task.CompletedTask; }
    
    public int GetVendorsCallCount { get; private set; }
    public IEnumerable<Vendor> Vendors { get; set; }
    
    public Task<IEnumerable<Vendor>> GetVendors()
    {
        GetVendorsCallCount++;
        return Task.FromResult(Vendors);
    }

    public IEnumerable<VendorAlias> Aliases { get; set; }
    public Task<IEnumerable<VendorAlias>> GetAllAliases() => Task.FromResult(Aliases);
    
    public VendorWithAliases VendorWithAliases { get; set; }
    public Task<VendorWithAliases> GetVendorWithAliases(int vendorId) => Task.FromResult(VendorWithAliases);

    public Task<Result<VendorAlias>> AddVendorAlias(int vendorId, string alias)
        => Task.FromResult(Result<VendorAlias>.Success(new VendorAlias { Id = 1, VendorId = vendorId, Alias = alias }));
    
    public Task<IEnumerable<VendorDetails>> GetDetailedVendors() => throw new NotImplementedException();
    public Task UpdateVendor(int vendorId, Vendor vendor) => throw new NotImplementedException();
    public Task DeleteVendor(VendorDetails vendorToDelete, int? mergeToVendorId) => throw new NotImplementedException();
    public Task DeleteVendorAlias(int vendorId, int aliasId) => throw new NotImplementedException();
}