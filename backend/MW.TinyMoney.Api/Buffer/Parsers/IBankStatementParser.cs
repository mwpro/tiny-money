using System.Collections.Generic;
using MW.TinyMoney.Api.Buffer.ApiModels;

namespace MW.TinyMoney.Api.Buffer.Parsers
{
    public interface IBankStatementParser
    {
        bool CanHandle(BankStatementFile bankStatementFile);
        IEnumerable<BufferedTransaction> Parse(string rawContent);
    }
}
