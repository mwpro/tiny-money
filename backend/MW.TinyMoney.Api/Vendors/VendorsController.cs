using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using MW.TinyMoney.Api.Buffer.ApiModels;
using MW.TinyMoney.Api.Tags;

namespace MW.TinyMoney.Api.Vendors
{
    [ApiController, Route("/api/vendors"), Authorize]
    public class VendorsController : ControllerBase
    {
        private readonly IVendorStore _vendorStore;

        public VendorsController(IVendorStore vendorStore)
        {
            _vendorStore = vendorStore;
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
        public async Task<IActionResult> UpdateTag([FromRoute] int vendorId, [FromBody] VendorDto vendorData)
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
    }
}
