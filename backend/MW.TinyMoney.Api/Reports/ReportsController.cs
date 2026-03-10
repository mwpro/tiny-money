using System.ComponentModel.DataAnnotations;
using System.Net;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MW.TinyMoney.Api.Reports
{
    [ApiController, Route("/api/reports"), Authorize]
    public class ReportsController : ControllerBase
    {
        [HttpGet("summary-report")]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(SummaryReportModel))]
        public async Task<IActionResult> GetSummaryReport([FromServices] ISummaryReport summaryReport, [FromQuery] System.DateTime? dateFrom, [FromQuery] System.DateTime? dateTo, [FromQuery] bool splitByMonth)
        {
            var reportData = await summaryReport.Prepare(dateFrom, dateTo, splitByMonth);
            return Ok(reportData);
        }

        [HttpGet("top-list-report")]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(TopListReportModel))]
        public async Task<IActionResult> GetToplistReport([FromServices] ITopListReport topListReport, [FromQuery] System.DateTime? dateFrom, [FromQuery] System.DateTime? dateTo, [Required, Range(1, 200)] int numberOfTopEntries)
        {
            var reportData = await topListReport.Prepare(dateFrom, dateTo, numberOfTopEntries);
            return Ok(reportData);
        }

        [HttpGet("sankey-report")]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(SankeyReportModel))]
        public async Task<IActionResult> GetSankeyReport([FromServices] ISankeyReport sankeyReport, [FromQuery] System.DateTime? dateFrom, [FromQuery] System.DateTime? dateTo)
        {
            var reportData = await sankeyReport.Prepare(dateFrom, dateTo);
            return Ok(reportData);
        }
    }
}