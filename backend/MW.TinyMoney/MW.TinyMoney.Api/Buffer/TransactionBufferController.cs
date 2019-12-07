using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using MW.TinyMoney.Api.Buffer.ApiModels;

namespace MW.TinyMoney.Api.Controllers
{
    [ApiController, Route("/api/transaction/buffer")]
    public class TransactionBufferController : ControllerBase
    {
        [HttpPost, Route("")]
        [ProducesResponseType((int)HttpStatusCode.Created, Type = typeof(BankStatementFileImportResult))]
        public async Task<IActionResult> PostFileToBuffer([FromForm]BankStatementFile bankStatementFile)
        {
            IBankStatementParser parser = new GetinPdfBankStatementParser();
            IBufferedTransactionStore bufferedTransactionStore = new MySqlBufferedTransactionStore();
            var parsingResult = parser.Parse(bankStatementFile.FileContent);
            bufferedTransactionStore.SaveTransactionsToBuffer(parsingResult);

            return Created("", new BankStatementFileImportResult()
            {
                NumberOfImportedTransactions = parsingResult.Count()
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
