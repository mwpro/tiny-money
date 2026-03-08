using System.Collections.Generic;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using MW.TinyMoney.Api.Infrastructure;
using MW.TinyMoney.Api.Vendors;
using MW.TinyMoney.Api.Vendors.Matching;
using MW.TinyMoney.UnitTests.VendorsMatching.Helpers;
using Xunit;

namespace MW.TinyMoney.UnitTests.VendorsControllerTests;

public class VendorsControllerAliasValidationTests
{
    private static VendorDetails MakeVendorDetails(string name) =>
        new() { Id = 1, Name = name, DefaultSubcategoryId = 1 };

    private static Api.Vendors.VendorsController BuildController(
        string vendorName,
        DescriptionPreprocessorMock preprocessor = null)
    {
        preprocessor ??= new DescriptionPreprocessorMock();
        var store = new StubVendorStoreWithAliasSupport(vendorName);
        var matchingService = new StubVendorMatchingService();
        return new Api.Vendors.VendorsController(store, matchingService, preprocessor);
    }

    [Fact]
    public async Task AddAlias_ReturnsBadRequest_WhenAliasIsEmpty()
    {
        var controller = BuildController("Stonka");
        var result = await controller.AddAlias(1, new AddVendorAliasRequest("   "));
        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task AddAlias_ReturnsBadRequest_WhenAllTokensTooShort()
    {
        var preprocessor = new DescriptionPreprocessorMock
        {
            TokenizeOverride = _ => []
        };
        var controller = BuildController("Stonka", preprocessor);
        var result = await controller.AddAlias(1, new AddVendorAliasRequest("ab cd"));
        result.Should().BeOfType<BadRequestObjectResult>()
            .Which.Value.Should().Be("Alias contains only words that are too short to be used for matching");
    }

    [Fact]
    public async Task AddAlias_ReturnsBadRequest_WhenAliasTokensMatchVendorName()
    {
        var controller = BuildController("Stonka");
        var result = await controller.AddAlias(1, new AddVendorAliasRequest("Stonka"));
        result.Should().BeOfType<BadRequestObjectResult>()
            .Which.Value.Should().Be("Alias cannot have the same keywords as the vendor name");
    }

    [Fact]
    public async Task AddAlias_ReturnsCreated_WhenAliasIsValid()
    {
        var controller = BuildController("Stonka");
        var result = await controller.AddAlias(1, new AddVendorAliasRequest("Jan Kowalski"));
        result.Should().BeOfType<ObjectResult>()
            .Which.StatusCode.Should().Be(StatusCodes.Status201Created);
    }

    [Fact]
    public async Task AddAlias_ReturnsNotFound_WhenVendorDoesNotExist()
    {
        var store = new StubVendorStoreWithAliasSupport(null);
        var controller = new Api.Vendors.VendorsController(store, new StubVendorMatchingService(), new DescriptionPreprocessorMock());
        var result = await controller.AddAlias(999, new AddVendorAliasRequest("some alias"));
        result.Should().BeOfType<NotFoundResult>();
    }

    // Stubs

    private class StubVendorStoreWithAliasSupport : IVendorStore
    {
        private readonly string _vendorName;

        public StubVendorStoreWithAliasSupport(string vendorName) => _vendorName = vendorName;

        public Task<VendorWithAliases> GetVendorWithAliases(int vendorId)
        {
            if (_vendorName is null)
                return Task.FromResult<VendorWithAliases>(null);
            return Task.FromResult(new VendorWithAliases(MakeVendorDetails(_vendorName), []));
        }

        public Task<Result<VendorAlias>> AddVendorAlias(int vendorId, string alias)
            => Task.FromResult(Result<VendorAlias>.Success(new VendorAlias { Id = 1, VendorId = vendorId, Alias = alias }));

        public Task<IEnumerable<Vendor>> GetVendors() => throw new System.NotImplementedException();
        public Task<IEnumerable<VendorAlias>> GetAllAliases() => throw new System.NotImplementedException();
        public Task SaveVendor(Vendor vendor) => throw new System.NotImplementedException();
        public Task<IEnumerable<VendorDetails>> GetDetailedVendors() => throw new System.NotImplementedException();
        public Task UpdateVendor(int vendorId, Vendor vendor) => throw new System.NotImplementedException();
        public Task DeleteVendor(VendorDetails vendorToDelete, int? mergeToVendorId) => throw new System.NotImplementedException();
        public Task DeleteVendorAlias(int vendorId, int aliasId) => throw new System.NotImplementedException();
    }

    private class StubVendorMatchingService : IVendorMatchingService
    {
        public Task<IEnumerable<Vendor>> SuggestVendor(string description, int limit) => throw new System.NotImplementedException();
        public Task<IVendorMatcher> CreateMatcher() => throw new System.NotImplementedException();
        public Task<string> SuggestAlias(int vendorId, string description) => throw new System.NotImplementedException();
    }
}
