using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MW.TinyMoney.Api.Reports
{
    [ApiController, Route("/api/reports"), Authorize]
    public class ReportsController : ControllerBase
    {
        private readonly IReportsProvider _reportsProvider;

        public ReportsController(IReportsProvider reportsProvider)
        {
            _reportsProvider = reportsProvider;
        }

        [HttpGet, Route("expensesByMonth")]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(ReportModel<decimal>))]
        public async Task<IActionResult> GetExpensesByMonthReport()
        {
            var reportData = _reportsProvider.PrepareExpensesByMonthReport();
            
            var labels = reportData.Select(x => x.XLabel).Distinct();
            var result = new ReportModel<decimal>()
            {
                Labels = labels,
                Datasets = reportData.GroupBy(x => x.Series).Select(series =>
                {
                    var dataSet = new ReportDataSet<decimal>()
                    {
                        Label = series.Key,
                        Data = labels.Select(xLabel =>
                        {
                            return series.FirstOrDefault(x => x.XLabel == xLabel)?.Value ?? 0;
                        })
                    };
                    return dataSet;
                }) 
            };
            
            return Ok(result);
        }
    }
}