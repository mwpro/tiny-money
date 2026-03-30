using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using MW.TinyMoney.Api.Plans;

namespace MW.TinyMoney.UnitTests.Helpers;

public class PlanStoreStub : IPlanStore
{
    public Plan Plan { get; set; }
    public int CreatedPlanId { get; set; } = 1;
    public bool DeletePlanCalled { get; private set; }

    public Task<IEnumerable<PlanSummary>> GetPlans() => Task.FromResult<IEnumerable<PlanSummary>>([]);

    public Task<Plan> GetPlanDetail(int planId) => Task.FromResult(Plan);

    public Task<int> CreatePlan(string title, string description, DateTime dateFrom, DateTime? dateTo)
        => Task.FromResult(CreatedPlanId);

    public Task UpdatePlan(int planId, string title, string description, DateTime dateFrom, DateTime? dateTo)
        => Task.CompletedTask;

    public Task DeletePlan(int planId)
    {
        DeletePlanCalled = true;
        return Task.CompletedTask;
    }

    public Task AddPlanTag(int planId, int tagId, decimal amount, string description) => Task.CompletedTask;

    public Task UpdatePlanTag(int planId, int tagId, decimal amount, string description) => Task.CompletedTask;

    public Task DeletePlanTag(int planId, int tagId) => Task.CompletedTask;
}
