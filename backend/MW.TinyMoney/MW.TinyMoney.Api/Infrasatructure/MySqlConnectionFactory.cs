using Microsoft.Extensions.Configuration;
using MySql.Data.MySqlClient;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MW.TinyMoney.Api.Infrasatructure
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
