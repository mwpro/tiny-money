using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MW.TinyMoney.Api.Buffer.ApiModels;
using MW.TinyMoney.Api.Controllers;
using MW.TinyMoney.Api.Tags;
using MW.TinyMoney.Api.Transaction.ApiModels;
using MW.TinyMoney.Api.Vendors;

namespace MW.TinyMoney.Api.Transaction
{
    [ApiController, Route("/api/transactions"), AllowAnonymous]// todo Authorize]
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
        public async Task<IActionResult> UpdateTransaction([FromRoute] int transactionId, [FromBody] ApiModels.Transaction transaction)
        {
            throw new NotImplementedException();
        }
        
        // @PostMapping(path = "/{id}")
        // public ResponseEntity<AddTransactionResultDto> editTransaction
        //         (@PathVariable("id") Integer transactionId,
        //          @Valid @RequestBody AddTransactionDto addTransactionDto,
        //          Principal principal) {
        //
        //     Optional<Transaction> transactionOption = transactionsRepository.findById(transactionId);
        //
        //     if (!transactionOption.isPresent()) {
        //         return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        //     }
        //
        //     Subcategory subcategory = subcategoriesRepository.findById(addTransactionDto.getSubcategoryId()).get();
        //
        //     Transaction transaction = transactionOption.get();
        //
        //     Vendor vendor;
        //     if (addTransactionDto.getVendor().getId() == null) {
        //         vendor = new Vendor();
        //         vendor.setName(addTransactionDto.getVendor().getName());
        //         vendor.setDefaultSubcategory(subcategory);
        //         vendorsRepository.save(vendor);
        //     } else {
        //         vendor = vendorsRepository.getOne(addTransactionDto.getVendor().getId());
        //     }
        //     transaction.setVendor(vendor);
        //
        //     transaction.setSubcategory(subcategory);
        //     transaction.setAmount(addTransactionDto.getAmount());
        //     transaction.setTransactionDate(addTransactionDto.getTransactionDate().plusDays(1)); // todo plusDays(1) hack for MySql issues
        //     transaction.setIsExpense(addTransactionDto.getIsExpense());
        //     transaction.setDescription(addTransactionDto.getDescription());
        //
        //     Set<Tag> newTagsToSave = new HashSet<>();
        //     transaction.getTags().forEach(t -> t.getTransactions().remove(transaction));
        //     transaction.getTags().clear();
        //     for (TagDto tagDto : addTransactionDto.getTags()) {
        //         Tag tag;
        //         if (tagDto.getId() == null) {
        //             // adding new tag
        //             tag = new Tag();
        //             tag.setName(tagDto.getName());
        //             newTagsToSave.add(tag);
        //         } else {
        //             // existing tag
        //             tag = tagsRepository.getOne(tagDto.getId());
        //         }
        //         tag.getTransactions().add(transaction);
        //         transaction.getTags().add(tag);
        //     }
        //
        //     transactionsRepository.save(transaction);
        //     tagsRepository.saveAll(newTagsToSave);
        //
        //     AddTransactionResultDto result = new AddTransactionResultDto();
        //     result.setAddedTags(newTagsToSave.stream().map(t -> mapToDto(t)).collect(Collectors.toSet()));
        //     transaction.setTransactionDate(transaction.getTransactionDate().minusDays(1)); // todo .minusDays(1) hack for MySql issues
        //     result.setTransaction(transaction);
        //
        //     return new ResponseEntity<>(result, HttpStatus.OK);
        // }
        //
        // private TagDto mapToDto(Tag t) {
        //     TagDto tagDto = new TagDto();
        //     tagDto.setId(t.getId());
        //     tagDto.setName(t.getName());
        //     return tagDto;
        // }
        
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
        public async Task<IActionResult> DeleteTransactions([FromRoute] int transactionId)
        {
            throw new NotImplementedException();
        }
        
        // @DeleteMapping(path = "/{id}")
        // public ResponseEntity deleteTransaction(@PathVariable("id") Integer transactionId) {
        //     Transaction transaction = transactionsRepository.getOne(transactionId);
        //     if (transaction == null){
        //         return new ResponseEntity(HttpStatus.NOT_FOUND);
        //     }
        //     transaction.getTags().forEach(t -> t.getTransactions().remove(transaction));
        //     transaction.getTags().clear();
        //     transactionsRepository.delete(transaction);
        //     return new ResponseEntity(HttpStatus.OK);
        // }
    }
}