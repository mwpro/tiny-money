using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using MW.TinyMoney.Api.Buffer.ApiModels;

namespace MW.TinyMoney.Api.Buffer.Parsers;

public class IngCsvBankStatementParser : IBankStatementParser
{
    private static readonly CultureInfo PolishCulture = CultureInfo.CreateSpecificCulture("pl-PL");
    
    public bool CanHandle(BankStatementFile bankStatementFile)
    {
        return bankStatementFile.FileType.Equals("ing", StringComparison.OrdinalIgnoreCase);
    }

    public IEnumerable<BufferedTransaction> Parse(string rawContent)
    {
        var result = new List<BufferedTransaction>();

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
            
            result.Add(CreateBufferedTransaction(description, amount, date));
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

    private static BufferedTransaction CreateBufferedTransaction(string description, string amount, string date)
    {
        return new BufferedTransaction()
        {
            Amount = decimal.Parse(amount, PolishCulture) * -1,
            TransactionDate = DateTime.Parse(date, PolishCulture),
            ImportDate = DateTime.UtcNow,
            RawBankStatementDescription = description
        };
    }
}