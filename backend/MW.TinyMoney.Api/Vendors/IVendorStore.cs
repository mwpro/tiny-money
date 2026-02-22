using System;
using Dapper;
using System.Collections.Generic;
using System.Threading.Tasks;
using MW.TinyMoney.Api.Infrastructure;

namespace MW.TinyMoney.Api.Vendors
{
    public class Vendor
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public int DefaultSubcategoryId { get; set; }
    }

    public class VendorDetails
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public int DefaultSubcategoryId { get; set; }
        public string SubcategoryName { get; set; }
        public string CategoryName { get; set; }
        public bool IsIncomeCategory { get; set; }
        public int NumberOfTransactions { get; set; }
        public DateTime? LastTransactionDate { get; set; }
    }

    public interface IVendorStore
    {
        Task SaveVendor(Vendor vendor);
        Task<IEnumerable<Vendor>> GetVendors();
        Task<IEnumerable<VendorDetails>> GetDetailedVendors();
        Task<VendorDetails> GetVendorDetails(int vendorId);
        Task DeleteVendor(VendorDetails vendorToDelete, int? mergeToVendorId);
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


        private const string GetVendorsDetailsQuery =
            @"SELECT v.id, v.name, default_subcategory_id as defaultSubcategoryId,
                   s.name as subcategoryName,
                   c.name as categoryName,
                   c.is_income as isIncomeCategory,
                   COUNT(t.id) AS numberOfTransactions,
                   MAX(t.transaction_date) AS lastTransactionDate
            FROM vendor v
            LEFT JOIN transaction t ON v.id = t.vendor_id
            LEFT JOIN subcategory s ON v.default_subcategory_id = s.id
            LEFT JOIN m1061_tinymoney_dev.category c on s.parent_category_id = c.id
            GROUP BY v.id, v.name, v.default_subcategory_id, s.name, c.name, c.is_income
            ORDER BY v.name";
        
        private const string GetVendorDetailsQuery =
            @"SELECT v.id, v.name, default_subcategory_id as defaultSubcategoryId,
                   s.name as subcategoryName,
                   c.name as categoryName,
                   c.is_income as isIncomeCategory,
                   COUNT(t.id) AS numberOfTransactions,
                   MAX(t.transaction_date) AS lastTransactionDate
            FROM vendor v
            LEFT JOIN transaction t ON v.id = t.vendor_id
            LEFT JOIN subcategory s ON v.default_subcategory_id = s.id
            LEFT JOIN m1061_tinymoney_dev.category c on s.parent_category_id = c.id
            WHERE v.id = @vendorId
            GROUP BY v.id, v.name, v.default_subcategory_id, s.name, c.name, c.is_income
            ORDER BY v.name";
        
        private const string MoveTransactionsBetweenVendors =
            @"UPDATE transaction
              SET vendor_id = @toVendorId
              WHERE vendor_id = @fromVendorId";
        
        private const string DeleteVendorQuery = "DELETE FROM vendor WHERE id = @id";

        public async Task SaveVendor(Vendor vendor)
        {
            await using var connection = _mySqlConnectionFactory.CreateConnection();
            await connection.OpenAsync();
            
            vendor.Id = await connection.QuerySingleAsync<int>(SaveVendorQuery, vendor);
        }

        public async Task<IEnumerable<Vendor>> GetVendors()
        {
            await using var connection = _mySqlConnectionFactory.CreateConnection();
            await connection.OpenAsync();
            
            return await connection.QueryAsync<Vendor>(GetVendorsQuery);
        }

        public async Task<IEnumerable<VendorDetails>> GetDetailedVendors()
        {
            await using var connection = _mySqlConnectionFactory.CreateConnection();
            await connection.OpenAsync();
            
            return await connection.QueryAsync<VendorDetails>(GetVendorsDetailsQuery);
        }

        public async Task<VendorDetails> GetVendorDetails(int vendorId)
        {
            await using var connection = _mySqlConnectionFactory.CreateConnection();
            await connection.OpenAsync();
            
            return await connection.QuerySingleOrDefaultAsync<VendorDetails>(GetVendorDetailsQuery, new {vendorId = vendorId});
        }

        public async Task DeleteVendor(VendorDetails vendorToDelete, int? mergeToVendorId)
        {
            await using var connection = _mySqlConnectionFactory.CreateConnection();
            await connection.OpenAsync();
            await using var dbTransaction = await connection.BeginTransactionAsync();
            
            if (mergeToVendorId.HasValue)
            {
                await connection.ExecuteAsync(MoveTransactionsBetweenVendors, new { fromVendorId = vendorToDelete.Id, toVendorId = mergeToVendorId.Value }, dbTransaction);
            }
            await connection.ExecuteAsync(DeleteVendorQuery, new { id = vendorToDelete.Id }, dbTransaction);
                
            await dbTransaction.CommitAsync();
        }
    }
}
