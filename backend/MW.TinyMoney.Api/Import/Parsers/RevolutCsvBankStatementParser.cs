using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Text;

namespace MW.TinyMoney.Api.Import.Parsers;

public class RevolutCsvBankStatementParser : IFileImportParser
{
    public bool CanHandle(string fileType) =>
        fileType.Equals("revolut", StringComparison.OrdinalIgnoreCase);

    public IReadOnlyCollection<RawTransaction> ParseStream(Stream stream)
    {
        using var reader = new StreamReader(stream, Encoding.UTF8);
        return Parse(reader.ReadToEnd());
    }

    private static IReadOnlyList<RawTransaction> Parse(string rawContent)
    {
        var result = new List<RawTransaction>();
        var lines = rawContent.Split('\n');

        // First line is the header
        for (var i = 1; i < lines.Length; i++)
        {
            var line = lines[i].Trim();
            if (string.IsNullOrWhiteSpace(line))
                continue;

            var columns = SplitCsvLine(line);
            if (columns.Count < 9)
                continue;

            var type = columns[0];
            var startDate = columns[2];
            var title = columns[4];
            var amountStr = columns[5];
            var feeStr = columns[6];
            var state = columns[8];

            if (type.Equals("Wymiana", StringComparison.OrdinalIgnoreCase))
                continue;
            if (state.Equals("COFNIĘTO", StringComparison.OrdinalIgnoreCase))
                continue;

            var amount = decimal.Parse(amountStr, CultureInfo.InvariantCulture);
            var fee = decimal.Parse(feeStr, CultureInfo.InvariantCulture);

            var descriptionParts = new List<string> { title, type };
            if (fee > 0)
                descriptionParts.Add($"Opłata: {fee.ToString(CultureInfo.InvariantCulture)} PLN");
            var description = string.Join(Environment.NewLine, descriptionParts);

            result.Add(new RawTransaction(
                Amount: Math.Abs(amount) + fee,
                IsExpense: amount < 0,
                TransactionDate: DateTime.Parse(startDate, CultureInfo.InvariantCulture),
                RawDescription: description));
        }

        return result;
    }

    public static List<string> SplitCsvLine(string line)
    {
        var result = new List<string>();
        var current = new StringBuilder();
        var inQuotes = false;

        for (var i = 0; i < line.Length; i++)
        {
            var c = line[i];
            if (inQuotes)
            {
                if (c == '"')
                {
                    if (i + 1 < line.Length && line[i + 1] == '"')
                    {
                        current.Append('"');
                        i++;
                    }
                    else
                    {
                        inQuotes = false;
                    }
                }
                else
                {
                    current.Append(c);
                }
            }
            else
            {
                if (c == '"')
                {
                    inQuotes = true;
                }
                else if (c == ',')
                {
                    result.Add(current.ToString());
                    current.Clear();
                }
                else
                {
                    current.Append(c);
                }
            }
        }

        result.Add(current.ToString());
        return result;
    }
}
