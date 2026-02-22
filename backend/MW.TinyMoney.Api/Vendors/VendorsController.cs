using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MW.TinyMoney.Api.Buffer.ApiModels;

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

        [HttpGet, Route("")]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(IEnumerable<VendorDto>))]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(IEnumerable<VendorDetails>))]
        public async Task<IActionResult> GetVendors([FromQuery] bool? detailed = false)
        {
            if (detailed.HasValue && detailed.Value)
            {
                return Ok(await _vendorStore.GetDetailedVendors());
            }
            else
            {
                return Ok((await _vendorStore.GetVendors()).Select(x => new VendorDto()
                {
                    Id = x.Id,
                    Name = x.Name,
                    DefaultSubcategoryId = x.DefaultSubcategoryId
                }));
            }
        }
    }
}
