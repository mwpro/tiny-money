using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using MW.TinyMoney.Api.Plans.ApiModels;

namespace MW.TinyMoney.Api.Plans;

[ApiController, Route("/api/plans"), Authorize]
public class PlansController : ControllerBase
{
    private readonly IPlanStore _planStore;

    public PlansController(IPlanStore planStore)
    {
        _planStore = planStore;
    }

    [HttpGet("")]
    [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(IEnumerable<PlanSummaryResponse>))]
    public async Task<IActionResult> GetPlans()
    {
        var plans = await _planStore.GetPlans();
        return Ok(plans.Select(p => p.ToResponseModel()));
    }

    [HttpGet("{planId:int}")]
    [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(PlanResponse))]
    [ProducesResponseType((int)HttpStatusCode.NotFound)]
    public async Task<IActionResult> GetPlanDetail([FromRoute] int planId)
    {
        var plan = await _planStore.GetPlanDetail(planId);
        if (plan == null)
            return NotFound();

        return Ok(plan.ToResponseModel());
    }

    [HttpPost("")]
    [ProducesResponseType((int)HttpStatusCode.Created)]
    [ProducesResponseType((int)HttpStatusCode.BadRequest)]
    public async Task<IActionResult> CreatePlan([FromBody] UpdatePlanRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var id = await _planStore.CreatePlan(request.Title, request.Description, request.DateFrom, request.DateTo);
        return StatusCode(StatusCodes.Status201Created, new { id });
    }

    [HttpPut("{planId:int}")]
    [ProducesResponseType((int)HttpStatusCode.Accepted)]
    [ProducesResponseType((int)HttpStatusCode.BadRequest)]
    [ProducesResponseType((int)HttpStatusCode.NotFound)]
    public async Task<IActionResult> UpdatePlan([FromRoute] int planId, [FromBody] UpdatePlanRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var existing = await _planStore.GetPlanDetail(planId);
        if (existing == null)
            return NotFound();

        await _planStore.UpdatePlan(planId, request.Title, request.Description, request.DateFrom, request.DateTo);
        return Accepted();
    }

    [HttpDelete("{planId:int}")]
    [ProducesResponseType((int)HttpStatusCode.Accepted)]
    [ProducesResponseType((int)HttpStatusCode.NotFound)]
    public async Task<IActionResult> DeletePlan([FromRoute] int planId)
    {
        var existing = await _planStore.GetPlanDetail(planId);
        if (existing == null)
            return NotFound();

        await _planStore.DeletePlan(planId);
        return Accepted();
    }

    [HttpPost("{planId:int}/tags")]
    [ProducesResponseType((int)HttpStatusCode.Created)]
    [ProducesResponseType((int)HttpStatusCode.NotFound)]
    [ProducesResponseType((int)HttpStatusCode.Conflict)]
    public async Task<IActionResult> AddPlanTag([FromRoute] int planId, [FromBody] AddPlanTagRequest request)
    {
        var existing = await _planStore.GetPlanDetail(planId);
        if (existing == null)
            return NotFound();

        if (existing.TagLines.Any(t => t.TagId == request.TagId))
            return Conflict("This tag is already added to this plan.");

        await _planStore.AddPlanTag(planId, request.TagId, request.Amount, request.Description);
        return StatusCode(StatusCodes.Status201Created);
    }

    [HttpPut("{planId:int}/tags/{tagId:int}")]
    [ProducesResponseType((int)HttpStatusCode.Accepted)]
    [ProducesResponseType((int)HttpStatusCode.NotFound)]
    public async Task<IActionResult> UpdatePlanTag([FromRoute] int planId, [FromRoute] int tagId, [FromBody] UpdatePlanTagRequest request)
    {
        var existing = await _planStore.GetPlanDetail(planId);
        if (existing == null)
            return NotFound();

        await _planStore.UpdatePlanTag(planId, tagId, request.Amount, request.Description);
        return Accepted();
    }

    [HttpDelete("{planId:int}/tags/{tagId:int}")]
    [ProducesResponseType((int)HttpStatusCode.Accepted)]
    [ProducesResponseType((int)HttpStatusCode.NotFound)]
    public async Task<IActionResult> DeletePlanTag([FromRoute] int planId, [FromRoute] int tagId)
    {
        var existing = await _planStore.GetPlanDetail(planId);
        if (existing == null)
            return NotFound();

        await _planStore.DeletePlanTag(planId, tagId);
        return Accepted();
    }
}
