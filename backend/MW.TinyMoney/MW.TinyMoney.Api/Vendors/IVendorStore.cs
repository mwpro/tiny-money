using Dapper;
using MySql.Data.MySqlClient;

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
    }

    public class MySqlVendorStore : IVendorStore
    {
        private const string SaveVendorQuery =
              @"INSERT INTO vendor (name, default_subcategory_id)
                VALUES(@name, @defaultSubcategoryId);
                SELECT LAST_INSERT_ID();";


        public void SaveVendor(Vendor vendor)
        {
            using (var connection = new MySqlConnection("Server=localhost;Database=tinymoney;User ID=root;Password=tinymoney;")) // todo to config
            {
                connection.Open();
                using (var dbTransaction = connection.BeginTransaction())
                {
                    vendor.Id = connection.QuerySingle<int>(SaveVendorQuery, vendor, dbTransaction);

                    dbTransaction.Commit();
                }
            }
        }
    }
}
