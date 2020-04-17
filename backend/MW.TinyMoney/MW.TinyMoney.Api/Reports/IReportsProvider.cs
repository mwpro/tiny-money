using Dapper;
using MW.TinyMoney.Api.Infrasatructure;
using System.Collections.Generic;
using System.Linq;

namespace MW.TinyMoney.Api.Reports
{
    public interface IReportsProvider
    {
        void ExpensesByMonthReport();
    }

    public class MySqlReportsProvider : IReportsProvider
    {
        private readonly MySqlConnectionFactory _mySqlConnectionFactory;

        public MySqlReportsProvider(MySqlConnectionFactory mySqlConnectionFactory)
        {
            _mySqlConnectionFactory = mySqlConnectionFactory;
        }
        
        private const string ExpensesByMonthReportQuery =
              @"SELECT
                       YEAR(transaction_date),
                       MONTH(transaction_date), 
                       sc.parent_category_id,
                       SUM(amount) 
                FROM transaction t 
                LEFT JOIN subcategory sc ON sc.id = t.subcategory_id
                GROUP BY 
                         YEAR(transaction_date),
                         MONTH(transaction_date),
                         sc.parent_category_id";

        public void ExpensesByMonthReport()
        {
            using (var connection = _mySqlConnectionFactory.CreateConnection())
            {
//                var categoriesDictionary = new Dictionary<int, Category>();
//
//                connection.Open();
//                return connection.Query<Category, Subcategory, Category>(GetCategoriesQuery, (category, subcategory) =>
//                {
//                    if (!categoriesDictionary.TryGetValue(category.Id, out Category categoryEntry))
//                    {
//                        categoryEntry = category;
//                        categoryEntry.Subcategories = new List<Subcategory>();
//                        categoriesDictionary.Add(categoryEntry.Id, categoryEntry);
//                    }
//
//                    categoryEntry.Subcategories.Add(subcategory);
//                    return categoryEntry;
//                }).Distinct().ToList();
            }
        }
    }
}
