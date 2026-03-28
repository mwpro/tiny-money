using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using MW.TinyMoney.Api.Plans;

namespace MW.TinyMoney.UnitTests.Helpers;

public class PlanStoreStub : IPlanStore
{
    public PlanDetail PlanDetail { get; set; }
    public int CreatedPlanId { get; set; } = 1;
    public int CreatedPlanTagId { get; set; } = 10;
    public bool DeletePlanCalled { get; private set; }

    public Task<IEnumerable<PlanSummary>> GetPlans() => Task.FromResult<IEnumerable<PlanSummary>>([]);

    public Task<IEnumerable<PlanSummary>> GetActivePlans(DateTime today) => Task.FromResult<IEnumerable<PlanSummary>>([]);

    public Task<PlanDetail> GetPlanDetail(int planId) => Task.FromResult(PlanDetail);

    public Task<int> CreatePlan(string title, string description, DateTime dateFrom, DateTime? dateTo)
        => Task.FromResult(CreatedPlanId);

    public Task UpdatePlan(int planId, string title, string description, DateTime dateFrom, DateTime? dateTo)
        => Task.CompletedTask;

    public Task DeletePlan(int planId)
    {
        DeletePlanCalled = true;
        return Task.CompletedTask;
    }

    public Task<int> AddPlanTag(int planId, int tagId, decimal amount, string description)
        => Task.FromResult(CreatedPlanTagId);

    public Task UpdatePlanTag(int planTagId, decimal amount, string description) => Task.CompletedTask;

    public Task DeletePlanTag(int planTagId) => Task.CompletedTask;
}
