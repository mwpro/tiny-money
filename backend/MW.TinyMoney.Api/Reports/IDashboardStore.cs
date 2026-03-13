using System.Threading.Tasks;

namespace MW.TinyMoney.Api.Reports;

public interface IDashboardStore
{
    Task<DashboardResponse> GetDashboardData(int year, int month);
}
