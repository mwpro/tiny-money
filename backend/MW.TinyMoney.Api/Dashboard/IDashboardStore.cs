using System.Collections.Generic;
using System.Threading.Tasks;

namespace MW.TinyMoney.Api.Dashboard
{
    public interface IDashboardStore
    {
        Task<DashboardData> GetDashboardData(int year, int month);
    }

    public class DashboardData
    {
        public decimal IncomesTotal { get; set; }
        public decimal ExpensesTotal { get; set; }
        public int UnverifiedCount { get; set; }
        public List<DailyExpense> DailyExpenses { get; set; } = [];
    }
}
