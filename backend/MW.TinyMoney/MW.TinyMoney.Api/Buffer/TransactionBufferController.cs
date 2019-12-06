using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using MW.TinyMoney.Api.Buffer.ApiModels;

namespace MW.TinyMoney.Api.Controllers
{
    //public class BufferedTransaction
    //{
    //    public int Id { get; set; }
    //    public decimal Amount { get; set; }
    //    public DateTime ImportDate { get; set; }
    //    public DateTime TransactionDate { get; set; }
    //    // public int? MatchedVendorId { get; private set; }
    //    // public int? MatchedSubcategoryId { get; private set; }
    //    public string RawBankStatementDescription { get; set; }
    //}

    //public interface IBankStatementParser
    //{
        
    //}

    [ApiController, Route("/api/transaction/buffer")]
    public class TransactionBufferController : ControllerBase
    {
        [HttpPost, Route("")]
        [ProducesResponseType((int)HttpStatusCode.Created, Type = typeof(BankStatementFileImportResult))]
        public async Task<IActionResult> PostFileToBuffer([FromForm]BankStatementFile bankStatementFile)
        {
            return Created("", new BankStatementFileImportResult()
            {
                NumberOfImportedTransactions = 10
            });
        }

        [HttpGet, Route("")]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(IEnumerable<BufferedTransaction>))]
        public async Task<IActionResult> GetBufferedTransactions()
        {
            return Ok(new List<BufferedTransaction>()
            {
                new BufferedTransaction(),
                new BufferedTransaction(),
                new BufferedTransaction(),
                new BufferedTransaction(),
                new BufferedTransaction()
            });
        }

        [HttpPost, Route("{id}")]
        [ProducesResponseType((int)HttpStatusCode.Accepted)]
        public async Task<IActionResult> AcceptBufferedTransaction([FromRoute]int id, [FromBody]BufferedTransactionApproval approval)
        {
            return Ok();
        }

        [HttpDelete, Route("{id}")]
        [ProducesResponseType((int)HttpStatusCode.Accepted)]
        public async Task<IActionResult> RejectBufferedTransaction([FromRoute]int id)
        {
            return Ok();
        }
    }
}
