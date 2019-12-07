using System.Collections.Generic;
using Dapper;
using MW.TinyMoney.Api.Buffer.ApiModels;
using MySql.Data.MySqlClient;

namespace MW.TinyMoney.Api.Controllers
{
    public interface IBufferedTransactionStore
    {
        void SaveTransactionsToBuffer(IEnumerable<BufferedTransaction> bufferedTransactions);
        IEnumerable<BufferedTransaction> GetBufferedTransactions();
    }

    public class MySqlBufferedTransactionStore : IBufferedTransactionStore
    {
        private const string GetBufferedTransactionsQuery = @"SELECT `id`, `amount`, `importDate`, `transactionDate`, `rawBankStatementDescription`
                FROM `bufferedTransaction`";

        private const string SaveBufferedTransactionsQuery =
            @"INSERT INTO `bufferedTransaction` (`amount`, `importDate`, `transactionDate`, `rawBankStatementDescription`)
                VALUES(@amount, @importDate, @transactionDate, @rawBankStatementDescription)";

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
