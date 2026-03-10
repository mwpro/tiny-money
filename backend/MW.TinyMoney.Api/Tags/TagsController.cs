using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using MW.TinyMoney.Api.Tags.ApiModels;

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
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(IEnumerable<TagDetailsDto>))]
        public async Task<IActionResult> GetTags()
        {
            return Ok((await _tagStore.GetTags()).Select(x => new TagDetailsDto()
            {
                Id = x.Id,
                Name = x.Name,
                NumberOfTransactions = x.NumberOfTransactions
            }));
        }

        [HttpPost("")]
        [ProducesResponseType((int)HttpStatusCode.Created)]
        public async Task<IActionResult> AddTag([FromBody] NewTagDto newTag)
        {
            await _tagStore.SaveTag(new Tag()
            {
                Name = newTag.Name
            });
            return StatusCode(StatusCodes.Status201Created);
        }
        
        [HttpPut("{tagId}")]
        [ProducesResponseType((int)HttpStatusCode.Accepted)]
        public async Task<IActionResult> UpdateTag([FromRoute] int tagId, [FromBody] NewTagDto newTag)
        {
            await _tagStore.UpdateTag(tagId, new Tag()
            {
                Name = newTag.Name
            });
            return StatusCode(StatusCodes.Status202Accepted);
        }
        
        [HttpDelete("{id}")]
        [ProducesResponseType((int)HttpStatusCode.Accepted)]
        [ProducesResponseType((int)HttpStatusCode.NotFound)]
        public async Task<IActionResult> DeleteTag(int id)
        {
            var tag = await _tagStore.GetTag(id);
            if (tag == null)
                return NotFound();
            

            await _tagStore.DeleteTag(id);
            return Accepted();
        }
    }
}
