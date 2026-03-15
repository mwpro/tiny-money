using System;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using MW.TinyMoney.Api.Import;
using Xunit;

namespace MW.TinyMoney.UnitTests.Import;

public class ImportControllerSingleTransactionTests
{
    private readonly ImportServiceStub _importService;
    private readonly ImportController _controller;

    public ImportControllerSingleTransactionTests()
    {
        _importService = new ImportServiceStub();
        _controller = new ImportController(_importService);
    }

    [Fact]
    public async Task Returns201WithId_WhenImportSucceeds()
    {
        _importService.SingleResult = new CommandSuccess<int>(42);

        var result = await _controller.ImportSingle(
            new ImportController.ImportSingleRequest(new DateTime(2026, 3, 15), true, 45.50m, "Stonka"),
            CancellationToken.None);

        var objectResult = result.Should().BeOfType<ObjectResult>().Subject;
        objectResult.StatusCode.Should().Be(StatusCodes.Status201Created);
        objectResult.Value.Should().BeOfType<ImportController.ImportSingleResponse>()
            .Which.Id.Should().Be(42);
    }

    [Fact]
    public async Task Returns500_WhenServiceFails()
    {
        _importService.SingleResult = new UnexpectedResult<int>();

        var result = await _controller.ImportSingle(
            new ImportController.ImportSingleRequest(new DateTime(2026, 3, 15), true, 45.50m, "Stonka"),
            CancellationToken.None);

        result.Should().BeOfType<StatusCodeResult>()
            .Which.StatusCode.Should().Be(StatusCodes.Status500InternalServerError);
    }

    private class ImportServiceStub : IImportService
    {
        public ICommandResult<int> SingleResult { get; set; }

        public Task<ICommandResult<ImportResult>> ImportFile(System.IO.Stream fileStream, string fileType, CancellationToken ct)
            => throw new NotImplementedException();

        public Task<ICommandResult<int>> ImportSingle(SingleTransactionRequest request, CancellationToken ct)
            => Task.FromResult(SingleResult);
    }

    private class UnexpectedResult<T> : ICommandResult<T> { }
}
