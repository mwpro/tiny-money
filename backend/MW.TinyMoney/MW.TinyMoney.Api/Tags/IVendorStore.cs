using Dapper;
using MySql.Data.MySqlClient;

namespace MW.TinyMoney.Api.Tags
{
    public class Tag
    {
        public int Id { get; set; }
        public string Name { get; set; }
    }

    public interface ITagStore
    {
        void SaveTag(Tag tag);
    }

    public class MySqlTagStore : ITagStore
    {
        private const string SaveVendorQuery =
              @"INSERT INTO tag (name)
                VALUES(@name);
                SELECT LAST_INSERT_ID();";


        public void SaveTag(Tag tag)
        {
            using (var connection = new MySqlConnection("Server=localhost;Database=tinymoney;User ID=root;Password=tinymoney;")) // todo to config
            {
                connection.Open();
                using (var dbTransaction = connection.BeginTransaction())
                {
                    tag.Id = connection.QuerySingle<int>(SaveVendorQuery, tag, dbTransaction);

                    dbTransaction.Commit();
                }
            }
        }
    }
}
