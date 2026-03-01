using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;

namespace MW.TinyMoney.Api.Import.Parsers;

public class IngCsvBankStatementParser
{
    private static readonly CultureInfo PolishCulture = CultureInfo.CreateSpecificCulture("pl-PL");

    public bool CanHandle(string fileType) =>
        fileType.Equals("ing", StringComparison.OrdinalIgnoreCase);

    public IReadOnlyList<RawTransaction> Parse(string rawContent)
    {
        var result = new List<RawTransaction>();
        var lines = RemoveContentHeaderAndFooter(rawContent);

        foreach (var line in lines)
        {
            var columns = line.Split(';')
                .Select(x => x.Replace("\"", "")).ToList();

            var date = columns[0];
            var description =
                $"{columns[2]}{Environment.NewLine}" +
                $"{columns[3]}{Environment.NewLine}" +
                $"{columns[6]}{Environment.NewLine}";
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
