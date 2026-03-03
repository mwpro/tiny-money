using System.Collections.Generic;
using System.IO;

namespace MW.TinyMoney.Api.Import.Parsers;

public interface IFileImportParser : IImportParser
{
    IReadOnlyCollection<RawTransaction> ParseStream(Stream stream);
}
