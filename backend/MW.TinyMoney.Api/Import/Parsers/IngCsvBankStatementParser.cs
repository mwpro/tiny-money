using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Text;

namespace MW.TinyMoney.Api.Import.Parsers;

public class IngCsvBankStatementParser : IFileImportParser
{
    private static readonly Encoding FileEncoding = Encoding.GetEncoding("windows-1250");
    private static readonly CultureInfo PolishCulture = CultureInfo.CreateSpecificCulture("pl-PL");

    public bool CanHandle(string fileType) =>
        fileType.Equals("ing", StringComparison.OrdinalIgnoreCase);

    public IReadOnlyCollection<RawTransaction> ParseStream(Stream stream)
    {
        using var reader = new StreamReader(stream, FileEncoding);
        return Parse(reader.ReadToEnd());
    }

    private IReadOnlyList<RawTransaction> Parse(string rawContent)
    {
        var result = new List<RawTransaction>();
        var lines = RemoveContentHeaderAndFooter(rawContent);

        foreach (var line in lines)
        {
            var columns = line.Split(';')
                .Select(x => x.Replace("\"", "").Trim()).ToList();

            var date = columns[0];
            var descriptionParts = new[] { columns[2], columns[3], columns[6] }
                .Select(p => p.Trim())
                .Where(p => !string.IsNullOrWhiteSpace(p));
            var description = string.Join(Environment.NewLine, descriptionParts);
            var amount = !string.IsNullOrWhiteSpace(columns[8]) ? columns[8] : columns[10];

            var parsedAmount = decimal.Parse(amount, PolishCulture);
            result.Add(new RawTransaction(
                Amount: Math.Abs(parsedAmount),
                IsExpense: parsedAmount < 0,
                TransactionDate: DateTime.Parse(date, PolishCulture),
                RawDescription: description));
        }

        return result;
    }

    private static List<string> RemoveContentHeaderAndFooter(string rawContent)
    {
        var lines = rawContent.Split('\n').ToList();
        var headerLineIndex = lines.FindIndex(x => x.Contains("Data transakcji", StringComparison.OrdinalIgnoreCase));

        return lines
            .Skip(headerLineIndex + 1)
            .Where(x => !string.IsNullOrWhiteSpace(x))
            .Where(x => !x.Contains("Dokument ma charakter informacyjny, nie stanowi dowodu księgowego", StringComparison.OrdinalIgnoreCase))
            .ToList();
    }
}
