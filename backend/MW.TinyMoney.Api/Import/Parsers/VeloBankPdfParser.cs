using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using UglyToad.PdfPig;
using UglyToad.PdfPig.Content;

namespace MW.TinyMoney.Api.Import.Parsers;

public class VeloBankPdfParser : IFileImportParser
{
    private static readonly CultureInfo PolishCulture = CultureInfo.CreateSpecificCulture("pl-PL");
    private const string HistoryMarker = "Historia rachunku";

    // Statement format: text reconstructed with | separating description from amount column.
    // Row shape: DATE1 DATE2[DESCRIPTION]|AMOUNT BALANCE
    // DATE format: yyyy.MM.dd (e.g. 2025.11.01)
    private static readonly Regex StatementRowRegex = new(
        @"(?<bookDate>\d{4}\.\d{2}\.\d{2}) (?<transDate>\d{4}\.\d{2}\.\d{2})(?<desc>[^|]*?)\|(?<amount>-?\d{1,3}(?: \d{3})*,\d{2}) \d{1,3}(?: \d{3})*,\d{2}",
        RegexOptions.Compiled | RegexOptions.Singleline,
        TimeSpan.FromSeconds(30));

    // Matches the two-date prefix that starts every real transaction row in the statement format.
    // Used to distinguish actual transactions from header/footer rows that also have right-column content.
    private static readonly Regex StatementRowPrefix = new(
        @"^\d{4}\.\d{2}\.\d{2} \d{4}\.\d{2}\.\d{2}",
        RegexOptions.Compiled, TimeSpan.FromSeconds(5));

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
        var reconstructed = BuildColumnAwareStatementText(document);
        return ExtractTransactions(StatementRowRegex, "yyyy.MM.dd", reconstructed);
    }

    private static string BuildColumnAwareStatementText(PdfDocument document)
    {
        var sb = new StringBuilder();
        string? pendingLine = null;
        // Learned from transaction rows: X where description text starts (after the two date columns).
        // Footer/header rows start near the left margin (same X as dates), so rows whose leftmost word
        // starts before this threshold are not description continuations and are skipped.
        double descriptionColumnX = double.MaxValue;

        foreach (var page in document.GetPages())
        {
            var words = page.GetWords().ToList();
            if (!words.Any()) continue;

            // The "Kwota transakcji" column starts at ~65 % of page width.
            // Words to the left are dates/description; words to the right are amount/balance.
            var amountColumnX = page.Width * 0.65;

            var rows = GroupIntoRows(words, yTolerance: 5.0);
            foreach (var row in rows)
            {
                var leftWords = row
                    .Where(w => w.BoundingBox.Left < amountColumnX)
                    .OrderBy(w => w.BoundingBox.Left)
                    .ToList();
                var right = string.Join(" ", row
                    .Where(w => w.BoundingBox.Left >= amountColumnX)
                    .OrderBy(w => w.BoundingBox.Left)
                    .Select(w => w.Text));
                var left = string.Join(" ", leftWords.Select(w => w.Text));

                if (string.IsNullOrWhiteSpace(right))
                {
                    // Accept as description continuation only if text starts at the description column.
                    // This filters out footer/header rows that start at the left margin.
                    if (pendingLine != null && leftWords.Count > 0
                        && leftWords[0].BoundingBox.Left >= descriptionColumnX - 10)
                    {
                        var pipeIdx = pendingLine.IndexOf('|');
                        pendingLine = pendingLine[..pipeIdx] + " " + left + pendingLine[pipeIdx..];
                    }
                }
                else
                {
                    // Row with right-column content — flush pending line and start new one.
                    if (pendingLine != null)
                        sb.AppendLine(pendingLine);
                    pendingLine = left + "|" + right;

                    // Learn description column X: start of the 3rd+ word in the left column
                    // (words 1–2 are the two date fields; word 3+ is description text).
                    if (leftWords.Count >= 3)
                    {
                        var descX = leftWords.Skip(2).Min(w => w.BoundingBox.Left);
                        descriptionColumnX = Math.Min(descriptionColumnX, descX);
                    }
                }
            }
        }

        if (pendingLine != null)
            sb.AppendLine(pendingLine);

        return sb.ToString();
    }

    private static List<List<Word>> GroupIntoRows(List<Word> words, double yTolerance)
    {
        var rows = new List<List<Word>>();
        // PDF Y=0 is bottom; higher Y = higher on page. Sort descending for top-to-bottom order.
        foreach (var word in words.OrderByDescending(w => w.BoundingBox.Top))
        {
            var row = rows.FirstOrDefault(r =>
                Math.Abs(r[0].BoundingBox.Top - word.BoundingBox.Top) <= yTolerance);
            if (row != null)
                row.Add(word);
            else
                rows.Add(new List<Word> { word });
        }
        return rows.OrderByDescending(r => r[0].BoundingBox.Top).ToList();
    }

    private static IReadOnlyList<RawTransaction> ExtractTransactions(
        Regex regex, string dateFormat, string text)
    {
        var result = new List<RawTransaction>();
        foreach (Match match in regex.Matches(text))
        {
            var dateRaw = match.Groups["transDate"].Value;
            var description = match.Groups["desc"].Value.Trim();
            var amountRaw = match.Groups["amount"].Value.Replace(" ", "");

            var parsedAmount = decimal.Parse(amountRaw, PolishCulture);
            result.Add(new RawTransaction(
                Amount: Math.Abs(parsedAmount),
                IsExpense: parsedAmount < 0,
                TransactionDate: DateTime.ParseExact(dateRaw, dateFormat, PolishCulture),
                RawDescription: description));
        }
        return result;
    }
}
