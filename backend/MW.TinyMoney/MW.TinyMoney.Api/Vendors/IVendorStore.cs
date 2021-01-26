using Dapper;
using System.Collections.Generic;
using MW.TinyMoney.Api.Infrastructure;

namespace MW.TinyMoney.Api.Vendors
{
    public class Vendor
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public int DefaultSubcategoryId { get; set; }
    }

    public interface IVendorStore
    {
        void SaveVendor(Vendor vendor);
        IEnumerable<Vendor> GetVendors();
    }

    public class MySqlVendorStore : IVendorStore
    {
        private readonly MySqlConnectionFactory _mySqlConnectionFactory;

        public MySqlVendorStore(MySqlConnectionFactory mySqlConnectionFactory)
        {
            _mySqlConnectionFactory = mySqlConnectionFactory;
        }

        private const string SaveVendorQuery =
              @"INSERT INTO vendor (name, default_subcategory_id)
                VALUES(@name, @defaultSubcategoryId);
                SELECT LAST_INSERT_ID();";

        private const string GetVendorsQuery =
              @"SELECT id, name, default_subcategory_id as defaultSubcategoryId
                FROM vendor";


        public void SaveVendor(Vendor vendor)
        {
            using (var connection = _mySqlConnectionFactory.CreateConnection())
            {
                connection.Open();
                using (var dbTransaction = connection.BeginTransaction())
                {
                    vendor.Id = connection.QuerySingle<int>(SaveVendorQuery, vendor, dbTransaction);

                    dbTransaction.Commit();
                }
            }
        }

        public IEnumerable<Vendor> GetVendors()
        {
            using (var connection = _mySqlConnectionFactory.CreateConnection())
            {
                connection.Open();
                return connection.Query<Vendor>(GetVendorsQuery);
            }
        }
    }
}
