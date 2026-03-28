using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using MW.TinyMoney.Api.Plans;
using MW.TinyMoney.Api.Plans.ApiModels;
using MW.TinyMoney.UnitTests.Helpers;
using Xunit;

namespace MW.TinyMoney.UnitTests.Plans;

public class PlansControllerTests
{
    private readonly PlanStoreStub _planStore;
    private readonly PlansController _controller;

    public PlansControllerTests()
    {
        _planStore = new PlanStoreStub();
        _controller = new PlansController(_planStore);
    }

    // ---- CreatePlan ----

    [Fact]
    public async Task CreatePlan_Returns201_WhenValid()
    {
        var result = await _controller.CreatePlan(new CreatePlanRequest
        {
            Title = "Test",
            DateFrom = new DateTime(2026, 1, 1)
        });

        result.Should().BeOfType<ObjectResult>()
            .Which.StatusCode.Should().Be(StatusCodes.Status201Created);
    }

    [Fact]
    public async Task CreatePlan_Returns400_WhenModelStateInvalid()
    {
        _controller.ModelState.AddModelError("DateTo", "DateTo must be after DateFrom");

        var result = await _controller.CreatePlan(new CreatePlanRequest
        {
            Title = "Test",
            DateFrom = new DateTime(2026, 6, 1),
            DateTo = new DateTime(2026, 5, 1)
        });

        result.Should().BeOfType<BadRequestObjectResult>();
    }

    // ---- GetPlanDetail ----

    [Fact]
    public async Task GetPlanDetail_Returns404_WhenPlanNotFound()
    {
        _planStore.PlanDetail = null;

        var result = await _controller.GetPlanDetail(99);

        result.Should().BeOfType<NotFoundResult>();
    }

    [Fact]
    public async Task GetPlanDetail_Returns200_WithEmptyTagLines()
    {
        _planStore.PlanDetail = new PlanDetail
        {
            Id = 1,
            Title = "Home Renovation",
            DateFrom = new DateTime(2026, 1, 1),
            TagLines = new List<PlanTag>()
        };

        var result = await _controller.GetPlanDetail(1);

        var dto = result.Should().BeOfType<OkObjectResult>()
            .Which.Value.Should().BeOfType<PlanDetailDto>().Subject;
        dto.TagLines.Should().BeEmpty();
    }

    [Fact]
    public async Task GetPlanDetail_Returns200_WithTagLines()
    {
        _planStore.PlanDetail = new PlanDetail
        {
            Id = 1,
            Title = "Home Renovation",
            DateFrom = new DateTime(2026, 1, 1),
            TagLines = new List<PlanTag>
            {
                new() { TagId = 5, TagName = "Plumbing", Amount = 3000, Spent = 300 }
            }
        };

        var result = await _controller.GetPlanDetail(1);

        var dto = result.Should().BeOfType<OkObjectResult>()
            .Which.Value.Should().BeOfType<PlanDetailDto>().Subject;
        dto.TagLines.Should().ContainSingle()
            .Which.TagName.Should().Be("Plumbing");
    }

    // ---- UpdatePlan ----

    [Fact]
    public async Task UpdatePlan_Returns404_WhenPlanNotFound()
    {
        _planStore.PlanDetail = null;

        var result = await _controller.UpdatePlan(99, new UpdatePlanRequest { Title = "X", DateFrom = DateTime.Today });

        result.Should().BeOfType<NotFoundResult>();
    }

    [Fact]
    public async Task UpdatePlan_Returns400_WhenModelStateInvalid()
    {
        _controller.ModelState.AddModelError("DateTo", "DateTo must be after DateFrom");

        var result = await _controller.UpdatePlan(1, new UpdatePlanRequest
        {
            Title = "X",
            DateFrom = new DateTime(2026, 6, 1),
            DateTo = new DateTime(2026, 5, 1)
        });

        result.Should().BeOfType<BadRequestObjectResult>();
    }

    // ---- DeletePlan ----

    [Fact]
    public async Task DeletePlan_Returns404_WhenPlanNotFound()
    {
        _planStore.PlanDetail = null;

        var result = await _controller.DeletePlan(99);

        result.Should().BeOfType<NotFoundResult>();
    }

    [Fact]
    public async Task DeletePlan_Returns202_WhenPlanExists()
    {
        _planStore.PlanDetail = new PlanDetail { Id = 1, Title = "X", DateFrom = DateTime.Today };

        var result = await _controller.DeletePlan(1);

        result.Should().BeOfType<AcceptedResult>();
        _planStore.DeletePlanCalled.Should().BeTrue();
    }

    // ---- AddPlanTag ----

    [Fact]
    public async Task AddPlanTag_Returns404_WhenPlanNotFound()
    {
        _planStore.PlanDetail = null;

        var result = await _controller.AddPlanTag(99, new AddPlanTagRequest { TagId = 1, Amount = 500 });

        result.Should().BeOfType<NotFoundResult>();
    }

    [Fact]
    public async Task AddPlanTag_Returns201_WhenSuccess()
    {
        _planStore.PlanDetail = new PlanDetail { Id = 1, Title = "X", DateFrom = DateTime.Today };

        var result = await _controller.AddPlanTag(1, new AddPlanTagRequest { TagId = 5, Amount = 1000 });

        result.Should().BeOfType<StatusCodeResult>()
            .Which.StatusCode.Should().Be(StatusCodes.Status201Created);
    }

    [Fact]
    public async Task AddPlanTag_Returns409_WhenTagAlreadyAdded()
    {
        _planStore.PlanDetail = new PlanDetail
        {
            Id = 1, Title = "X", DateFrom = DateTime.Today,
            TagLines = new List<PlanTag> { new() { TagId = 5, TagName = "Test", Amount = 100 } }
        };

        var result = await _controller.AddPlanTag(1, new AddPlanTagRequest { TagId = 5, Amount = 1000 });

        result.Should().BeOfType<ConflictObjectResult>();
    }

    // ---- UpdatePlanTag ----

    [Fact]
    public async Task UpdatePlanTag_Returns404_WhenPlanNotFound()
    {
        _planStore.PlanDetail = null;

        var result = await _controller.UpdatePlanTag(99, 10, new UpdatePlanTagRequest { Amount = 500 });

        result.Should().BeOfType<NotFoundResult>();
    }

    [Fact]
    public async Task UpdatePlanTag_Returns202_WhenSuccess()
    {
        _planStore.PlanDetail = new PlanDetail { Id = 1, Title = "X", DateFrom = DateTime.Today };

        var result = await _controller.UpdatePlanTag(1, 10, new UpdatePlanTagRequest { Amount = 2000 });

        result.Should().BeOfType<AcceptedResult>();
    }

    // ---- DeletePlanTag ----

    [Fact]
    public async Task DeletePlanTag_Returns404_WhenPlanNotFound()
    {
        _planStore.PlanDetail = null;

        var result = await _controller.DeletePlanTag(99, 10);

        result.Should().BeOfType<NotFoundResult>();
    }

    [Fact]
    public async Task DeletePlanTag_Returns202_WhenSuccess()
    {
        _planStore.PlanDetail = new PlanDetail { Id = 1, Title = "X", DateFrom = DateTime.Today };

        var result = await _controller.DeletePlanTag(1, 10);

        result.Should().BeOfType<AcceptedResult>();
    }
}
