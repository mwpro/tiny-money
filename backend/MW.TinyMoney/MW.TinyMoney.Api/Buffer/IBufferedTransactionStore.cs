using System.Collections.Generic;
using Dapper;
using MW.TinyMoney.Api.Buffer.ApiModels;
using MySql.Data.MySqlClient;

namespace MW.TinyMoney.Api.Controllers
{

    public interface IBufferedTransactionStore
    {
        void SaveTransactionsToBuffer(IEnumerable<BufferedTransaction> bufferedTransactions);
        BufferedTransaction GetBufferedTransaction(int id);
        IEnumerable<BufferedTransaction> GetBufferedTransactions();
        void DeleteBufferedTransaction(int id);
    }

    public class MySqlBufferedTransactionStore : IBufferedTransactionStore
    {
        private const string GetBufferedTransactionsQuery = @"SELECT id, amount, importDate, transactionDate, rawBankStatementDescription
                FROM bufferedTransaction ORDER BY transactionDate";

        private const string GetBufferedTransactionQuery = @"SELECT id, amount, importDate, transactionDate, rawBankStatementDescription
                FROM bufferedTransaction
                WHERE id = @id";

        private const string DeleteBufferedTransactionQuery = @"DELETE FROM bufferedTransaction WHERE id = @id";

        private const string SaveBufferedTransactionsQuery =
            @"INSERT INTO bufferedTransaction (amount, importDate, transactionDate, rawBankStatementDescription)
                VALUES(@amount, @importDate, @transactionDate, @rawBankStatementDescription)";

        public void DeleteBufferedTransaction(int id)
        {
            using (var connection = new MySqlConnection("Server=localhost;Database=tinymoney;User ID=root;Password=tinymoney;")) // todo to config
            {
                connection.Open();

                connection.Execute(DeleteBufferedTransactionQuery, new { id });
            }
        }

        public BufferedTransaction GetBufferedTransaction(int id)
        {
            using (var connection = new MySqlConnection("Server=localhost;Database=tinymoney;User ID=root;Password=tinymoney;")) // todo to config
            {
                connection.Open();

                return connection.QuerySingleOrDefault<BufferedTransaction>(GetBufferedTransactionQuery, new { id });
            }
        }

        public IEnumerable<BufferedTransaction> GetBufferedTransactions()
        {
            using (var connection = new MySqlConnection("Server=localhost;Database=tinymoney;User ID=root;Password=tinymoney;")) // todo to config
            {
                connection.Open();

                return connection.Query<BufferedTransaction>(GetBufferedTransactionsQuery);
            }
        }

        public void SaveTransactionsToBuffer(IEnumerable<BufferedTransaction> bufferedTransactions) // todo async
        {
            using (var connection = new MySqlConnection("Server=localhost;Database=tinymoney;User ID=root;Password=tinymoney;")) // todo to config
            {
                connection.Open();

                connection.Execute(SaveBufferedTransactionsQuery, bufferedTransactions);
            }
        }
    }
}
