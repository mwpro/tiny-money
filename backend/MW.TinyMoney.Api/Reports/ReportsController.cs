using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Net;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MW.TinyMoney.Api.Transaction;

namespace MW.TinyMoney.Api.Reports
{
    public class AvailableMonthsModel
    {
        public Dictionary<int, IEnumerable<int>> AvailableMonths { get; set; }
    }
    
    public class ReportParameters
    {
        // time
        [Required]
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
        private readonly ITransactionStore _transactionStore;

        public ReportsController(IReportsProvider reportsProvider, ITransactionStore transactionStore)
        {
            _reportsProvider = reportsProvider;
            _transactionStore = transactionStore;
        }

        [HttpGet, Route("availableMonths")]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(AvailableMonthsModel))]
        public IActionResult GetAvailableMonths()
        {
            return Ok(new AvailableMonthsModel()
            {
                AvailableMonths = _reportsProvider.GetAvailableMonths()
            });
        }
        
        [HttpGet, Route("expensesByMonth")]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(ReportModel<decimal>))]
        public IActionResult GetExpensesByMonthReport([FromQuery]ReportParameters reportParameters)
        {
            var reportData = _reportsProvider.PrepareExpensesByMonthReport(reportParameters.Months);
            
            var result = BuildReportModel(reportData);
            
            return Ok(result);
        }
        
        [HttpGet, Route("monthsSummary")]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(ReportModel<decimal>))]
        public IActionResult GetMonthsSummaryReport([FromQuery]ReportParameters reportParameters)
        {
            var reportData = _reportsProvider.PrepareMonthsSummaryReport(reportParameters.Months);
            
            var result = BuildReportModel(reportData);
            
            return Ok(result);
        }
        
        [HttpGet, Route("categoriesBreakdown")]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(ReportModel<decimal>))]
        public IActionResult GetCategoriesBreakdownReport([FromQuery]ReportParameters reportParameters)
        {
            var reportData = _reportsProvider.PrepareCategoriesBreakdownReport(reportParameters.Months);

            var result = BuildReportModel(reportData);
            
            return Ok(result);
        }
        
        [HttpGet, Route("incomeBreakdown")]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(ReportModel<decimal>))]
        public IActionResult GetIncomeBreakdownReport([FromQuery]ReportParameters reportParameters)
        {
            var reportData = _reportsProvider.PrepareIncomeBreakdownReport(reportParameters.Months);

            var result = BuildReportModel(reportData);
            
            return Ok(result);
        }


        [HttpGet, Route("topVendors")]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(ReportModel<decimal>))]
        public IActionResult GetTopVendorsReport([FromQuery]ReportParameters reportParameters)
        {
            var reportData = _reportsProvider.PrepareTopVendorsReport(reportParameters.Months);
            
            var result = BuildReportModel(reportData);

            return Ok(result);
        }
        
        [HttpGet, Route("topTags")]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(ReportModel<decimal>))]
        public IActionResult GetTopTagsReport([FromQuery]ReportParameters reportParameters)
        {
            var reportData = _reportsProvider.PrepareTopTagsReport(reportParameters.Months);
            
            var result = BuildReportModel(reportData);

            return Ok(result);
        }

        [HttpGet, Route("topExpenses")]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(IEnumerable<Transaction.ApiModels.Transaction>))]
        public IActionResult GetTopExpensesReport([FromQuery]ReportParameters reportParameters)
        {
            return Ok(_transactionStore.GetTopExpenses(reportParameters.Months));
        }

        [HttpGet, Route("budgetBurndown")]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(ReportModel<decimal>))]
        public IActionResult GetBudgetBurndown([FromQuery]ReportParameters reportParameters)
        {
            if (reportParameters.Months.Count() > 1)
            {
                return BadRequest("Too many months specified");
            }
            
            var reportData = _reportsProvider.PrepareBudgetBurndownReport(reportParameters.Months.FirstOrDefault());
            
            var result = BuildReportModel(reportData);

            return Ok(result);
        }

        [HttpGet, Route("totals")]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(ReportModel<decimal>))]
        public IActionResult GetTotals([FromQuery]ReportParameters reportParameters)
        {
            var reportData = _reportsProvider.PrepareTotalsReport(reportParameters.Months);
            
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