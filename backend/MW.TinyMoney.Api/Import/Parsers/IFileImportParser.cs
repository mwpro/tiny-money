using System.Collections.Generic;
using System.IO;

namespace MW.TinyMoney.Api.Import.Parsers;

public interface IFileImportParser : IImportParser
{
    IReadOnlyList<RawTransaction> ParseStream(Stream stream);
}
