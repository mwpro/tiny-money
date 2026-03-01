using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Text.RegularExpressions;

namespace MW.TinyMoney.Api.Import.Parsers;

public class PekaoCsvBankStatementParser : IImportParser
{
    private static readonly CultureInfo PolishCulture = CultureInfo.CreateSpecificCulture("pl-PL");
    private static readonly Regex NotInterestingDataFilter = new("[a-zA-Z]", RegexOptions.None, TimeSpan.FromSeconds(5));

    public bool CanHandle(string fileType) =>
        fileType.Equals("pekao", StringComparison.OrdinalIgnoreCase);

    public IReadOnlyList<RawTransaction> Parse(string rawContent)
    {
        var result = new List<RawTransaction>();
        var lines = rawContent.Split('\n').Skip(1).ToList();

        foreach (var line in lines)
        {
            if (string.IsNullOrWhiteSpace(line))
                continue;
            var columns = line.Split(';');

            var date = columns[0];
            var descriptionParts = new[]
                {
                    columns[10].Trim(),
                    columns[2].Trim(),
                    NotInterestingDataFilter.IsMatch(columns[3]) ? columns[3].Trim() : null,
                    NotInterestingDataFilter.IsMatch(columns[6]) ? columns[6].Trim() : null
                }
                .Where(p => !string.IsNullOrWhiteSpace(p));
            var description = string.Join(Environment.NewLine, descriptionParts);
            var amount = columns[7];

            var parsedAmount = decimal.Parse(amount, PolishCulture);
            result.Add(new RawTransaction(
                Amount: Math.Abs(parsedAmount),
                IsExpense: parsedAmount < 0,
                TransactionDate: DateTime.Parse(date, PolishCulture),
                RawDescription: description));
        }

        return result;
    }
}
