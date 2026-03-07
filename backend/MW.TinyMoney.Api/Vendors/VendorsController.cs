using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using MW.TinyMoney.Api.Buffer.ApiModels;
using MW.TinyMoney.Api.Vendors.Matching;

namespace MW.TinyMoney.Api.Vendors
{
    public record VendorAliasDto(int Id, string Alias);
    public record AddVendorAliasRequest(string Alias);
    public record VendorSuggestionDto(int VendorId, string VendorName, int DefaultSubcategoryId);

    [ApiController, Route("/api/vendors"), Authorize]
    public class VendorsController : ControllerBase
    {
        private readonly IVendorStore _vendorStore;
        private readonly IVendorMatchingService _vendorMatchingService;

        public VendorsController(IVendorStore vendorStore, IVendorMatchingService vendorMatchingService)
        {
            _vendorStore = vendorStore;
            _vendorMatchingService = vendorMatchingService;
        }

        [HttpGet("")]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(IEnumerable<VendorDto>))]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(IEnumerable<VendorDetails>))]
        public async Task<IActionResult> GetVendors([FromQuery] bool? detailed = false)
        {
            if (detailed.HasValue && detailed.Value)
            {
                return Ok(await _vendorStore.GetDetailedVendors());
            }

            return Ok((await _vendorStore.GetVendors()).Select(x => new VendorDto()
            {
                Id = x.Id,
                Name = x.Name,
                DefaultSubcategoryId = x.DefaultSubcategoryId
            }));
        }
        
        [HttpPost("")]
        [ProducesResponseType((int)HttpStatusCode.Created)]
        public async Task<IActionResult> AddVendor([FromBody] VendorDto newVendor)
        {
            if (!newVendor.DefaultSubcategoryId.HasValue)
                ModelState.AddModelError(nameof(newVendor.DefaultSubcategoryId), "Default subcategory id must be specified");
            if (!ModelState.IsValid)
                return BadRequest(ModelState);
            
            await _vendorStore.SaveVendor(new Vendor()
            {
                Name = newVendor.Name,
                DefaultSubcategoryId = newVendor.DefaultSubcategoryId.Value
            });
            
            return StatusCode(StatusCodes.Status201Created);
        }
        
        [HttpPut("{vendorId}")]
        [ProducesResponseType((int)HttpStatusCode.Accepted)]
        public async Task<IActionResult> UpdateVendor([FromRoute] int vendorId, [FromBody] VendorDto vendorData)
        {
            if (!vendorData.DefaultSubcategoryId.HasValue)
                ModelState.AddModelError(nameof(vendorData.DefaultSubcategoryId), "Default subcategory id must be specified");
            if (!ModelState.IsValid)
                return BadRequest(ModelState);
            await _vendorStore.UpdateVendor(vendorId, new Vendor()
            {
                Name = vendorData.Name,
                DefaultSubcategoryId = vendorData.DefaultSubcategoryId.Value
            });
            return StatusCode(StatusCodes.Status202Accepted);
        }

        [HttpDelete("{vendorId}")]
        [ProducesResponseType((int)HttpStatusCode.Accepted)]
        [ProducesResponseType((int)HttpStatusCode.BadRequest)]
        [ProducesResponseType((int)HttpStatusCode.NotFound)]
        public async Task<IActionResult> DeleteVendor([FromRoute] int vendorId, [FromBody] DeleteVendorRequest deleteVendorRequest)
        {
            var vendorToDelete = await _vendorStore.GetVendorDetails(vendorId);
            if (vendorToDelete == null)
            {
                return NotFound();
            }
            await ValidateMergeVendor();
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            await _vendorStore.DeleteVendor(vendorToDelete, deleteVendorRequest.MergeToVendorId);

            return Accepted();

            async Task ValidateMergeVendor()
            {
                if (vendorToDelete.NumberOfTransactions > 0)
                {
                    if (!deleteVendorRequest.MergeToVendorId.HasValue)
                    {
                        ModelState.AddModelError(nameof(deleteVendorRequest.MergeToVendorId), "Merge to vendor must be specified since there are transactions related to deleted vendor");
                        return;
                    }
                    if (vendorId == deleteVendorRequest.MergeToVendorId)
                    {
                        ModelState.AddModelError(nameof(deleteVendorRequest.MergeToVendorId), "Merge to vendor must be different than deleted vendor");
                        return;
                    }
                    var vendorToMerge = await _vendorStore.GetVendorDetails(deleteVendorRequest.MergeToVendorId.Value);
                    if (vendorToMerge == null)
                    {
                        ModelState.AddModelError(nameof(deleteVendorRequest.MergeToVendorId), "Vendor selected for merge does not exist");
                        return;
                    }
                }
            }
        }

        [HttpGet("suggest")]
        [ProducesResponseType(typeof(VendorSuggestionDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        public async Task<IActionResult> SuggestVendor([FromQuery] string description)
        {
            var vendors = await _vendorMatchingService.SuggestVendor(description, 5);
            if (!vendors.Any())
                return NoContent();
            return Ok(vendors.Select(vendor => new VendorSuggestionDto(vendor.Id, vendor.Name, vendor.DefaultSubcategoryId)));
        }

        [HttpGet("{vendorId}/aliases")]
        [ProducesResponseType(typeof(IEnumerable<VendorAliasDto>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetAliases([FromRoute] int vendorId)
        {
            var aliases = await _vendorStore.GetVendorAliases(vendorId);
            return Ok(aliases.Select(a => new VendorAliasDto(a.Id, a.Alias)));
        }

        [HttpPost("{vendorId}/aliases")]
        [ProducesResponseType(typeof(VendorAliasDto), StatusCodes.Status201Created)]
        public async Task<IActionResult> AddAlias([FromRoute] int vendorId, [FromBody] AddVendorAliasRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Alias))
                return BadRequest("Alias cannot be empty");
            var result = await _vendorStore.AddVendorAlias(vendorId, request.Alias.Trim());
            if (!result.IsSuccess)
                return Conflict(result.Error);
            return StatusCode(StatusCodes.Status201Created, new VendorAliasDto(result.Value!.Id, result.Value.Alias));
        }

        [HttpDelete("{vendorId}/aliases/{aliasId}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        public async Task<IActionResult> DeleteAlias([FromRoute] int vendorId, [FromRoute] int aliasId)
        {
            await _vendorStore.DeleteVendorAlias(aliasId);
            return NoContent();
        }
    }
}
