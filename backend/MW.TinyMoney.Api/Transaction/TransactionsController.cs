using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using MW.TinyMoney.Api.Import;
using MW.TinyMoney.Api.Tags;
using MW.TinyMoney.Api.Transaction.ApiModels;
using MW.TinyMoney.Api.Vendors;
using MW.TinyMoney.Api.Vendors.Matching;

namespace MW.TinyMoney.Api.Transaction
{
    [ApiController, Route("/api/transactions"), Authorize]
    public class TransactionsController : Controller
    {
        private readonly ITransactionStore _transactionStore;
        private readonly IVendorStore _vendorStore;
        private readonly ITagStore _tagStore;
        private readonly IVendorMatchingService _vendorMatchingService;

        public TransactionsController(ITransactionStore transactionStore, IVendorStore vendorStore, ITagStore tagStore, IVendorMatchingService vendorMatchingService)
        {
            _transactionStore = transactionStore;
            _vendorStore = vendorStore;
            _tagStore = tagStore;
            _vendorMatchingService = vendorMatchingService;
        }

        [HttpGet("")]
        [ProducesResponseType(typeof(TransactionsResponse), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetTransactions([FromQuery]DateTime? dateFrom, [FromQuery]DateTime? dateTo,
            [FromQuery] bool? isExpense, [FromQuery] decimal? amountFrom, [FromQuery] decimal? amountTo, [FromQuery] int? vendorId, [FromQuery] int? subcategoryId,
            [FromQuery] int? tagId, [FromQuery] bool? isVerified)
        {
            if ((!dateFrom.HasValue || !dateTo.HasValue) && !amountFrom.HasValue && !amountTo.HasValue && !vendorId.HasValue && !subcategoryId.HasValue && !tagId.HasValue && !isVerified.HasValue)
            {
                return BadRequest("Dates must be provided when no other filters were specified");
            }
            
            var transactions = await _transactionStore.GetTransactions(
                dateFrom, dateTo, isExpense, amountFrom, amountTo,
                vendorId, subcategoryId, tagId, isVerified);
            
            return Ok(new TransactionsResponse
            {
                Transactions = transactions,
                Summary = new TransactionsSummary()
                {
                    IncomesTotal = transactions.Where(t => !t.IsExpense).Sum(t => t.Amount),
                    IncomesCount = transactions.Count(t => !t.IsExpense),
                    ExpensesTotal = transactions.Where(t => t.IsExpense).Sum(t => t.Amount),
                    ExpensesCount = transactions.Count(t => t.IsExpense)
                }
            });
        }
        
        [HttpGet("{transactionId}")]
        public async Task<IActionResult> GetTransaction([FromRoute] int transactionId)
        {
            var transaction = await _transactionStore.GetTransaction(transactionId);

            if (transaction == null)
            {
                return NotFound();
            }

            return Ok(transaction);
        }
        
        [HttpPost("{transactionId}")]
        public async Task<IActionResult> UpdateTransaction([FromRoute] int transactionId, [FromBody] AddTransactionDto updatedTransaction)
        {
            var transaction = await _transactionStore.GetTransaction(transactionId);
            if (transaction == null)
            {
                return NotFound();
            }
            
            var response = new AddTransactionResponse();
            if (updatedTransaction.Vendor.Id == null) // todo to be moved
            {
                var vendor = new Vendor()
                {
                    Name = updatedTransaction.Vendor.Name,
                    DefaultSubcategoryId = updatedTransaction.SubcategoryId
                };
                await _vendorStore.SaveVendor(vendor);
                updatedTransaction.Vendor.Id = vendor.Id;
                updatedTransaction.Vendor.DefaultSubcategoryId = updatedTransaction.SubcategoryId;
                response.NewVendor = updatedTransaction.Vendor;
            }

            foreach (var newTag in updatedTransaction.Tags.Where(x => x.Id is null))
            {
                var tag = new Tag()
                {
                    Name = newTag.Name,
                };
                await _tagStore.SaveTag(tag);
                newTag.Id = tag.Id;

                response.NewTags.Add(newTag);
            }

            var vendorChanged = transaction.VendorId != updatedTransaction.Vendor.Id.Value;
            var isImportedTransaction = string.Equals(transaction.CreatedBy, TransactionPlaceholders.CreatedByImport,
                StringComparison.OrdinalIgnoreCase);
            var wasVerified = transaction.IsVerified;
            var autoVerify = isImportedTransaction && !wasVerified;
            if (autoVerify)
            {
                transaction.IsVerified = true;
                transaction.IsPossibleDuplicate = false;
            }

            transaction.Amount = updatedTransaction.Amount;
            transaction.IsExpense = updatedTransaction.IsExpense;
            transaction.Description = updatedTransaction.Description;
            transaction.ModifiedDate = DateTime.UtcNow;
            transaction.SubcategoryId = updatedTransaction.SubcategoryId;
            transaction.TagIds = updatedTransaction.Tags.Select(x => x.Id.Value).ToList();
            transaction.TransactionDate = updatedTransaction.TransactionDate;
            transaction.VendorId = updatedTransaction.Vendor.Id.Value;

            await _transactionStore.UpdateTransaction(transaction);

            response.Transaction = transaction;

            if (vendorChanged)
            {
                response.SuggestedAlias = await TrySuggestAlias(transaction, wasVerified);
            }

            return Ok(response);
        }

        [HttpPost("")]
        public async Task<IActionResult> AddTransaction([FromBody] AddTransactionDto addTransactionDto)
        {
            // TODO validation, should be a single transaction scope
            var response = new AddTransactionResponse();
            if (addTransactionDto.Vendor.Id == null) // todo to be moved
            {
                var vendor = new Vendor()
                {
                    Name = addTransactionDto.Vendor.Name,
                    DefaultSubcategoryId = addTransactionDto.SubcategoryId
                };
                await _vendorStore.SaveVendor(vendor);
                addTransactionDto.Vendor.Id = vendor.Id;
                addTransactionDto.Vendor.DefaultSubcategoryId = addTransactionDto.SubcategoryId;
                response.NewVendor = addTransactionDto.Vendor;
            }

            foreach (var newTag in addTransactionDto.Tags.Where(x => x.Id is null))
            {
                var tag = new Tag()
                {
                    Name = newTag.Name,
                };
                await _tagStore.SaveTag(tag);
                newTag.Id = tag.Id;

                response.NewTags.Add(newTag);
            }

            var createdTransaction = new ApiModels.Transaction()
            {
                Amount = addTransactionDto.Amount,
                CreatedDate = DateTime.UtcNow,
                CreatedBy = TransactionPlaceholders.CreatedByApi,
                Description = addTransactionDto.Description,
                IsExpense = addTransactionDto.IsExpense,
                ModifiedDate = DateTime.UtcNow,
                SubcategoryId = addTransactionDto.SubcategoryId,
                TagIds = addTransactionDto.Tags.Select(x => x.Id.Value).ToList(),
                TransactionDate = addTransactionDto.TransactionDate,
                VendorId = addTransactionDto.Vendor.Id.Value,
                IsVerified = true,
                IsPossibleDuplicate = false
            };
            _transactionStore.SaveTransaction(createdTransaction);

            response.Transaction = createdTransaction;

            return StatusCode(StatusCodes.Status201Created, response);
        }
        
        [HttpDelete("{transactionId}")]
        public async Task<IActionResult> DeleteTransaction([FromRoute] int transactionId)
        {
            var transaction = await _transactionStore.GetTransaction(transactionId);

            if (transaction == null)
            {
                return NotFound();
            }

            await _transactionStore.DeleteTransaction(transaction);

            return Ok();
        }

        [HttpPost("{transactionId}/verify")]
        public async Task<IActionResult> VerifyTransaction([FromRoute] int transactionId)
        {
            var transaction = await _transactionStore.GetTransaction(transactionId);
            if (transaction == null)
            {
                return NotFound();
            }

            if (transaction.IsVerified)
            {
                return BadRequest("Transaction is already verified.");
            }
            if (transaction.VendorId == null)
            {
                return BadRequest("Cannot verify a transaction with an unknown vendor.");
            }
            if (transaction.SubcategoryId == null)
            {
                return BadRequest("Cannot verify a transaction with an uncategorized subcategory.");
            }

            var wasVerified = transaction.IsVerified;
            transaction.IsVerified = true;
            transaction.IsPossibleDuplicate = false;
            transaction.ModifiedDate = DateTime.UtcNow;

            await _transactionStore.UpdateTransaction(transaction);

            return Ok(new AddTransactionResponse
            {
                Transaction = transaction,
                SuggestedAlias = await TrySuggestAlias(transaction, wasVerified)
            });
        }

        [HttpDelete]
        public async Task<IActionResult> DeleteTransactions([FromBody] IReadOnlyList<int> transactionIds)
        {
            if (transactionIds == null || transactionIds.Count == 0)
                return BadRequest();

            await _transactionStore.DeleteTransactions(transactionIds);
            return Ok();
        }

        private async Task<SuggestedAliasDto> TrySuggestAlias(ApiModels.Transaction transaction, bool wasVerified)
        {
            var becameVerified = !wasVerified && transaction.IsVerified;
            var isImportedTransaction = string.Equals(transaction.CreatedBy, TransactionPlaceholders.CreatedByImport, StringComparison.OrdinalIgnoreCase);

            if (becameVerified
                && isImportedTransaction
                && transaction.VendorId != null
                && !string.IsNullOrWhiteSpace(transaction.Description))
            {
                var alias = await _vendorMatchingService.SuggestAlias(transaction.VendorId.Value, transaction.Description);
                return alias != null ? new SuggestedAliasDto(alias, transaction.VendorId.Value) : null;
            }
            return null;
        }
    }
}