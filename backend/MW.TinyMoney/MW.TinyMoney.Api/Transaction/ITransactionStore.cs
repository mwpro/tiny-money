using System;
using System.Collections.Generic;
using Dapper;
using MW.TinyMoney.Api.Infrasatructure;
using System.Linq;
using System.Threading.Tasks;

namespace MW.TinyMoney.Api.Controllers
{
    public interface ITransactionStore
    {
        void SaveTransaction(Transaction.ApiModels.Transaction transaction);
        Task<Transaction.ApiModels.Transaction> GetTransaction(int transactionId);
        IEnumerable<Transaction.ApiModels.Transaction> GetTopTransactions(IEnumerable<DateTime> reportParametersMonths);
        Task<IEnumerable<Transaction.ApiModels.Transaction>> GetTransactions(DateTime month);
    }

    public class MySqlTransactionStore : ITransactionStore
    {
        private readonly MySqlConnectionFactory _mySqlConnectionFactory;

        public MySqlTransactionStore(MySqlConnectionFactory mySqlConnectionFactory)
        {
            _mySqlConnectionFactory = mySqlConnectionFactory;
        }

        private const string SaveTransactionQuery =
            @"INSERT INTO transaction (amount, created_by, created_date, description, is_expense, modified_date, transaction_date, subcategory_id, vendor_id)
                VALUES(@amount, @createdBy, @createdDate, @description, @isExpense, @modifiedDate, @transactionDate, @subcategoryId, @vendorId);
                SELECT LAST_INSERT_ID();";

        private const string SaveTransactionTag =
            @"INSERT INTO transaction_tag (transaction_id, tag_id)
                VALUES(@transactionId, @tagId)";

        private const string GetTopTransactionsQuery =
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
                t.subcategory_id AS 'subcategoryId'
                # todo tags
            FROM transaction t
            WHERE DATE_FORMAT(transaction_date, '%Y-%m') IN @months
            ORDER BY amount DESC
            LIMIT 50";

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
                t.subcategory_id AS 'subcategoryId',
                tt.tag_id AS 'tagId'
            FROM transaction t
            LEFT JOIN transaction_tag tt on t.id = tt.transaction_id
            WHERE t.id = @transactionId";

        private const string GetTransactionsByMonthQuery =
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
                t.subcategory_id AS 'subcategoryId',
                tt.tag_id AS 'tagId'
            FROM transaction t
            LEFT JOIN transaction_tag tt on t.id = tt.transaction_id
            WHERE DATE_FORMAT(transaction_date, '%Y-%m') = @month";

        public void SaveTransaction(Transaction.ApiModels.Transaction transaction)
        {
            using (var connection = _mySqlConnectionFactory.CreateConnection())
            {
                connection.Open();
                using (var dbTransaction = connection.BeginTransaction())
                {
                    transaction.Id = connection.QuerySingle<int>(SaveTransactionQuery, transaction, dbTransaction);

                    connection.Execute(SaveTransactionTag,
                        transaction.TagIds.Select(x => new {transactionId = transaction.Id, tagId = x}), dbTransaction);

                    dbTransaction.Commit();
                }
            }
        }

        public async Task<Transaction.ApiModels.Transaction> GetTransaction(int transactionId)
        {
            using (var connection = _mySqlConnectionFactory.CreateConnection())
            {
                connection.Open();

                Transaction.ApiModels.Transaction result = null;
                var tagsIds = new List<int>();
                await connection.QueryAsync<Transaction.ApiModels.Transaction, int?, Transaction.ApiModels.Transaction>(
                    GetTransactionsByIdQuery,
                    (transaction, tagId) =>
                    {
                        if (result == null)
                        {
                            result = transaction;
                            transaction.TagIds = new List<int>();
                        }

                        if (tagId.HasValue)
                        {
                            tagsIds.Add(tagId.Value);                            
                        }
                        
                        return result;
                    }, new
                    {
                        transactionId
                    }, splitOn: "tagId");

                result.TagIds = tagsIds;
                return result;
            }
        }

        public IEnumerable<Transaction.ApiModels.Transaction> GetTopTransactions(
            IEnumerable<DateTime> reportParametersMonths)
        {
            using (var connection = _mySqlConnectionFactory.CreateConnection())
            {
                connection.Open();
                return connection.Query<Transaction.ApiModels.Transaction>(GetTopTransactionsQuery, new
                {
                    months = reportParametersMonths.Select(x => x.ToString("yyyy-MM"))
                });
            }
        }

        public async Task<IEnumerable<Transaction.ApiModels.Transaction>> GetTransactions(DateTime month)
        {
            using (var connection = _mySqlConnectionFactory.CreateConnection())
            {
                connection.Open();

                var transactionsDictionary = new Dictionary<int, Transaction.ApiModels.Transaction>();

                await connection.QueryAsync<Transaction.ApiModels.Transaction, int?, Transaction.ApiModels.Transaction>(
                    GetTransactionsByMonthQuery,
                    (transaction, tagId) =>
                    {
                        if (!transactionsDictionary.TryGetValue(transaction.Id, out var transactionEntry))
                        {
                            transactionEntry = transaction;
                            transactionEntry.TagIds = new List<int>();
                            transactionsDictionary.Add(transaction.Id, transactionEntry);
                        }

                        if (tagId.HasValue)
                        {
                            transactionEntry.TagIds.Add(tagId.Value);                            
                        }
                        
                        return transactionEntry;
                    }, new
                    {
                        month = month.ToString("yyyy-MM")
                    }, splitOn: "tagId");

                return transactionsDictionary.Values;
            }
        }
    }
}