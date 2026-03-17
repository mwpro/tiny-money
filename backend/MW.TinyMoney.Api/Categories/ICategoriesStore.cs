using Dapper;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using MW.TinyMoney.Api.Categories.ApiModels;
using MW.TinyMoney.Api.Infrastructure;

namespace MW.TinyMoney.Api.Categories
{
    public class Category
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public bool IsIncome { get; set; }
        public int SortOrder { get; set; }
        public DateTime? DeletedAt { get; set; }
        public bool IsDeleted => DeletedAt.HasValue;
        public IList<Subcategory> Subcategories { get; set; }

        public CategoryDto ToDto()
        {
            return new CategoryDto()
            {
                Id = Id,
                Name = Name,
                IsIncome = IsIncome,
                IsDeleted = IsDeleted,
                SortOrder = SortOrder,
                Subcategories = Subcategories.Select(s => new SubcategoryDto()
                {
                    Id = s.Id,
                    Name = s.Name,
                    IsDeleted = s.IsDeleted,
                    SortOrder = s.SortOrder
                })
            };
        }
    }

    public class Subcategory
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public int SortOrder { get; set; }
        public DateTime? DeletedAt { get; set; }
        public bool IsDeleted => DeletedAt.HasValue;
    }

    public interface ICategoriesStore
    {
        Task<IReadOnlyCollection<Category>> GetCategories();
        Task CreateCategory(string name, bool isIncome);
        Task UpdateCategory(int id, string name);
        Task DeleteCategory(int id);
        Task RestoreCategory(int id);
        Task MoveCategory(int id, bool up);
        Task CreateSubcategory(int categoryId, string name);
        Task UpdateSubcategory(int id, string name, int parentCategoryId);
        Task DeleteSubcategory(int id);
        Task RestoreSubcategory(int id);
        Task MoveSubcategory(int categoryId, int id, bool up);
    }

    public class MySqlCategoriesStore : ICategoriesStore
    {
        private readonly MySqlConnectionFactory _mySqlConnectionFactory;

        public MySqlCategoriesStore(MySqlConnectionFactory mySqlConnectionFactory)
        {
            _mySqlConnectionFactory = mySqlConnectionFactory;
        }

        private const string GetCategoriesQuery =
            """
            SELECT c.id, c.name, c.is_income AS 'isIncome', c.sort_order AS 'sortOrder', c.deleted_at AS 'deletedAt',
                   s.id, s.name, s.sort_order AS 'sortOrder', s.deleted_at AS 'deletedAt'
            FROM category c
            LEFT JOIN subcategory s ON c.id = s.parent_category_id
            ORDER BY c.sort_order, s.sort_order
            """;

        private const string CreateCategoryQuery =
            """
            INSERT INTO category (name, is_income, sort_order)
            VALUES (@name, @isIncome, COALESCE((SELECT MAX(sort_order) FROM category c2), 0) + 1)
            """;

        private const string UpdateCategoryQuery =
            "UPDATE category SET name = @name WHERE id = @id";

        private const string CountCategorySubcategoriesQuery =
            "SELECT COUNT(*) FROM subcategory WHERE parent_category_id = @id";

        private const string HardDeleteCategoryQuery =
            "DELETE FROM category WHERE id = @id";

        private const string SoftDeleteCategoryQuery =
            """
            UPDATE category c
            LEFT JOIN subcategory s ON s.parent_category_id = c.id AND s.deleted_at IS NULL
            SET c.deleted_at = NOW(), s.deleted_at = NOW()
            WHERE c.id = @id
            """;

        private const string RestoreCategoryQuery =
            "UPDATE category SET deleted_at = NULL WHERE id = @id";

        private const string RestoreSubcategoryQuery =
            "UPDATE subcategory SET deleted_at = NULL WHERE id = @id";

        private const string GetCategorySortOrderQuery =
            "SELECT sort_order FROM category WHERE id = @id";

        private const string FindNeighborCategoryUpQuery =
            """
            SELECT id, sort_order FROM category
            WHERE sort_order < @sortOrder AND deleted_at IS NULL
            ORDER BY sort_order DESC LIMIT 1
            """;

        private const string FindNeighborCategoryDownQuery =
            """
            SELECT id, sort_order FROM category
            WHERE sort_order > @sortOrder AND deleted_at IS NULL
            ORDER BY sort_order ASC LIMIT 1
            """;

        private const string SwapCategorySortOrderQuery =
            """
            UPDATE category
            SET sort_order = CASE WHEN id = @id THEN @neighborSortOrder ELSE @currentSortOrder END
            WHERE id IN (@id, @neighborId)
            """;

        private const string CreateSubcategoryQuery =
            """
            INSERT INTO subcategory (name, parent_category_id, sort_order)
            VALUES (@name, @categoryId,
                COALESCE((SELECT MAX(sort_order) FROM subcategory s2 WHERE s2.parent_category_id = @categoryId), 0) + 1)
            """;

        private const string UpdateSubcategoryQuery =
            "UPDATE subcategory SET name = @name WHERE id = @id";

        private const string ReparentSubcategoryQuery =
            """
            UPDATE subcategory
            SET name = @name, parent_category_id = @parentCategoryId,
                sort_order = COALESCE((SELECT MAX(s2.sort_order) FROM subcategory s2 WHERE s2.parent_category_id = @parentCategoryId), 0) + 1
            WHERE id = @id
            """;

        private const string GetSubcategoryParentAndSortOrderQuery =
            "SELECT parent_category_id AS ParentCategoryId, sort_order AS SortOrder FROM subcategory WHERE id = @id";

        private const string CheckSubcategoryUsageQuery =
            """
            SELECT COUNT(*) FROM (
                SELECT subcategory_id AS id FROM `transaction` WHERE subcategory_id = @id
                UNION ALL
                SELECT default_subcategory_id FROM vendor WHERE default_subcategory_id = @id
            ) used
            """;

        private const string HardDeleteSubcategoryQuery =
            "DELETE FROM subcategory WHERE id = @id";

        private const string SoftDeleteSubcategoryQuery =
            "UPDATE subcategory SET deleted_at = NOW() WHERE id = @id";

        private const string GetSubcategorySortOrderQuery =
            "SELECT sort_order FROM subcategory WHERE id = @id AND parent_category_id = @categoryId";

        private const string FindNeighborSubcategoryUpQuery =
            """
            SELECT id, sort_order FROM subcategory
            WHERE sort_order < @sortOrder AND parent_category_id = @categoryId AND deleted_at IS NULL
            ORDER BY sort_order DESC LIMIT 1
            """;

        private const string FindNeighborSubcategoryDownQuery =
            """
            SELECT id, sort_order FROM subcategory
            WHERE sort_order > @sortOrder AND parent_category_id = @categoryId AND deleted_at IS NULL
            ORDER BY sort_order ASC LIMIT 1
            """;

        private const string SwapSubcategorySortOrderQuery =
            """
            UPDATE subcategory
            SET sort_order = CASE WHEN id = @id THEN @neighborSortOrder ELSE @currentSortOrder END
            WHERE id IN (@id, @neighborId)
            """;

        public async Task<IReadOnlyCollection<Category>> GetCategories()
        {
            using var connection = _mySqlConnectionFactory.CreateConnection();
            var categoriesDictionary = new Dictionary<int, Category>();

            await connection.OpenAsync();
            await connection.QueryAsync<Category, Subcategory, Category>(GetCategoriesQuery, (category, subcategory) =>
            {
                if (!categoriesDictionary.TryGetValue(category.Id, out Category categoryEntry))
                {
                    categoryEntry = category;
                    categoryEntry.Subcategories = new List<Subcategory>();
                    categoriesDictionary.Add(categoryEntry.Id, categoryEntry);
                }

                if (subcategory != null)
                    categoryEntry.Subcategories.Add(subcategory);
                return categoryEntry;
            });

            return categoriesDictionary.Values;
        }

        public async Task CreateCategory(string name, bool isIncome)
        {
            using var connection = _mySqlConnectionFactory.CreateConnection();
            await connection.OpenAsync();
            await connection.ExecuteAsync(CreateCategoryQuery, new { name, isIncome });
        }

        public async Task UpdateCategory(int id, string name)
        {
            using var connection = _mySqlConnectionFactory.CreateConnection();
            await connection.OpenAsync();
            await connection.ExecuteAsync(UpdateCategoryQuery, new { id, name });
        }

        public async Task DeleteCategory(int id)
        {
            using var connection = _mySqlConnectionFactory.CreateConnection();
            await connection.OpenAsync();
            var subcategoryCount = await connection.ExecuteScalarAsync<int>(CountCategorySubcategoriesQuery, new { id });
            var query = subcategoryCount == 0 ? HardDeleteCategoryQuery : SoftDeleteCategoryQuery;
            await connection.ExecuteAsync(query, new { id });
        }

        public async Task RestoreCategory(int id)
        {
            using var connection = _mySqlConnectionFactory.CreateConnection();
            await connection.OpenAsync();
            await connection.ExecuteAsync(RestoreCategoryQuery, new { id });
        }

        public async Task MoveCategory(int id, bool up)
        {
            using var connection = _mySqlConnectionFactory.CreateConnection();
            await connection.OpenAsync();

            var currentSortOrder = await connection.ExecuteScalarAsync<int?>(GetCategorySortOrderQuery, new { id });
            if (currentSortOrder == null) return;

            var neighborQuery = up ? FindNeighborCategoryUpQuery : FindNeighborCategoryDownQuery;
            var neighbor = await connection.QuerySingleOrDefaultAsync<(int Id, int SortOrder)?>(
                neighborQuery, new { sortOrder = currentSortOrder });
            if (neighbor == null) return;

            await connection.ExecuteAsync(SwapCategorySortOrderQuery,
                new { id, neighborId = neighbor.Value.Id, currentSortOrder = currentSortOrder.Value, neighborSortOrder = neighbor.Value.SortOrder });
        }

        public async Task CreateSubcategory(int categoryId, string name)
        {
            using var connection = _mySqlConnectionFactory.CreateConnection();
            await connection.OpenAsync();
            await connection.ExecuteAsync(CreateSubcategoryQuery, new { name, categoryId });
        }

        public async Task UpdateSubcategory(int id, string name, int parentCategoryId)
        {
            using var connection = _mySqlConnectionFactory.CreateConnection();
            await connection.OpenAsync();

            var current = await connection.QuerySingleAsync<(int ParentCategoryId, int SortOrder)>(
                GetSubcategoryParentAndSortOrderQuery, new { id });

            if (current.ParentCategoryId != parentCategoryId)
                await connection.ExecuteAsync(ReparentSubcategoryQuery, new { id, name, parentCategoryId });
            else
                await connection.ExecuteAsync(UpdateSubcategoryQuery, new { id, name });
        }

        public async Task DeleteSubcategory(int id)
        {
            using var connection = _mySqlConnectionFactory.CreateConnection();
            await connection.OpenAsync();
            var usageCount = await connection.ExecuteScalarAsync<int>(CheckSubcategoryUsageQuery, new { id });
            var query = usageCount == 0 ? HardDeleteSubcategoryQuery : SoftDeleteSubcategoryQuery;
            await connection.ExecuteAsync(query, new { id });
        }

        public async Task RestoreSubcategory(int id)
        {
            using var connection = _mySqlConnectionFactory.CreateConnection();
            await connection.OpenAsync();
            await connection.ExecuteAsync(RestoreSubcategoryQuery, new { id });
        }

        public async Task MoveSubcategory(int categoryId, int id, bool up)
        {
            using var connection = _mySqlConnectionFactory.CreateConnection();
            await connection.OpenAsync();

            var currentSortOrder = await connection.ExecuteScalarAsync<int?>(
                GetSubcategorySortOrderQuery, new { id, categoryId });
            if (currentSortOrder == null) return;

            var neighborQuery = up ? FindNeighborSubcategoryUpQuery : FindNeighborSubcategoryDownQuery;
            var neighbor = await connection.QuerySingleOrDefaultAsync<(int Id, int SortOrder)?>(
                neighborQuery, new { sortOrder = currentSortOrder, categoryId });
            if (neighbor == null) return;

            await connection.ExecuteAsync(SwapSubcategorySortOrderQuery,
                new { id, neighborId = neighbor.Value.Id, currentSortOrder = currentSortOrder.Value, neighborSortOrder = neighbor.Value.SortOrder });
        }
    }
}
