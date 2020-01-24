using Dapper;
using MW.TinyMoney.Api.Infrasatructure;
using MySql.Data.MySqlClient;
using System.Data.Common;
using System.Linq;

namespace MW.TinyMoney.Api.Controllers
{
    public interface ITransactionStore
    {
        void SaveTransaction(Transaction.ApiModels.Transaction transaction);
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
    }
}
