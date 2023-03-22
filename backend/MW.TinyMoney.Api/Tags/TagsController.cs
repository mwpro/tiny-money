using System.Collections.Generic;
using System.Linq;
using System.Net;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MW.TinyMoney.Api.Buffer.ApiModels;

namespace MW.TinyMoney.Api.Tags
{
    [ApiController, Route("/api/tags"), AllowAnonymous]
    public class TagsController : ControllerBase
    {
        private readonly ITagStore _tagStore;

        public TagsController(ITagStore tagStore)
        {
            _tagStore = tagStore;
        }

        [HttpGet, Route("")]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(IEnumerable<TagDto>))]
        public IActionResult GetTags()
        {
            return Ok(_tagStore.GetTags().Select(x => new TagDto()
            {
                Id = x.Id,
                Name = x.Name
            }));
        }
        
        [HttpDelete("{id}")]
        [ProducesResponseType((int)HttpStatusCode.Accepted)]
        [ProducesResponseType((int)HttpStatusCode.NotFound)]
        public IActionResult DeleteTag(int id)
        {
            var tag = _tagStore.GetTag(id);
            if (tag == null)
                return NotFound();

            _tagStore.DeleteTag(id);
            return Ok();
        }
    }
}
