using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MW.TinyMoney.Api.Reports
{
    public class AvailableMonthsModel
    {
        public Dictionary<int, IEnumerable<int>> AvailableMonths { get; set; }
    }
    
    public class ReportParameters
    {
        // time
        public IEnumerable<DateTime> Months { get; set; }
        
        // todo categories?
        // todo subcategories?
        // todo tags?
        // todo vendors?
    }
    
    [ApiController, Route("/api/reports"), Authorize]
    public class ReportsController : ControllerBase
    {
        private readonly IReportsProvider _reportsProvider;

        public ReportsController(IReportsProvider reportsProvider)
        {
            _reportsProvider = reportsProvider;
        }

        [HttpGet, Route("availableMonths")]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(AvailableMonthsModel))]
        public async Task<IActionResult> GetAvailableMonths()
        {
            return Ok(new AvailableMonthsModel()
            {
                // TODO get from db
                AvailableMonths = new Dictionary<int, IEnumerable<int>>()
                {
                    {2019, Enumerable.Range(1, 12)},
                    {2020, Enumerable.Range(1, 4)}
                }
            });
        }
        
        [HttpGet, Route("expensesByMonth")]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(ReportModel<decimal>))]
        public async Task<IActionResult> GetExpensesByMonthReport([FromQuery]ReportParameters reportParameters)
        {
            var reportData = _reportsProvider.PrepareExpensesByMonthReport(reportParameters.Months);
            
            var result = BuildReportModel(reportData);
            
            return Ok(result);
        }
        
        [HttpGet, Route("monthsSummary")]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(ReportModel<decimal>))]
        public async Task<IActionResult> GetMonthsSummaryReport([FromQuery]ReportParameters reportParameters)
        {
            var reportData = _reportsProvider.PrepareMonthsSummaryReport(reportParameters.Months);
            
            var result = BuildReportModel(reportData);
            
            return Ok(result);
        }
        
        [HttpGet, Route("categoriesBreakdown")]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(ReportModel<decimal>))]
        public async Task<IActionResult> GetCategoriesBreakdownReport([FromQuery]ReportParameters reportParameters)
        {
            var reportData = _reportsProvider.PrepareCategoriesBreakdownReport(reportParameters.Months);

            var result = BuildReportModel(reportData);
            
            return Ok(result);
        }

        [HttpGet, Route("topVendors")]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(ReportModel<decimal>))]
        public async Task<IActionResult> GetTopVendorsReport([FromQuery]ReportParameters reportParameters)
        {
            var reportData = _reportsProvider.PrepareTopVendorsReport(reportParameters.Months);
            
            var result = BuildReportModel(reportData);

            return Ok(result);
        }
        
        [HttpGet, Route("topTags")]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(ReportModel<decimal>))]
        public async Task<IActionResult> GetTopTagsReport([FromQuery]ReportParameters reportParameters)
        {
            var reportData = _reportsProvider.PrepareTopTagsReport(reportParameters.Months);
            
            var result = BuildReportModel(reportData);

            return Ok(result);
        }

        private static ReportModel<decimal> BuildReportModel(IEnumerable<ReportQueryResult<decimal>> reportData)
        {
            var labels = reportData.Select(x => x.XLabel).Distinct();
            var result = new ReportModel<decimal>()
            {
                Labels = labels,
                Datasets = reportData.GroupBy(x => x.Series).Select(series =>
                {
                    var dataSet = new ReportDataSet<decimal>()
                    {
                        Label = series.Key,
                        Data = labels.Select(xLabel => { return series.FirstOrDefault(x => x.XLabel == xLabel)?.Value ?? 0; })
                    };
                    return dataSet;
                })
            };
            return result;
        }
    }
}