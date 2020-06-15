using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MW.TinyMoney.Api.Controllers;

namespace MW.TinyMoney.Api.Transaction
{
    [ApiController, Route("/api/transactions"), AllowAnonymous]// todo Authorize]
    public class TransactionsController : Controller
    {
        private readonly ITransactionStore _transactionStore;

        public TransactionsController(ITransactionStore transactionStore)
        {
            _transactionStore = transactionStore;
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
        public async Task<IActionResult> AddTransaction([FromBody] ApiModels.Transaction transaction)
        {
            throw new NotImplementedException();
        }
        
        // @PostMapping(path = "")
        // @ResponseBody
        // public ResponseEntity<AddTransactionResultDto> addTransaction(@Valid @RequestBody AddTransactionDto addTransactionDto,
        //                                                               Principal principal) {
        //     Transaction transaction = new Transaction();
        //     Subcategory subcategory = subcategoriesRepository.findById(addTransactionDto.getSubcategoryId()).get();
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
        //     transaction.setCreatedBy(principal.getName());
        //     transaction.setDescription(addTransactionDto.getDescription());
        //
        //     Set<Tag> newTagsToSave = new HashSet<>();
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
        //     return new ResponseEntity<>(result, HttpStatus.CREATED);
        // }
        
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