using System.Collections.Generic;

namespace MW.TinyMoney.Api.Import.Parsers;

public interface IImportParser
{
    bool CanHandle(string fileType);
    IReadOnlyList<RawTransaction> Parse(string rawContent);
}
