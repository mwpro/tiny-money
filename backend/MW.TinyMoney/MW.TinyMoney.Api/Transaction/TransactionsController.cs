using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MW.TinyMoney.Api.Tags;
using MW.TinyMoney.Api.Transaction.ApiModels;
using MW.TinyMoney.Api.Vendors;

namespace MW.TinyMoney.Api.Transaction
{
    [ApiController, Route("/api/transactions"), Authorize]
    public class TransactionsController : Controller
    {
        private readonly ITransactionStore _transactionStore;
        private readonly IVendorStore _vendorStore;
        private readonly ITagStore _tagStore;

        public TransactionsController(ITransactionStore transactionStore, IVendorStore vendorStore, ITagStore tagStore)
        {
            _transactionStore = transactionStore;
            _vendorStore = vendorStore;
            _tagStore = tagStore;
        }

        [HttpGet("")]
        public async Task<IActionResult> GetTransactions(DateTime month)
        {
            var transactions = await _transactionStore.GetTransactions(month);
            return Ok(transactions);
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
                _vendorStore.SaveVendor(vendor);
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
                _tagStore.SaveTag(tag);
                newTag.Id = tag.Id;

                response.NewTags.Add(newTag);
            }

            transaction.Amount = updatedTransaction.Amount;
            transaction.Description = updatedTransaction.Description;
            transaction.ModifiedDate = DateTime.UtcNow;
            transaction.SubcategoryId = updatedTransaction.SubcategoryId;
            transaction.TagIds = updatedTransaction.Tags.Select(x => x.Id.Value).ToList();
            transaction.TransactionDate = updatedTransaction.TransactionDate;
            transaction.VendorId = updatedTransaction.Vendor.Id.Value;
            
            await _transactionStore.UpdateTransaction(transaction);

            response.Transaction = transaction;

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
                _vendorStore.SaveVendor(vendor);
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
                _tagStore.SaveTag(tag);
                newTag.Id = tag.Id;

                response.NewTags.Add(newTag);
            }

            var createdTransaction = new ApiModels.Transaction()
            {
                Amount = addTransactionDto.Amount,
                CreatedDate = DateTime.UtcNow,
                CreatedBy = "API",
                Description = addTransactionDto.Description,
                IsExpense = true,
                ModifiedDate = DateTime.UtcNow,
                SubcategoryId = addTransactionDto.SubcategoryId,
                TagIds = addTransactionDto.Tags.Select(x => x.Id.Value).ToList(),
                TransactionDate = addTransactionDto.TransactionDate,
                VendorId = addTransactionDto.Vendor.Id.Value
            };
            _transactionStore.SaveTransaction(createdTransaction);

            response.Transaction = createdTransaction;

            return Ok(response);
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
    }
}