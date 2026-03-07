using System;
using Dapper;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.Extensions.Caching.Memory;
using MW.TinyMoney.Api.Infrastructure;
using MW.TinyMoney.Api.Vendors.Matching;
using MySqlConnector;

namespace MW.TinyMoney.Api.Vendors
{
    public class Vendor
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public int DefaultSubcategoryId { get; set; }
    }

    public class VendorAlias
    {
        public int Id { get; set; }
        public int VendorId { get; set; }
        public string Alias { get; set; }
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
        Task UpdateVendor(int vendorId, Vendor vendor);
        Task DeleteVendor(VendorDetails vendorToDelete, int? mergeToVendorId);
        Task<IEnumerable<VendorAlias>> GetVendorAliases(int vendorId);
        Task<IEnumerable<VendorAlias>> GetAllAliases();
        Task<Result<VendorAlias>> AddVendorAlias(int vendorId, string alias);
        Task DeleteVendorAlias(int vendorId, int aliasId);
    }

    public class MySqlVendorStore : IVendorStore
    {
        private readonly MySqlConnectionFactory _mySqlConnectionFactory;
        private readonly IMemoryCache _cache;

        public MySqlVendorStore(MySqlConnectionFactory mySqlConnectionFactory, IMemoryCache cache)
        {
            _mySqlConnectionFactory = mySqlConnectionFactory;
            _cache = cache;
        }

        private const string SaveVendorQuery =
            """
            INSERT INTO vendor (name, default_subcategory_id)
            VALUES(@name, @defaultSubcategoryId);
            SELECT LAST_INSERT_ID();
            """;

        private const string GetVendorsQuery =
            """
            SELECT id, name, default_subcategory_id as defaultSubcategoryId
            FROM vendor
            """;


        private const string GetVendorsDetailsQuery =
            """
            SELECT v.id, v.name, default_subcategory_id as defaultSubcategoryId,
                   s.name as subcategoryName,
                   c.name as categoryName,
                   c.is_income as isIncomeCategory,
                   COUNT(t.id) AS numberOfTransactions,
                   MAX(t.transaction_date) AS lastTransactionDate
            FROM vendor v
            LEFT JOIN transaction t ON v.id = t.vendor_id
            LEFT JOIN subcategory s ON v.default_subcategory_id = s.id
            LEFT JOIN category c on s.parent_category_id = c.id
            GROUP BY v.id, v.name, v.default_subcategory_id, s.name, c.name, c.is_income
            ORDER BY v.name
            """;
        
        private const string GetVendorDetailsQuery =
            """
            SELECT v.id, v.name, default_subcategory_id as defaultSubcategoryId,
                   s.name as subcategoryName,
                   c.name as categoryName,
                   c.is_income as isIncomeCategory,
                   COUNT(t.id) AS numberOfTransactions,
                   MAX(t.transaction_date) AS lastTransactionDate
            FROM vendor v
            LEFT JOIN transaction t ON v.id = t.vendor_id
            LEFT JOIN subcategory s ON v.default_subcategory_id = s.id
            LEFT JOIN category c on s.parent_category_id = c.id
            WHERE v.id = @vendorId
            GROUP BY v.id, v.name, v.default_subcategory_id, s.name, c.name, c.is_income
            ORDER BY v.name
            """;

        private const string UpdateVendorQuery = 
            """
            UPDATE vendor
            SET name = @name, default_subcategory_id = @defaultSubcategoryId 
            WHERE id = @id;
            """;

        private const string MoveTransactionsBetweenVendors =
            """
            UPDATE transaction
            SET vendor_id = @toVendorId
            WHERE vendor_id = @fromVendorId
            """;
        
        private const string DeleteVendorAliasesForVendorQuery = 
            """
            DELETE FROM vendor_alias 
            WHERE vendor_id = @id
            """;
        private const string DeleteVendorQuery = 
            """
            DELETE FROM vendor 
            WHERE id = @id
            """;

        private const string GetVendorAliasesQuery =
            """
            SELECT id, vendor_id AS vendorId, alias FROM vendor_alias 
            WHERE vendor_id = @vendorId
            """;

        private const string GetAllAliasesQuery =
            """
            SELECT id, vendor_id AS vendorId, alias 
            FROM vendor_alias
            """;

        private const string AddVendorAliasQuery =
            """
            INSERT INTO vendor_alias (vendor_id, alias) 
            VALUES (@vendorId, @alias); 
            SELECT LAST_INSERT_ID();
            """;

        private const string DeleteVendorAliasQuery =
            """
            DELETE FROM vendor_alias 
            WHERE id = @aliasId AND vendor_id = @vendorId
            """;
        
        public async Task SaveVendor(Vendor vendor)
        {
            await using var connection = _mySqlConnectionFactory.CreateConnection();
            await connection.OpenAsync();
            vendor.Id = await connection.QuerySingleAsync<int>(SaveVendorQuery, vendor);
            _cache.Remove(VendorMatchingService.IndexCacheKey);
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

        public async Task UpdateVendor(int vendorId, Vendor vendor)
        {
            await using var connection = _mySqlConnectionFactory.CreateConnection();
            await connection.OpenAsync();
            await connection.ExecuteAsync(UpdateVendorQuery,
                new {
                    id = vendorId,
                    name = vendor.Name,
                    defaultSubcategoryId = vendor.DefaultSubcategoryId,
                });
            _cache.Remove(VendorMatchingService.IndexCacheKey);
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
            await connection.ExecuteAsync(DeleteVendorAliasesForVendorQuery, new { id = vendorToDelete.Id }, dbTransaction);
            await connection.ExecuteAsync(DeleteVendorQuery, new { id = vendorToDelete.Id }, dbTransaction);

            await dbTransaction.CommitAsync();
            _cache.Remove(VendorMatchingService.IndexCacheKey);
        }

        public async Task<IEnumerable<VendorAlias>> GetVendorAliases(int vendorId)
        {
            await using var connection = _mySqlConnectionFactory.CreateConnection();
            await connection.OpenAsync();
            return await connection.QueryAsync<VendorAlias>(GetVendorAliasesQuery, new { vendorId });
        }

        public async Task<IEnumerable<VendorAlias>> GetAllAliases()
        {
            await using var connection = _mySqlConnectionFactory.CreateConnection();
            await connection.OpenAsync();
            return await connection.QueryAsync<VendorAlias>(GetAllAliasesQuery);
        }

        public async Task<Result<VendorAlias>> AddVendorAlias(int vendorId, string alias)
        {
            await using var connection = _mySqlConnectionFactory.CreateConnection();
            await connection.OpenAsync();
            int id;
            try
            {
                id = await connection.QuerySingleAsync<int>(AddVendorAliasQuery, new { vendorId, alias });
            }
            catch (MySqlException ex) when (ex.Number == 1062)
            {
                return Result<VendorAlias>.Conflict($"Alias '{alias}' is already assigned to another vendor");
            }
            _cache.Remove(VendorMatchingService.IndexCacheKey);
            return Result<VendorAlias>.Success(new VendorAlias { Id = id, VendorId = vendorId, Alias = alias });
        }

        public async Task DeleteVendorAlias(int vendorId, int aliasId)
        {
            await using var connection = _mySqlConnectionFactory.CreateConnection();
            await connection.OpenAsync();
            await connection.ExecuteAsync(DeleteVendorAliasQuery, new { vendorId = vendorId, aliasId = aliasId });
            _cache.Remove(VendorMatchingService.IndexCacheKey);
        }
    }
}
