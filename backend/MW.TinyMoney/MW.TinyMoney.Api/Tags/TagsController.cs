using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MW.TinyMoney.Api.Buffer.ApiModels;

namespace MW.TinyMoney.Api.Tags
{
    [ApiController, Route("/api/tags"), Authorize]
    public class TagsController : ControllerBase
    {
        private readonly ITagStore _tagStore;

        public TagsController(ITagStore tagStore)
        {
            _tagStore = tagStore;
        }

        [HttpGet, Route("")]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(IEnumerable<TagDto>))]
        public async Task<IActionResult> GetTags()
        {
            return Ok(_tagStore.GetTags().Select(x => new TagDto()
            {
                Id = x.Id,
                Name = x.Name
            }));
        }
    }
}
