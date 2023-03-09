using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Text.RegularExpressions;
using MW.TinyMoney.Api.Buffer.ApiModels;

namespace MW.TinyMoney.Api.Buffer.Parsers;

public class PekaoCsvBankStatementParser : IBankStatementParser
{
    private static readonly CultureInfo PolishCulture = CultureInfo.CreateSpecificCulture("pl-PL");
    private static readonly Regex NotInterestingDataFilter = new("[a-zA-Z]", RegexOptions.None, TimeSpan.FromSeconds(5));

    
    public bool CanHandle(BankStatementFile bankStatementFile)
    {
        return bankStatementFile.FileType.Equals("pekao", StringComparison.OrdinalIgnoreCase);
    }

    public IEnumerable<BufferedTransaction> Parse(string rawContent)
    {
        var result = new List<BufferedTransaction>();

        var lines = rawContent.Split('\n').Skip(1).ToList();

        foreach (var line in lines)
        {
            if (string.IsNullOrWhiteSpace(line))
                continue;
            var columns = line.Split(';');
            
            var date = columns[0];
            var description = 
                              $"{columns[10]}{Environment.NewLine}{columns[2]}{Environment.NewLine}" +
                              (NotInterestingDataFilter.IsMatch(columns[3]) ? $"{columns[3]}{Environment.NewLine}" : string.Empty) +
                              (NotInterestingDataFilter.IsMatch(columns[6]) ? columns[6] : string.Empty);
            var amount = columns[7];
            
            result.Add(CreateBufferedTransaction(description, amount, date));
        }
        
        return result;
    }

    private static BufferedTransaction CreateBufferedTransaction(string description, string amount, string date)
    {
        var parsedAmount = decimal.Parse(amount, PolishCulture);
        return new BufferedTransaction()
        {
            Amount = Math.Abs(parsedAmount),
            IsExpense = parsedAmount < 0,
            TransactionDate = DateTime.Parse(date, PolishCulture),
            ImportDate = DateTime.UtcNow,
            RawBankStatementDescription = description
        };
    }
}