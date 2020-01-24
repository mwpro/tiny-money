using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MW.TinyMoney.Api.Buffer.ApiModels;
using MW.TinyMoney.Api.Tags;
using MW.TinyMoney.Api.Vendors;

namespace MW.TinyMoney.Api.Controllers
{
    [ApiController, Route("/api/transaction/buffer"), Authorize]
    public class TransactionBufferController : ControllerBase
    {
        private readonly IBufferedTransactionStore _bufferedTransactionStore;
        private readonly ITransactionStore _transactionStore;
        private readonly IVendorStore _vendorStore;
        private readonly ITagStore _tagStore;

        public TransactionBufferController(IBufferedTransactionStore bufferedTransactionStore,
            ITransactionStore transactionStore, IVendorStore vendorStore, ITagStore tagStore)
        {
            _bufferedTransactionStore = bufferedTransactionStore;
            _transactionStore = transactionStore;
            _vendorStore = vendorStore;
            _tagStore = tagStore;
        }

        [HttpPost, Route("")]
        [ProducesResponseType((int)HttpStatusCode.Created, Type = typeof(BankStatementFileImportResult))]
        public async Task<IActionResult> PostFileToBuffer([FromForm]BankStatementFile bankStatementFile)
        {
            IBankStatementParser parser = new GetinPdfBankStatementParser();
            var parsingResult = parser.Parse(bankStatementFile.FileContent);
            _bufferedTransactionStore.SaveTransactionsToBuffer(parsingResult);

            return Created("", new BankStatementFileImportResult()
            {
                NumberOfImportedTransactions = parsingResult.Count()
            });
        }

        [HttpGet, Route("")]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(IEnumerable<BufferedTransaction>))]
        public async Task<IActionResult> GetBufferedTransactions()
        {
            return Ok(_bufferedTransactionStore.GetBufferedTransactions());
        }

        [HttpPost, Route("{id}")]
        [ProducesResponseType((int)HttpStatusCode.Accepted)]
        public async Task<IActionResult> AcceptBufferedTransaction([FromRoute]int id, [FromBody]BufferedTransactionApproval approval)
        {
            // TODO validation, should be a single transaction scope
            var bufferedTransaction = _bufferedTransactionStore.GetBufferedTransaction(id);
            if (bufferedTransaction == null)
                return NotFound();
            
            if (approval.Vendor.Id == null) // todo to be moved
            {
                var vendor = new Vendor()
                {
                    Name = approval.Vendor.Name,
                    DefaultSubcategoryId = approval.SubcategoryId
                };
                _vendorStore.SaveVendor(vendor);
                approval.Vendor.Id = vendor.Id;
            }

            foreach (var newTag in approval.Tags.Where(x => x.Id is null))
            {
                var tag = new Tag()
                {
                    Name = newTag.Name,
                };
                _tagStore.SaveTag(tag);
                newTag.Id = tag.Id;
            }

            var approvedTransaction = bufferedTransaction.Approve(approval);

            _transactionStore.SaveTransaction(approvedTransaction);

            _bufferedTransactionStore.DeleteBufferedTransaction(id);

            return Ok(approvedTransaction);
        }

        [HttpDelete, Route("{id}")]
        [ProducesResponseType((int)HttpStatusCode.Accepted)]
        public async Task<IActionResult> RejectBufferedTransaction([FromRoute]int id)
        {
            var bufferedTransaction = _bufferedTransactionStore.GetBufferedTransaction(id);
            if (bufferedTransaction == null)
                return NotFound();

            _bufferedTransactionStore.DeleteBufferedTransaction(id);

            return Ok();
        }
    }
}
