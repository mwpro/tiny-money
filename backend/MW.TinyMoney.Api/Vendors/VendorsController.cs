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
        public async Task<IActionResult> GetVendors()
        {
            return Ok(_vendorStore.GetVendors().Select(x => new VendorDto()
            {
                Id = x.Id,
                Name = x.Name,
                DefaultSubcategoryId = x.DefaultSubcategoryId
            }));
        }
    }
}
