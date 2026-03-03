using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using UglyToad.PdfPig;
using UglyToad.PdfPig.DocumentLayoutAnalysis;
using UglyToad.PdfPig.DocumentLayoutAnalysis.PageSegmenter;

namespace MW.TinyMoney.Api.Import.Parsers;

public class VeloBankPdfParser : IFileImportParser
{
    private static readonly CultureInfo PolishCulture = CultureInfo.CreateSpecificCulture("pl-PL");
    private const string HistoryMarker = "Historia rachunku";

    private const string StatementDateFormat = "yyyy.MM.dd";
    
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
        return new List<RawTransaction>();
    }

    public IReadOnlyCollection<RawTransaction> ParseStream(Stream stream)
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
        return ReadStatementText(document);
    }

    private static IReadOnlyCollection<RawTransaction> ReadStatementText(PdfDocument document)
    {
        const double TOLERANCE = 1.0;
        var result = new List<RawTransaction>();

        var firstPage = document.GetPage(1);
        var firstPageWords = firstPage.GetWords();
        const double expectedFontPointSize = 8;
        var firstPageBlocks = RecursiveXYCut.Instance.GetBlocks(firstPageWords)
            .Where(block => block.TextLines.First().Words.First().Letters.First().PointSize == (double)expectedFontPointSize)
            .OrderByDescending(block => block.BoundingBox.TopLeft.Y)
            .ToList();

        var transactionDateHeader = firstPageBlocks.FirstOrDefault(b => b.Text.Equals("Data\ntransakcji", StringComparison.Ordinal));
        var descriptionHeader = firstPageBlocks.FirstOrDefault(b => b.Text.Equals("Saldo początkowe", StringComparison.Ordinal));
        var transactionAmountLeftBoundary = firstPageBlocks.FirstOrDefault(b => b.Text.Equals("Kwota transakcji\nw PLN", StringComparison.Ordinal));
        var transactionAmountRightBoundary = firstPageBlocks.FirstOrDefault(b => b.Text.Equals("Saldo po transakcji\nw PLN", StringComparison.Ordinal));
        if (transactionDateHeader == null || descriptionHeader == null || transactionAmountLeftBoundary == null ||
            transactionAmountRightBoundary == null)
        {
            return result;
        }

        var transactionDateFields = firstPageBlocks.Where(b => 
            Math.Abs(b.BoundingBox.TopLeft.X - transactionDateHeader.BoundingBox.TopLeft.X) < TOLERANCE && 
            b.BoundingBox.TopLeft.Y < transactionDateHeader.BoundingBox.TopLeft.Y).ToArray();
        var transactionDescriptionFields = firstPageBlocks.Where(b => 
            Math.Abs(b.BoundingBox.TopLeft.X - descriptionHeader.BoundingBox.TopLeft.X) < TOLERANCE && 
            b.BoundingBox.TopLeft.Y < descriptionHeader.BoundingBox.TopLeft.Y).ToArray();
        var amountFields = firstPageBlocks.Where(b => 
            b.BoundingBox.TopLeft.X > transactionAmountLeftBoundary.BoundingBox.TopLeft.X && 
            b.BoundingBox.TopLeft.X < transactionAmountRightBoundary.BoundingBox.TopLeft.X && 
            b.BoundingBox.TopLeft.Y < transactionAmountLeftBoundary.BoundingBox.TopLeft.Y).ToArray();

        result.AddRange(PrepareStatementTransactions(transactionDescriptionFields, transactionDateFields, amountFields, StatementDateFormat));

        foreach (var page in document.GetPages().Skip(1))
        {
            var pageWords = page.GetWords();
            var pageBlocks = RecursiveXYCut.Instance.GetBlocks(pageWords)
                .Where(block => block.TextLines.First().Words.First().Letters.First().PointSize == (double)expectedFontPointSize)
                .OrderByDescending(block => block.BoundingBox.TopLeft.Y)
                .ToList();
            
            var pageTransactionDateFields = pageBlocks.Where(b => 
                Math.Abs(b.BoundingBox.TopLeft.X - transactionDateHeader.BoundingBox.TopLeft.X) < TOLERANCE).ToArray();
            var pageTransactionDescriptionFields = pageBlocks.Where(b => 
                Math.Abs(b.BoundingBox.TopLeft.X - descriptionHeader.BoundingBox.TopLeft.X) < TOLERANCE).ToArray();
            var pageAmountFields = pageBlocks.Where(b => 
                b.BoundingBox.TopLeft.X > transactionAmountLeftBoundary.BoundingBox.TopLeft.X && 
                b.BoundingBox.TopLeft.X < transactionAmountRightBoundary.BoundingBox.TopLeft.X).ToArray();

            if (pageTransactionDescriptionFields.First().BoundingBox.TopLeft.Y - pageTransactionDateFields.First().BoundingBox.TopLeft.Y > TOLERANCE)
            {
                var description = pageTransactionDescriptionFields.First().Text.Trim();
                var lastTransaction = result.Last();
                result.Remove(lastTransaction);
                result.Add(lastTransaction with { RawDescription = $"{lastTransaction.RawDescription} {description}"});
                
                pageTransactionDescriptionFields = pageTransactionDescriptionFields.Skip(1).ToArray();
            }
            
            result.AddRange(PrepareStatementTransactions(pageTransactionDescriptionFields, pageTransactionDateFields, pageAmountFields, StatementDateFormat));
        }

        return result;
    }

    private static IEnumerable<RawTransaction> PrepareStatementTransactions(TextBlock[] transactionDescriptionFields,
        TextBlock[] transactionDateFields, TextBlock[] amountFields, string dateFormat)
    {
        for (var i = 0; i < transactionDateFields.Length; i++)
        {
            var description = transactionDescriptionFields.ElementAtOrDefault(i)?.Text.Trim() ?? "";
            var dateRaw = transactionDateFields[i].Text.Trim();
            var amountRaw = amountFields[i].Text.Trim();

            var parsedAmount = decimal.Parse(amountRaw, PolishCulture);
            yield return new RawTransaction(
                Amount: Math.Abs(parsedAmount),
                IsExpense: parsedAmount < 0,
                TransactionDate: DateTime.ParseExact(dateRaw, dateFormat, PolishCulture),
                RawDescription: description);
        }
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
