using System.Threading.Tasks;
using MW.TinyMoney.Api.Dashboard;

namespace MW.TinyMoney.UnitTests.Helpers;

public class DashboardStoreStub : IDashboardStore
{
    public DashboardData DashboardData { get; set; } = new DashboardData();

    public Task<DashboardData> GetDashboardData(int year, int month)
        => Task.FromResult(DashboardData);
}
