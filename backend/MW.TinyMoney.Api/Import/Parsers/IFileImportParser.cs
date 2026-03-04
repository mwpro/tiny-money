using System.Collections.Generic;
using System.IO;

namespace MW.TinyMoney.Api.Import.Parsers;

public interface IFileImportParser
{
    IReadOnlyCollection<RawTransaction> ParseStream(Stream stream);
    bool CanHandle(string fileType);
}
