using Microsoft.Extensions.Configuration;
using MySqlConnector;

namespace MW.TinyMoney.Api.Infrastructure
{
    public class MySqlConnectionFactory
    {
        private readonly IConfiguration _configuration;

        public MySqlConnectionFactory(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public MySqlConnection CreateConnection() => new MySqlConnection(_configuration.GetConnectionString("TransactionsDb"));
    }
}
