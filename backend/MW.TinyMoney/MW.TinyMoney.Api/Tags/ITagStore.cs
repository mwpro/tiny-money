using Dapper;
using MW.TinyMoney.Api.Infrasatructure;
using MySql.Data.MySqlClient;
using System.Collections.Generic;

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
        IEnumerable<Tag> GetTags();
    }

    public class MySqlTagStore : ITagStore
    {
        private readonly MySqlConnectionFactory _mySqlConnectionFactory;

        public MySqlTagStore(MySqlConnectionFactory mySqlConnectionFactory)
        {
            _mySqlConnectionFactory = mySqlConnectionFactory;
        }

        private const string SaveTagQuery =
              @"INSERT INTO tag (name)
                VALUES(@name);
                SELECT LAST_INSERT_ID();";

        private const string GetTagsQuery =
              @"SELECT id, name
                FROM tag";


        public void SaveTag(Tag tag)
        {
            using (var connection = _mySqlConnectionFactory.CreateConnection())
            {
                connection.Open();
                using (var dbTransaction = connection.BeginTransaction())
                {
                    tag.Id = connection.QuerySingle<int>(SaveTagQuery, tag, dbTransaction);

                    dbTransaction.Commit();
                }
            }
        }

        public IEnumerable<Tag> GetTags()
        {
            using (var connection = _mySqlConnectionFactory.CreateConnection())
            {
                connection.Open();
                return connection.Query<Tag>(GetTagsQuery);
            }
        }
    }
}
