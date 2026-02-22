using Dapper;
using System.Collections.Generic;
using System.Threading.Tasks;
using MW.TinyMoney.Api.Infrastructure;

namespace MW.TinyMoney.Api.Tags
{
    public class Tag
    {
        public int Id { get; set; }
        public string Name { get; set; }
    }

    public class TagDetails
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public int NumberOfTransactions { get; set; }
    }

    public interface ITagStore
    {
        Task SaveTag(Tag tag);
        Task<IEnumerable<TagDetails>> GetTags();
        Task<Tag> GetTag(int id);
        Task DeleteTag(int id);
        Task UpdateTag(int tagId, Tag tag);
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

        private const string UpdateTagQuery = 
              @"UPDATE tag
                set name = @name 
                where id = @id;";

        private const string GetTagsQuery =
              @"SELECT id, name, COUNT(tt.transaction_id) AS numberOfTransactions
                FROM tag
                LEFT JOIN transaction_tag tt on tag.id = tt.tag_id
                GROUP BY id, name
                ORDER BY name";

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


        public async Task SaveTag(Tag tag)
        {
            await using var connection = _mySqlConnectionFactory.CreateConnection();
            await connection.OpenAsync();
            
            tag.Id = await connection.QuerySingleAsync<int>(SaveTagQuery, tag);
        }

        public async Task UpdateTag(int tagId, Tag tag)
        {
            await using var connection = _mySqlConnectionFactory.CreateConnection();
            await connection.OpenAsync();
            
            await connection.ExecuteAsync(UpdateTagQuery,
            new {
                name = tag.Name,
                id = tagId
            });
        }

        public async Task<IEnumerable<TagDetails>> GetTags()
        {
            await using var connection = _mySqlConnectionFactory.CreateConnection();
            await connection.OpenAsync();
            
            return await connection.QueryAsync<TagDetails>(GetTagsQuery);
        }

        public async Task<Tag> GetTag(int id)
        {
            await using var connection = _mySqlConnectionFactory.CreateConnection();
            await connection.OpenAsync();

            return await connection.QuerySingleOrDefaultAsync<Tag>(GetTagQuery, new {id});
        }

        public async Task DeleteTag(int id)
        {
            await using var connection = _mySqlConnectionFactory.CreateConnection();
            await connection.OpenAsync();
            
            await connection.ExecuteAsync(DeleteTagQuery, new { id });
        }
    }
}
