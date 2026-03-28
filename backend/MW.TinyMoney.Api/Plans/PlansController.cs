using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using MySqlConnector;
using MW.TinyMoney.Api.Plans.ApiModels;

namespace MW.TinyMoney.Api.Plans
{
    [ApiController, Route("/api/plans"), Authorize]
    public class PlansController : ControllerBase
    {
        private readonly IPlanStore _planStore;

        public PlansController(IPlanStore planStore)
        {
            _planStore = planStore;
        }

        [HttpGet("")]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(IEnumerable<PlanSummaryDto>))]
        public async Task<IActionResult> GetPlans()
        {
            var today = DateTime.Today;
            var plans = await _planStore.GetPlans();
            return Ok(plans.Select(p => ToSummaryDto(p, today)));
        }

        [HttpGet("{planId:int}")]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(PlanDetailDto))]
        [ProducesResponseType((int)HttpStatusCode.NotFound)]
        public async Task<IActionResult> GetPlanDetail([FromRoute] int planId)
        {
            var plan = await _planStore.GetPlanDetail(planId);
            if (plan == null)
                return NotFound();

            return Ok(new PlanDetailDto
            {
                Id = plan.Id,
                Title = plan.Title,
                Description = plan.Description,
                DateFrom = plan.DateFrom,
                DateTo = plan.DateTo,
                TagLines = plan.TagLines.Select(ToTagDto)
            });
        }

        [HttpPost("")]
        [ProducesResponseType((int)HttpStatusCode.Created)]
        [ProducesResponseType((int)HttpStatusCode.BadRequest)]
        public async Task<IActionResult> CreatePlan([FromBody] CreatePlanRequest request)
        {
            if (request.DateTo.HasValue && request.DateTo.Value < request.DateFrom)
                return BadRequest("DateTo must be on or after DateFrom.");

            var id = await _planStore.CreatePlan(request.Title, request.Description, request.DateFrom, request.DateTo);
            var plan = await _planStore.GetPlanDetail(id);
            var today = DateTime.Today;
            return StatusCode(StatusCodes.Status201Created, ToSummaryDto(new PlanSummary
            {
                Id = plan.Id,
                Title = plan.Title,
                Description = plan.Description,
                DateFrom = plan.DateFrom,
                DateTo = plan.DateTo,
                TotalBudget = 0,
                TotalSpent = 0
            }, today));
        }

        [HttpPut("{planId:int}")]
        [ProducesResponseType((int)HttpStatusCode.Accepted)]
        [ProducesResponseType((int)HttpStatusCode.BadRequest)]
        [ProducesResponseType((int)HttpStatusCode.NotFound)]
        public async Task<IActionResult> UpdatePlan([FromRoute] int planId, [FromBody] UpdatePlanRequest request)
        {
            if (request.DateTo.HasValue && request.DateTo.Value < request.DateFrom)
                return BadRequest("DateTo must be on or after DateFrom.");

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
        public async Task<IActionResult> AddPlanTag([FromRoute] int planId, [FromBody] AddPlanTagRequest request)
        {
            var existing = await _planStore.GetPlanDetail(planId);
            if (existing == null)
                return NotFound();

            try
            {
                var planTagId = await _planStore.AddPlanTag(planId, request.TagId, request.Amount, request.Description);
                return StatusCode(StatusCodes.Status201Created, new PlanTagDto
                {
                    Id = planTagId,
                    TagId = request.TagId,
                    Amount = request.Amount,
                    Description = request.Description,
                    Spent = 0
                });
            }
            catch (MySqlException ex) when (ex.Number == 1062)
            {
                return Conflict("This tag is already added to this plan.");
            }
        }

        [HttpPut("{planId:int}/tags/{planTagId:int}")]
        [ProducesResponseType((int)HttpStatusCode.Accepted)]
        [ProducesResponseType((int)HttpStatusCode.NotFound)]
        public async Task<IActionResult> UpdatePlanTag([FromRoute] int planId, [FromRoute] int planTagId, [FromBody] UpdatePlanTagRequest request)
        {
            var existing = await _planStore.GetPlanDetail(planId);
            if (existing == null)
                return NotFound();

            await _planStore.UpdatePlanTag(planTagId, request.Amount, request.Description);
            return Accepted();
        }

        [HttpDelete("{planId:int}/tags/{planTagId:int}")]
        [ProducesResponseType((int)HttpStatusCode.Accepted)]
        [ProducesResponseType((int)HttpStatusCode.NotFound)]
        public async Task<IActionResult> DeletePlanTag([FromRoute] int planId, [FromRoute] int planTagId)
        {
            var existing = await _planStore.GetPlanDetail(planId);
            if (existing == null)
                return NotFound();

            await _planStore.DeletePlanTag(planTagId);
            return Accepted();
        }

        private static PlanSummaryDto ToSummaryDto(PlanSummary p, DateTime today) => new()
        {
            Id = p.Id,
            Title = p.Title,
            Description = p.Description,
            DateFrom = p.DateFrom,
            DateTo = p.DateTo,
            TotalBudget = p.TotalBudget,
            TotalSpent = p.TotalSpent,
            IsActive = p.DateFrom <= today && (!p.DateTo.HasValue || p.DateTo.Value >= today)
        };

        private static PlanTagDto ToTagDto(PlanTag pt) => new()
        {
            Id = pt.Id,
            TagId = pt.TagId,
            TagName = pt.TagName,
            Amount = pt.Amount,
            Description = pt.Description,
            Spent = pt.Spent
        };
    }
}
