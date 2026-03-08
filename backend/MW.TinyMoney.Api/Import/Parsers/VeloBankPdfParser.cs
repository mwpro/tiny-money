using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using UglyToad.PdfPig;
using UglyToad.PdfPig.DocumentLayoutAnalysis;
using UglyToad.PdfPig.DocumentLayoutAnalysis.PageSegmenter;

namespace MW.TinyMoney.Api.Import.Parsers;

public class VeloBankPdfParser : IFileImportParser
{
    private static readonly CultureInfo PolishCulture = CultureInfo.CreateSpecificCulture("pl-PL");
    private const string HistoryMarker = "Historia rachunku";

    private const string StatementDateFormat = "yyyy.MM.dd";
    private const string HistoryDateFormat = "dd.MM.yyyy";
    
    public bool CanHandle(string fileType) =>
        fileType.Equals("velobank", StringComparison.OrdinalIgnoreCase);

    public IReadOnlyCollection<RawTransaction> ParseStream(Stream stream)
    {
        using var document = PdfDocument.Open(stream);

        return IsHistoryPdf(document) 
            ? ReadHistoryText(document) 
            : ReadStatementText(document);
    }

    private static bool IsHistoryPdf(PdfDocument document)
    {
        return document.GetPage(1).Text.Contains(HistoryMarker, StringComparison.OrdinalIgnoreCase);
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

            if (pageTransactionDescriptionFields.Length == 0)
            {
                continue;
            }
            
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

    private static IReadOnlyCollection<RawTransaction> ReadHistoryText(PdfDocument document)
    {
        const double TOLERANCE = 1.0;
        const double AMOUNT_LEFT_BOUNDARY_TOLERANCE = 10.0;
        const double expectedFontPointSize = 5.25;
        var result = new List<RawTransaction>();
        
        
        foreach (var page in document.GetPages())
        {
            var firstPageWords = page.GetWords();
            var pageSegmenter = new RecursiveXYCut(new RecursiveXYCut.RecursiveXYCutOptions()
            {
                DominantFontWidthFunc = _ => page.Letters.Average(l => l.Width * 2), // sometimes description have double spaces but we want them to be a consistend block
            });
            var firstPageBlocks =
            pageSegmenter.GetBlocks(firstPageWords)
                .Where(block => block.TextLines.First().Words.First().Letters.First().PointSize == (double)expectedFontPointSize)
                .OrderByDescending(block => block.BoundingBox.TopLeft.Y)
                .ToList();

            var transactionDateHeader = firstPageBlocks.FirstOrDefault(b => b.Text.Equals("DATA\nTRANSAKCJI", StringComparison.Ordinal));
            var descriptionHeader = firstPageBlocks.FirstOrDefault(b => b.Text.Equals("OPIS TRANSAKCJI", StringComparison.Ordinal));
            var transactionAmountLeftBoundary = firstPageBlocks.FirstOrDefault(b => b.Text.Equals("KWOTA\nTRANSAKCJI", StringComparison.Ordinal));
            var transactionAmountRightBoundary = firstPageBlocks.FirstOrDefault(b => b.Text.Equals("SALDO PO\nTRANSAKCJI", StringComparison.Ordinal));
            if (transactionDateHeader == null || descriptionHeader == null || transactionAmountLeftBoundary == null ||
                transactionAmountRightBoundary == null)
            {
                continue;
            }

            var transactionDateFields = firstPageBlocks.Where(b => 
                Math.Abs(b.BoundingBox.TopLeft.X - transactionDateHeader.BoundingBox.TopLeft.X) < TOLERANCE && 
                b.BoundingBox.TopLeft.Y < transactionDateHeader.BoundingBox.TopLeft.Y).ToArray();
            var transactionDescriptionFields = firstPageBlocks.Where(b => 
                Math.Abs(b.BoundingBox.TopLeft.X - descriptionHeader.BoundingBox.TopLeft.X) < TOLERANCE && 
                b.BoundingBox.TopLeft.Y < descriptionHeader.BoundingBox.TopLeft.Y).ToArray();
            var amountFields = firstPageBlocks.Where(b => 
                b.BoundingBox.TopLeft.X > transactionAmountLeftBoundary.BoundingBox.TopLeft.X - AMOUNT_LEFT_BOUNDARY_TOLERANCE && 
                b.BoundingBox.TopLeft.X < transactionAmountRightBoundary.BoundingBox.TopLeft.X && 
                b.BoundingBox.TopLeft.Y < transactionAmountLeftBoundary.BoundingBox.TopLeft.Y).ToArray();

            result.AddRange(PrepareStatementTransactions(transactionDescriptionFields, transactionDateFields, amountFields, HistoryDateFormat));
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
            var amountRaw = amountFields[i].Text.Replace("PLN", "", StringComparison.OrdinalIgnoreCase).Trim();

            var parsedAmount = decimal.Parse(amountRaw, PolishCulture);
            yield return new RawTransaction(
                Amount: Math.Abs(parsedAmount),
                IsExpense: parsedAmount < 0,
                TransactionDate: DateTime.ParseExact(dateRaw, dateFormat, PolishCulture),
                RawDescription: description);
        }
    }
}
