using Dapper;
using MW.TinyMoney.Api.Infrasatructure;
using System.Collections.Generic;
using System.Linq;

namespace MW.TinyMoney.Api.Categories
{
    public class Category
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public IList<Subcategory> Subcategories { get; set; }
    }

    public class Subcategory
    {
        public int Id { get; set; }
        public string Name { get; set; }
    }

    public class CategoryDto
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public IEnumerable<SubcategoryDto> Subcategories { get; set; }
    }

    public class SubcategoryDto
    {
        public int Id { get; set; }
        public string Name { get; set; }
    }

    public interface ICategoriesStore
    {
        IEnumerable<Category> GetCategories();
    }

    public class MySqlCategoriesStore : ICategoriesStore
    {
        private readonly MySqlConnectionFactory _mySqlConnectionFactory;

        public MySqlCategoriesStore(MySqlConnectionFactory mySqlConnectionFactory)
        {
            _mySqlConnectionFactory = mySqlConnectionFactory;
        }
        
        private const string GetCategoriesQuery =
              @"SELECT c.id, c.name, s.id, s.name
                FROM category c
                LEFT JOIN subcategory s ON c.id = s.parent_category_id";

        public IEnumerable<Category> GetCategories()
        {
            using (var connection = _mySqlConnectionFactory.CreateConnection())
            {
                var categoriesDictionary = new Dictionary<int, Category>();

                connection.Open();
                return connection.Query<Category, Subcategory, Category>(GetCategoriesQuery, (category, subcategory) =>
                {
                    if (!categoriesDictionary.TryGetValue(category.Id, out Category categoryEntry))
                    {
                        categoryEntry = category;
                        categoryEntry.Subcategories = new List<Subcategory>();
                        categoriesDictionary.Add(categoryEntry.Id, categoryEntry);
                    }

                    categoryEntry.Subcategories.Add(subcategory);
                    return categoryEntry;
                }).Distinct().ToList();
            }
        }
    }
}
