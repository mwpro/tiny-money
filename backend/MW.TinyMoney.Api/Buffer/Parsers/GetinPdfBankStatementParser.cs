using System;
using System.Collections.Generic;
using System.Globalization;
using System.Text.RegularExpressions;
using MW.TinyMoney.Api.Buffer.ApiModels;

namespace MW.TinyMoney.Api.Buffer.Parsers;

public class GetinPdfBankStatementParser : IBankStatementParser
{
    private static readonly CultureInfo PolishCulture = CultureInfo.CreateSpecificCulture("pl-PL");

    // (?'transactionDate'\d{4}.\d{2}.\d{2}) (?>\d{4}.\d{2}.\d{2})(?'transactionDecription'(?:.*?\r?\n?)*)(?'transactionAmount'-?(?>\d+\s)?\d{1,3},\d{2}) (?>-?\d+\s?\d{1,3},\d{2})
    private static Regex statementRegex = new Regex(
        "(?'transactionDate'\\d{4}.\\d{2}.\\d{2}) (?>\\d{4}.\\d{2}.\\d{2})(?'transactionDescription'(?:.*?\\r?\\n?)*)(?'transactionAmount'-?(?>\\d+\\s)?\\d{1,3},\\d{2}) (?>-?\\d+\\s?\\d{1,3},\\d{2})",
        RegexOptions.None, TimeSpan.FromSeconds(5));

    public bool CanHandle(BankStatementFile bankStatementFile)
    {
        return bankStatementFile.FileType.Equals("getin", StringComparison.OrdinalIgnoreCase);
    }

    public IEnumerable<BufferedTransaction> Parse(string rawContent)
    {
        var result = new List<BufferedTransaction>();

        var matches = statementRegex.Matches(rawContent);

        foreach (Match match in matches)
        {
            var date = match.Groups.GetValueOrDefault("transactionDate").Value;
            var description = match.Groups.GetValueOrDefault("transactionDescription").Value;
            var amount = match.Groups.GetValueOrDefault("transactionAmount").Value;
            result.Add(CreateBufferedTransaction(description, amount, date));
        }

        return result;
    }

    private static BufferedTransaction CreateBufferedTransaction(string description, string amount, string date)
    { // todo try-catch - parsing may fail
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