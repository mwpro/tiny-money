using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Dapper;
using MW.TinyMoney.Api.Infrastructure;
using MW.TinyMoney.Api.Tags.ApiModels;

namespace MW.TinyMoney.Api.Transaction
{
    public interface ITransactionStore
    {
        void SaveTransaction(Transaction.ApiModels.Transaction transaction);
        Task SaveTransactionsBatch(IReadOnlyList<Transaction.ApiModels.Transaction> transactions);
        Task UpdateTransaction(Transaction.ApiModels.Transaction transaction);
        Task<Transaction.ApiModels.Transaction> GetTransaction(int transactionId);
        Task<IReadOnlyCollection<ApiModels.Transaction>> GetTransactions(DateTime? dateFrom, DateTime? dateTo,
            bool? isExpense, decimal? amountFrom, decimal? amountTo, int? vendorId, int? subcategoryId, int? tagId,
            bool? isVerified);
        Task DeleteTransaction(Transaction.ApiModels.Transaction transaction);
        Task DeleteTransactions(IReadOnlyList<int> transactionIds);
    }

    public class MySqlTransactionStore : ITransactionStore
    {
        private readonly MySqlConnectionFactory _mySqlConnectionFactory;

        private const int TransactionsLimit = 1000;

        public MySqlTransactionStore(MySqlConnectionFactory mySqlConnectionFactory)
        {
            _mySqlConnectionFactory = mySqlConnectionFactory;
        }

        private const string SaveTransactionQuery =
            @"INSERT INTO transaction (amount, created_by, created_date, description, is_expense, modified_date, transaction_date, subcategory_id, vendor_id, is_verified, is_possible_duplicate)
                VALUES(@amount, @createdBy, @createdDate, @description, @isExpense, @modifiedDate, @transactionDate, @subcategoryId, @vendorId, @isVerified, @isPossibleDuplicate);
                SELECT LAST_INSERT_ID();";

        private const string UpdateTransactionQuery =
            @"UPDATE transaction SET
                amount = @amount,
                created_by = @createdBy,
                created_date = @createdDate,
                description = @description,
                is_expense = @isExpense,
                modified_date = @modifiedDate,
                transaction_date = @transactionDate,
                subcategory_id = @subcategoryId,
                vendor_id = @vendorId,
                is_verified = @isVerified,
                is_possible_duplicate = @isPossibleDuplicate
                WHERE id = @id;";

        private const string DeleteTransactionTags =
            "DELETE FROM transaction_tag WHERE transaction_id = @transactionId;";

        private const string SaveTransactionTags =
            @"INSERT INTO transaction_tag (transaction_id, tag_id)
                VALUES(@transactionId, @tagId)";

        private const string GetTransactionsByIdQuery =
            @"SELECT
                t.id,
                t.amount,
                t.created_date AS 'createdDate',
                t.description,
                t.created_by AS 'createdBy',
                t.is_expense AS 'isExpense',
                t.modified_date AS 'modifiedDate',
                t.transaction_date AS 'transactionDate',
                t.vendor_id AS 'vendorId',
                v.name AS 'vendorName',
                t.subcategory_id AS 'subcategoryId',
                s.name AS 'subcategoryName',
                c.name AS 'categoryName',
                t.is_verified AS 'isVerified',
                t.is_possible_duplicate AS 'isPossibleDuplicate',
                tt.tag_id AS 'tagId',
                tag.name AS 'tagName'
            FROM transaction t
            LEFT JOIN transaction_tag tt on t.id = tt.transaction_id
            LEFT JOIN tag ON tt.tag_id = tag.id
            LEFT JOIN subcategory s ON t.subcategory_id = s.id
            LEFT JOIN category c ON s.parent_category_id = c.id
            LEFT JOIN vendor v ON t.vendor_id = v.id
            WHERE t.id = @transactionId";

        private const string GetTransactionsQuery =
            @"SELECT
                t.id,
                t.amount,
                t.created_date AS 'createdDate',
                t.description,
                t.created_by AS 'createdBy',
                t.is_expense AS 'isExpense',
                t.modified_date AS 'modifiedDate',
                t.transaction_date AS 'transactionDate',
                t.vendor_id AS 'vendorId',
                v.name AS 'vendorName',
                t.subcategory_id AS 'subcategoryId',
                s.name AS 'subcategoryName',
                c.name AS 'categoryName',
                t.is_verified AS 'isVerified',
                t.is_possible_duplicate AS 'isPossibleDuplicate'
            FROM transaction t
            LEFT JOIN subcategory s ON t.subcategory_id = s.id
            LEFT JOIN category c ON s.parent_category_id = c.id
            LEFT JOIN vendor v ON t.vendor_id = v.id
            WHERE
                (@dateFrom IS NULL OR t.transaction_date >= @dateFrom)
                AND (@dateTo IS NULL OR t.transaction_date <= @dateTo)
                AND (@isExpense IS NULL OR t.is_expense = @isExpense)
                AND (@amountFrom IS NULL OR t.amount >= @amountFrom)
                AND (@amountTo IS NULL OR t.amount <= @amountTo)
                AND (@vendorId IS NULL OR t.vendor_id = @vendorId)
                AND (@subcategoryId IS NULL OR t.subcategory_id = @subcategoryId)
                AND (@tagId IS NULL OR EXISTS(SELECT 1 FROM transaction_tag tte WHERE tte.transaction_id = t.id AND tte.tag_id = @tagId))
                AND (@isVerified IS NULL OR t.is_verified = @isVerified)
            ORDER BY t.transaction_date
            LIMIT @transactionsLimit";

        private const string DeleteTransactionQuery =
            @"DELETE FROM transaction_tag WHERE transaction_id = @transactionId;
              DELETE FROM transaction WHERE id = @transactionId;";

        private const string DeleteTransactionsBulkQuery =
            @"DELETE FROM transaction_tag WHERE transaction_id IN @transactionIds;
              DELETE FROM transaction WHERE id IN @transactionIds;";

        private const string GetTagsForTransactions =
            @"SELECT tt.transaction_id AS transactionId, tt.tag_id AS tagId, t.name AS tagName
              FROM transaction_tag tt
              JOIN tag t ON tt.tag_id = t.id
              WHERE tt.transaction_id in @transactionIds";


        public void SaveTransaction(Transaction.ApiModels.Transaction transaction)
        {
            using (var connection = _mySqlConnectionFactory.CreateConnection())
            {
                connection.Open();
                using (var dbTransaction = connection.BeginTransaction())
                {
                    transaction.Id = connection.QuerySingle<int>(SaveTransactionQuery, transaction, dbTransaction);

                    connection.Execute(SaveTransactionTags,
                        transaction.Tags.Select(x => new {transactionId = transaction.Id, tagId = x.Id}), dbTransaction);

                    dbTransaction.Commit();
                }
            }
        }

        public async Task SaveTransactionsBatch(IReadOnlyList<Transaction.ApiModels.Transaction> transactions)
        {
            if (transactions.Count == 0) return;

            var sql = new StringBuilder();
            sql.Append("INSERT INTO transaction (amount, created_by, created_date, description, is_expense, modified_date, transaction_date, subcategory_id, vendor_id, is_verified, is_possible_duplicate) VALUES ");

            var parameters = new DynamicParameters();
            for (var i = 0; i < transactions.Count; i++)
            {
                if (i > 0) sql.Append(", ");
                sql.Append($"(@amount{i}, @createdBy{i}, @createdDate{i}, @description{i}, @isExpense{i}, @modifiedDate{i}, @transactionDate{i}, @subcategoryId{i}, @vendorId{i}, @isVerified{i}, @isPossibleDuplicate{i})");
                var t = transactions[i];
                parameters.Add($"amount{i}", t.Amount);
                parameters.Add($"createdBy{i}", t.CreatedBy);
                parameters.Add($"createdDate{i}", t.CreatedDate);
                parameters.Add($"description{i}", t.Description);
                parameters.Add($"isExpense{i}", t.IsExpense);
                parameters.Add($"modifiedDate{i}", t.ModifiedDate);
                parameters.Add($"transactionDate{i}", t.TransactionDate);
                parameters.Add($"subcategoryId{i}", t.SubcategoryId);
                parameters.Add($"vendorId{i}", t.VendorId);
                parameters.Add($"isVerified{i}", t.IsVerified);
                parameters.Add($"isPossibleDuplicate{i}", t.IsPossibleDuplicate);
            }
            sql.Append(";");

            using var connection = _mySqlConnectionFactory.CreateConnection();
            await connection.OpenAsync();
            await connection.ExecuteAsync(sql.ToString(), parameters);
        }

        public async Task UpdateTransaction(ApiModels.Transaction transaction)
        {
            using (var connection = _mySqlConnectionFactory.CreateConnection())
            {
                connection.Open();
                await using (var dbTransaction = await connection.BeginTransactionAsync())
                {
                    await connection.ExecuteAsync(UpdateTransactionQuery, transaction, dbTransaction);

                    await connection.ExecuteAsync(DeleteTransactionTags, new {transactionId = transaction.Id}, dbTransaction);

                    await connection.ExecuteAsync(SaveTransactionTags,
                        transaction.Tags.Select(x => new {transactionId = transaction.Id, tagId = x.Id}), dbTransaction);

                    await dbTransaction.CommitAsync();
                }
            }
        }

        private record TransactionTagRow(int? TagId, string TagName);

        public async Task<Transaction.ApiModels.Transaction> GetTransaction(int transactionId)
        {
            using (var connection = _mySqlConnectionFactory.CreateConnection())
            {
                connection.Open();

                Transaction.ApiModels.Transaction result = null;
                var tagRows = new List<TagDto>();
                await connection.QueryAsync<Transaction.ApiModels.Transaction, TransactionTagRow, Transaction.ApiModels.Transaction>(
                    GetTransactionsByIdQuery,
                    (transaction, tagRow) =>
                    {
                        if (result == null)
                            result = transaction;

                        if (tagRow?.TagId.HasValue == true)
                            tagRows.Add(new TagDto { Id = tagRow.TagId.Value, Name = tagRow.TagName });

                        return result;
                    }, new
                    {
                        transactionId
                    }, splitOn: "tagId");

                result.Tags = tagRows;
                return result;
            }
        }

        public async Task<IReadOnlyCollection<ApiModels.Transaction>> GetTransactions(DateTime? dateFrom,
            DateTime? dateTo, bool? isExpense, decimal? amountFrom, decimal? amountTo, int? vendorId, int? subcategoryId, int? tagId,
            bool? isVerified)
        {
            using (var connection = _mySqlConnectionFactory.CreateConnection())
            {
                connection.Open();

                var transactions = (await connection.QueryAsync<Transaction.ApiModels.Transaction>(
                    GetTransactionsQuery, new
                    {
                        dateFrom, dateTo,
                        isExpense = isExpense,
                        amountFrom = amountFrom,
                        amountTo = amountTo,
                        vendorId = vendorId,
                        subcategoryId = subcategoryId,
                        tagId = tagId,
                        isVerified = isVerified,
                        TransactionsLimit
                    })).ToList();

                var transactionsTags = (await connection.QueryAsync<(int transactionId, int tagId, string tagName)>(
                    GetTagsForTransactions, new
                    {
                        transactionIds = transactions.Select(t => t.Id)
                    })).ToList();

                foreach (var transaction in transactions)
                {
                    var txTags = transactionsTags.Where(t => t.transactionId == transaction.Id).ToList();
                    transaction.Tags = txTags.Select(t => new TagDto { Id = t.tagId, Name = t.tagName }).ToList();
                }

                return transactions;
            }
        }

        public async Task DeleteTransaction(ApiModels.Transaction transaction)
        {
            using (var connection = _mySqlConnectionFactory.CreateConnection())
            {
                await connection.ExecuteAsync(DeleteTransactionQuery, new {transactionId = transaction.Id});
            }
        }

        public async Task DeleteTransactions(IReadOnlyList<int> transactionIds)
        {
            await using var connection = _mySqlConnectionFactory.CreateConnection();
            await connection.ExecuteAsync(DeleteTransactionsBulkQuery, new {transactionIds});
        }
    }
}
