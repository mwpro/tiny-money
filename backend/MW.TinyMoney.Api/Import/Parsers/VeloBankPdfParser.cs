using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using UglyToad.PdfPig;
using UglyToad.PdfPig.Content;
using UglyToad.PdfPig.DocumentLayoutAnalysis.TextExtractor;
using UglyToad.PdfPig.DocumentLayoutAnalysis.WordExtractor;

namespace MW.TinyMoney.Api.Import.Parsers;

public class VeloBankPdfParser : IFileImportParser
{
    private static readonly CultureInfo PolishCulture = CultureInfo.CreateSpecificCulture("pl-PL");
    private const string HistoryMarker = "Historia rachunku";

    // Statement format: text reconstructed with | separating description from amount column.
    // Row shape: DATE1 DATE2[DESCRIPTION]|AMOUNT BALANCE
    // DATE format: yyyy.MM.dd (e.g. 2025.11.01)
    private static readonly Regex StatementRowRegex = new(
        @"(?<bookDate>\d{4}\.\d{2}\.\d{2}) (?<transDate>\d{4}\.\d{2}\.\d{2})(?<desc>.*?)(?<amount>-?\d{1,3}(?: \d{3})*,\d{2}) \d{1,3}(?: \d{3})*,\d{2}(?:(?<desc2>.*?)?(?=\d{4}\.\d{2}\.\d{2} \d{4}\.\d{2}\.\d{2}))?",
        RegexOptions.Compiled | RegexOptions.Singleline,
        TimeSpan.FromSeconds(15));

    // Account history format: plain text, amounts have " PLN" suffix.
    // Row shape: DD.MM.YYYYDD.MM.YYYY DESCRIPTION AMOUNT PLN BALANCE PLN (dates concatenated)
    private static readonly Regex HistoryRowRegex = new(
        @"(?<transDate>\d{2}\.\d{2}\.\d{4})\d{2}\.\d{2}\.\d{4}(?<desc>.*?)(?<amount>-?\d{1,3}(?: \d{3})*,\d{2}) PLN\d{1,3}(?: \d{3})*,\d{2} PLN",
        RegexOptions.Compiled | RegexOptions.Singleline,
        TimeSpan.FromSeconds(30));

    public bool CanHandle(string fileType) =>
        fileType.Equals("velobank", StringComparison.OrdinalIgnoreCase);

    /// <summary>
    /// Text-based fallback. Not normally called — use ParseStream for correct column handling.
    /// History format works fine here; statement format may have column-bleed edge cases.
    /// </summary>
    public IReadOnlyList<RawTransaction> Parse(string rawContent)
    {
        if (rawContent.Contains(HistoryMarker, StringComparison.OrdinalIgnoreCase))
            return ExtractTransactions(HistoryRowRegex, "dd.MM.yyyy", rawContent);

        return ExtractTransactions(StatementRowRegex, "yyyy.MM.dd", rawContent);
    }

    public IReadOnlyList<RawTransaction> ParseStream(Stream stream)
    {
        using var document = PdfDocument.Open(stream);

        // Detect format from first page
        var firstPageText = document.GetPage(1).Text;
        if (firstPageText.Contains(HistoryMarker, StringComparison.OrdinalIgnoreCase))
        {
            var sb = new StringBuilder();
            foreach (var page in document.GetPages())
                sb.AppendLine(page.Text);
            return ExtractTransactions(HistoryRowRegex, "dd.MM.yyyy", sb.ToString());
        }

        // Statement: column-aware word-level extraction to avoid thousands-separator ambiguity
        var reconstructed =  ReadStatementText(document);
        return ExtractTransactions(StatementRowRegex, "yyyy.MM.dd", reconstructed);
    }

    private static string ReadStatementText(PdfDocument document)
    {
        var sb = new StringBuilder();
        foreach (var page in document.GetPages())
        {
            var words = page.GetWords(NearestNeighbourWordExtractor.Instance).ToList();
            foreach (var word in words)
            {
                if (word.Letters.Count == 0 || word.Letters[0].PointSize < 8) // magic number that filters the document footer annd some headers
                {
                    continue;
                } // todo new lines are lost

                sb.Append($"{word} ");
            }
        }
        
        return sb
            .Replace("    ", " ") // todo funny code - can it be avoided?
            .Replace("   ", " ")
            .Replace("  ", " ")
            .ToString();
    }

    private static IReadOnlyList<RawTransaction> ExtractTransactions(
        Regex regex, string dateFormat, string text)
    {
        var result = new List<RawTransaction>();
        foreach (Match match in regex.Matches(text))
        {
            var dateRaw = match.Groups["transDate"].Value;
            var description = match.Groups["desc"].Value.Trim();
            var descriptionPart2 = match.Groups["desc2"]?.Value?.Trim();
            var amountRaw = match.Groups["amount"].Value.Replace(" ", "");

            var parsedAmount = decimal.Parse(amountRaw, PolishCulture);
            result.Add(new RawTransaction(
                Amount: Math.Abs(parsedAmount),
                IsExpense: parsedAmount < 0,
                TransactionDate: DateTime.ParseExact(dateRaw, dateFormat, PolishCulture),
                RawDescription: $"{description} {descriptionPart2 ?? ""}".Trim()));
        }
        return result;
    }
}
