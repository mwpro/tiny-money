using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using MW.TinyMoney.Api.Tags;

namespace MW.TinyMoney.UnitTests.Helpers;

public class TagStoreStub : ITagStore
{
    public int SaveTagCallCount { get; private set; }
    public Task SaveTag(Tag tag) { SaveTagCallCount++; tag.Id = 1; return Task.CompletedTask; }
    public Task<IEnumerable<TagDetails>> GetTags() => throw new NotImplementedException();
    public Task<Tag> GetTag(int id) => throw new NotImplementedException();
    public Task DeleteTag(int id) => throw new NotImplementedException();
    public Task UpdateTag(int tagId, Tag tag) => throw new NotImplementedException();
}