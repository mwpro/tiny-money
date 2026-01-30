using Dapper;
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
        public IList<Subcategory> Subcategories { get; set; }

        public CategoryDto ToDto()
        {
            return new CategoryDto()
            {
                Id = Id,
                Name = Name,
                IsIncome = IsIncome,
                Subcategories = Subcategories.Select(s => new SubcategoryDto()
                {
                    Id = s.Id,
                    Name = s.Name
                })
            };
        }
    }

    public class Subcategory
    {
        public int Id { get; set; }
        public string Name { get; set; }
    }

    public interface ICategoriesStore
    {
        Task<IReadOnlyCollection<Category>> GetCategories();
    }

    public class MySqlCategoriesStore : ICategoriesStore
    {
        private readonly MySqlConnectionFactory _mySqlConnectionFactory;

        public MySqlCategoriesStore(MySqlConnectionFactory mySqlConnectionFactory)
        {
            _mySqlConnectionFactory = mySqlConnectionFactory;
        }
        
        private const string GetCategoriesQuery =
              @"SELECT c.id, c.name, c.is_income AS 'isIncome', s.id, s.name
                FROM category c
                LEFT JOIN subcategory s ON c.id = s.parent_category_id";

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

                categoryEntry.Subcategories.Add(subcategory);
                return categoryEntry;
            });

            return categoriesDictionary.Values;
        }
    }
}
