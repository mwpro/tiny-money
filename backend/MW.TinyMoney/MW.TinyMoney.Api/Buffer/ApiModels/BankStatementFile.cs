using Microsoft.AspNetCore.Http;

namespace MW.TinyMoney.Api.Buffer.ApiModels
{
    public class BankStatementFile
    {
        public IFormFile File { get; set; }
    }
}
