using Dapper;
using System.Collections.Generic;
using MW.TinyMoney.Api.Infrastructure;

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
        Tag GetTag(int id);
        void DeleteTag(int id);
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

        private const string GetTagQuery =
            @"SELECT id, name
                FROM tag
                WHERE id=@id";

        private const string DeleteTagQuery =
            @"DELETE FROM transaction_tag
                WHERE tag_id = @id;
            DELETE FROM tag 
                WHERE id = @id
            ";


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

        public Tag GetTag(int id)
        {
            using (var connection = _mySqlConnectionFactory.CreateConnection())
            {
                connection.Open();

                return connection.QuerySingleOrDefault<Tag>(GetTagQuery, new {id});
            }
        }

        public void DeleteTag(int id)
        {
            using (var connection = _mySqlConnectionFactory.CreateConnection())
            {
                connection.Open();
                connection.Execute(DeleteTagQuery, new { id });
            }
        }
    }
}
