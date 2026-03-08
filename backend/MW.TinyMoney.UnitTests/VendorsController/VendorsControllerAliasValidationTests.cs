using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using MW.TinyMoney.Api.Vendors;
using MW.TinyMoney.UnitTests.Stubs;
using Xunit;

namespace MW.TinyMoney.UnitTests.VendorsController;

public class VendorsControllerAliasValidationTests
{
    private const string VendorName = "Stonka";

    private readonly VendorStoreStub _vendorStore;
    private readonly DescriptionPreprocessorMock _descriptionPreprocessor;
    
    private readonly Api.Vendors.VendorsController _controller;

    public VendorsControllerAliasValidationTests()
    {
        _descriptionPreprocessor = new DescriptionPreprocessorMock();
        _vendorStore = new VendorStoreStub();
        _vendorStore.VendorWithAliases = new VendorWithAliases(MakeVendorDetails(VendorName), []);
        var matchingService = new VendorMatchingServiceStub();
        
        _controller = new Api.Vendors.VendorsController(_vendorStore, matchingService, _descriptionPreprocessor);
    }
    
    private static VendorDetails MakeVendorDetails(string name) =>
        new() { Id = 1, Name = name, DefaultSubcategoryId = 1 };

    [Fact]
    public async Task AddAlias_ReturnsBadRequest_WhenAliasIsEmpty()
    {
        var result = await _controller.AddAlias(1, new AddVendorAliasRequest("   "));
        
        result.Should().BeOfType<BadRequestObjectResult>()
            .Which.Value.Should().Be("Alias cannot be empty");
    }

    [Fact]
    public async Task AddAlias_ReturnsBadRequest_WhenAllTokensTooShort()
    {
        _descriptionPreprocessor.TokenizeOverride = _ => []; // tokenize returned empty result
        
        var result = await _controller.AddAlias(1, new AddVendorAliasRequest("some alias"));
        
        result.Should().BeOfType<BadRequestObjectResult>()
            .Which.Value.Should().Be("Alias contains only words that are too short to be used for matching");
    }

    [Fact]
    public async Task AddAlias_ReturnsBadRequest_WhenAliasTokensMatchVendorName()
    {
        var result = await _controller.AddAlias(1, new AddVendorAliasRequest(VendorName));
        
        result.Should().BeOfType<BadRequestObjectResult>()
            .Which.Value.Should().Be("Alias cannot have the same keywords as the vendor name");
    }

    [Fact]
    public async Task AddAlias_ReturnsNotFound_WhenVendorDoesNotExist()
    {
        _vendorStore.VendorWithAliases = null;
        
        var result = await _controller.AddAlias(999, new AddVendorAliasRequest("some alias"));
        
        result.Should().BeOfType<NotFoundResult>();
    }

    [Fact]
    public async Task AddAlias_ReturnsCreated_WhenAliasIsValid()
    {
        var result = await _controller.AddAlias(1, new AddVendorAliasRequest("Jan Kowalski"));
        
        result.Should().BeOfType<ObjectResult>()
            .Which.StatusCode.Should().Be(StatusCodes.Status201Created);
    }
}
