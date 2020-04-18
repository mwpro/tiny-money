using System;
using System.Collections.Generic;
using Dapper;
using MW.TinyMoney.Api.Infrasatructure;
using System.Linq;

namespace MW.TinyMoney.Api.Controllers
{
    public interface ITransactionStore
    {
        void SaveTransaction(Transaction.ApiModels.Transaction transaction);
        IEnumerable<Transaction.ApiModels.Transaction> GetTopTransactions(IEnumerable<DateTime> reportParametersMonths);
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
                t.modified_date AS 'modifiedDate',
                t.transaction_date AS 'transactionDate',
                t.vendor_id AS 'vendorId',
                t.subcategory_id AS 'subcategoryId'
                # todo tags
            FROM transaction t
            WHERE DATE_FORMAT(transaction_date, '%Y-%m') IN @months
            ORDER BY amount DESC
            LIMIT 50";


        public void SaveTransaction(Transaction.ApiModels.Transaction transaction)
        {
            using (var connection = _mySqlConnectionFactory.CreateConnection())
            {
                connection.Open();
                using (var dbTransaction = connection.BeginTransaction())
                {
                    transaction.Id = connection.QuerySingle<int>(SaveTransactionQuery, transaction, dbTransaction);

                    connection.Execute(SaveTransactionTag, transaction.TagIds.Select(x => new { transactionId = transaction.Id, tagId = x }), dbTransaction);

                    dbTransaction.Commit();
                }
            }
        }

        public IEnumerable<Transaction.ApiModels.Transaction> GetTopTransactions(IEnumerable<DateTime> reportParametersMonths)
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
    }
}
