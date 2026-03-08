using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using MW.TinyMoney.Api.Tags;

namespace MW.TinyMoney.UnitTests.Stubs;

public class TagStoreStub : ITagStore
{
    public Task SaveTag(Tag tag) { tag.Id = 1; return Task.CompletedTask; }
    public Task<IEnumerable<TagDetails>> GetTags() => throw new NotImplementedException();
    public Task<Tag> GetTag(int id) => throw new NotImplementedException();
    public Task DeleteTag(int id) => throw new NotImplementedException();
    public Task UpdateTag(int tagId, Tag tag) => throw new NotImplementedException();
}