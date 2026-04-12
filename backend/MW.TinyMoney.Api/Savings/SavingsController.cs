using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MW.TinyMoney.Api.Savings.ApiModels;

namespace MW.TinyMoney.Api.Savings;

[ApiController, Route("/api/savings"), Authorize]
public class SavingsController : ControllerBase
{
    private readonly ISavingsStore _store;

    public SavingsController(ISavingsStore store)
    {
        _store = store;
    }

    [HttpGet("categories")]
    [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(IEnumerable<SavingsCategoryResponseModel>))]
    public async Task<IActionResult> GetCategories()
    {
        return Ok((await _store.GetCategories()).Select(x => x.ToResponseModel()));
    }

    [HttpPost("categories")]
    [ProducesResponseType((int)HttpStatusCode.Created)]
    [ProducesResponseType((int)HttpStatusCode.BadRequest)]
    public async Task<IActionResult> CreateCategory([FromBody] CreateSavingsCategoryRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        await _store.CreateCategory(request.Name);
        return StatusCode((int)HttpStatusCode.Created);
    }

    [HttpPut("categories/{id}")]
    [ProducesResponseType((int)HttpStatusCode.OK)]
    [ProducesResponseType((int)HttpStatusCode.NotFound)]
    [ProducesResponseType((int)HttpStatusCode.BadRequest)]
    public async Task<IActionResult> UpdateCategory(int id, [FromBody] UpdateSavingsCategoryRequest request)
    {
        var category = await _store.GetCategoryById(id);
        if (category == null) return NotFound();
        if (!ModelState.IsValid) return BadRequest(ModelState);
        await _store.UpdateCategory(id, request.Name);
        return Ok();
    }

    [HttpDelete("categories/{id}")]
    [ProducesResponseType((int)HttpStatusCode.OK)]
    [ProducesResponseType((int)HttpStatusCode.NotFound)]
    [ProducesResponseType((int)HttpStatusCode.Conflict)]
    public async Task<IActionResult> DeleteCategory(int id)
    {
        var category = await _store.GetCategoryById(id);
        if (category == null) return NotFound();
        if (await _store.CategoryHasAccounts(id))
            return Conflict("Category has accounts assigned. Remove or reassign them first.");
        await _store.DeleteCategory(id);
        return Ok();
    }

    [HttpGet("accounts")]
    [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(IEnumerable<SavingsAccountResponseModel>))]
    public async Task<IActionResult> GetAccounts([FromQuery] bool includeArchived = false)
    {
        return Ok((await _store.GetAccounts(includeArchived)).Select(x => x.ToResponseModel()));
    }

    [HttpPost("accounts")]
    [ProducesResponseType((int)HttpStatusCode.Created)]
    [ProducesResponseType((int)HttpStatusCode.BadRequest)]
    public async Task<IActionResult> CreateAccount([FromBody] CreateSavingsAccountRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        await _store.CreateAccount(request.Name, request.CategoryId);
        return StatusCode((int)HttpStatusCode.Created);
    }

    [HttpPut("accounts/{id}")]
    [ProducesResponseType((int)HttpStatusCode.OK)]
    [ProducesResponseType((int)HttpStatusCode.NotFound)]
    [ProducesResponseType((int)HttpStatusCode.BadRequest)]
    public async Task<IActionResult> UpdateAccount(int id, [FromBody] UpdateSavingsAccountRequest request)
    {
        var account = await _store.GetAccountById(id);
        if (account == null) return NotFound();
        if (!ModelState.IsValid) return BadRequest(ModelState);
        await _store.UpdateAccount(id, request.Name, request.CategoryId, request.IsActive);
        return Ok();
    }

    [HttpGet("snapshots/{year}/{month}")]
    [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(SavingsSnapshotResponse))]
    [ProducesResponseType((int)HttpStatusCode.BadRequest)]
    public async Task<IActionResult> GetSnapshot(int year, int month)
    {
        if (year is < 1900 or > 2100) return BadRequest("Year must be between 1900 and 2100.");
        if (month is < 1 or > 12) return BadRequest("Month must be between 1 and 12.");
        var period = $"{year:D4}-{month:D2}";
        var entries = await _store.GetSnapshotPeriod(period);
        var cushion = await _store.GetCushion();
        var cushionActual = entries
            .Where(e => cushion.CushionCategoryIds.Contains(e.CategoryId))
            .Sum(e => e.Balance);
        return Ok(new SavingsSnapshotResponse
        {
            Entries = entries.Select(x => x.ToResponseModel()),
            CushionActual = cushionActual,
            CushionTarget = cushion.CushionAmount
        });
    }

    [HttpPost("snapshots/{year}/{month}")]
    [ProducesResponseType((int)HttpStatusCode.OK)]
    [ProducesResponseType((int)HttpStatusCode.BadRequest)]
    public async Task<IActionResult> SaveSnapshot(int year, int month, [FromBody] IEnumerable<SnapshotEntryRequest> entries)
    {
        if (month is < 1 or > 12) return BadRequest("Month must be between 1 and 12.");
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var period = $"{year:D4}-{month:D2}";
        await _store.UpsertSnapshots(period, entries);
        return Ok();
    }

    [HttpGet("cushion")]
    [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(SavingsCushionResponse))]
    public async Task<IActionResult> GetCushion()
    {
        var cushion = await _store.GetCushion();
        var avgs = await _store.GetAvgMonthlyExpenses(DateTime.Today);
        return Ok(new SavingsCushionResponse
        {
            CushionAmount = cushion.CushionAmount,
            CushionCategoryIds = cushion.CushionCategoryIds,
            AvgMonthlyExpenseThreeMonths = avgs.ThreeMonths,
            AvgMonthlyExpenseSixMonths = avgs.SixMonths,
            AvgMonthlyExpenseTwelveMonths = avgs.TwelveMonths
        });
    }

    [HttpPut("cushion")]
    [ProducesResponseType((int)HttpStatusCode.OK)]
    public async Task<IActionResult> UpdateCushion([FromBody] UpdateSavingsCushionRequest request)
    {
        await _store.UpsertCushion(request.CushionAmount, request.CushionCategoryIds);
        return Ok();
    }
}
