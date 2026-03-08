using System;
using System.Collections.Generic;
using MW.TinyMoney.Api.Import;
using MW.TinyMoney.Api.Transaction.ApiModels;

namespace MW.TinyMoney.UnitTests.Helpers;

public static class TransactionsHelper
{
    public static Transaction PrepareTransaction(
        int vendorId = 1234,
        int subcategoryId = 4321,
        bool isVerified = false,
        string createdBy = TransactionPlaceholders.CreatedByImport,
        string description = "some description") =>
        new()
        {
            Id = 1,
            Amount = 10,
            IsExpense = true,
            TransactionDate = DateTime.UtcNow,
            Description = description,
            VendorId = vendorId,
            SubcategoryId = subcategoryId,
            IsVerified = isVerified,
            IsPossibleDuplicate = true,
            CreatedDate = DateTime.UtcNow,
            CreatedBy = createdBy,
            ModifiedDate = DateTime.UtcNow,
            TagIds = new List<int>()
        };
}