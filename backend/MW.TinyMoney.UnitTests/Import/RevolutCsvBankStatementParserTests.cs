using System;
using System.IO;
using System.Text;
using FluentAssertions;
using MW.TinyMoney.Api.Import.Parsers;
using Xunit;

namespace MW.TinyMoney.UnitTests.Import;

public class RevolutCsvBankStatementParserTests
{
    private readonly RevolutCsvBankStatementParser _parser = new();

    private static Stream ToStream(string csv) =>
        new MemoryStream(Encoding.UTF8.GetBytes(csv));

    private const string Header = "Rodzaj,Produkt,Data rozpoczęcia,Data zrealizowania,Opis,Kwota,Opłata,Waluta,State,Saldo\n";

    [Fact]
    public void CanHandle_ReturnsTrueForRevolut()
    {
        _parser.CanHandle("revolut").Should().BeTrue();
        _parser.CanHandle("Revolut").Should().BeTrue();
        _parser.CanHandle("REVOLUT").Should().BeTrue();
    }

    [Fact]
    public void CanHandle_ReturnsFalseForOtherTypes()
    {
        _parser.CanHandle("ing").Should().BeFalse();
        _parser.CanHandle("pekao").Should().BeFalse();
    }

    [Fact]
    public void ParseStream_BasicExpense_ReturnsCorrectTransaction()
    {
        var csv = Header +
                  "Płatność kartą,Bieżące,2025-06-15 12:30:00,2025-06-16 10:00:00,Allegro,-47.96,0.00,PLN,ZAKOŃCZONO,200.00\n";

        var result = _parser.ParseStream(ToStream(csv));

        result.Should().SatisfyRespectively(tx =>
        {
            tx.Amount.Should().Be(47.96m);
            tx.IsExpense.Should().BeTrue();
            tx.TransactionDate.Should().Be(new DateTime(2025, 6, 15, 12, 30, 0));
            tx.RawDescription.Should().Be($"Allegro{Environment.NewLine}Płatność kartą");
        });
    }

    [Fact]
    public void ParseStream_BasicIncome_IsExpenseFalse()
    {
        var csv = Header +
                  "Zasilenie,Bieżące,2025-06-10 08:00:00,2025-06-10 08:00:05,Zasilenie {xPay} za pomocą {card},500.00,0.00,PLN,ZAKOŃCZONO,500.00\n";

        var result = _parser.ParseStream(ToStream(csv));

        result.Should().ContainSingle()
            .Which.IsExpense.Should().BeFalse();
    }

    [Fact]
    public void ParseStream_Transfer_IsExpenseFalse()
    {
        var csv = Header +
                  "Przelew,Bieżące,2025-07-01 09:00:00,2025-07-01 09:00:01,Przelew od: JAN KOWALSKI,1000.00,0.00,PLN,ZAKOŃCZONO,1000.00\n";

        var result = _parser.ParseStream(ToStream(csv));

        result.Should().ContainSingle()
            .Which.IsExpense.Should().BeFalse();
    }

    [Fact]
    public void ParseStream_CancelledTransaction_IsSkipped()
    {
        var csv = Header +
                  "Płatność kartą,Bieżące,2025-06-15 11:00:00,,Amazon,-2.86,0.00,PLN,COFNIĘTO,\n";

        var result = _parser.ParseStream(ToStream(csv));

        result.Should().BeEmpty();
    }

    [Fact]
    public void ParseStream_Wymiana_IsSkipped()
    {
        var csv = Header +
                  "Wymiana,Bieżące,2025-06-20 10:00:00,2025-06-20 10:00:00,Wymiana na EUR,-500.00,0.00,PLN,ZAKOŃCZONO,0.00\n";

        var result = _parser.ParseStream(ToStream(csv));

        result.Should().BeEmpty();
    }

    [Fact]
    public void ParseStream_NonZeroFee_AddedToAmountAndDescription()
    {
        var csv = Header +
                  "Płatność kartą,Bieżące,2025-09-09 08:41:43,2025-09-10 10:11:58,Monoprix,-29.82,0.30,PLN,ZAKOŃCZONO,100.00\n";

        var result = _parser.ParseStream(ToStream(csv));

        var tx = result.Should().ContainSingle().Subject;
        tx.Amount.Should().Be(30.12m);
        tx.RawDescription.Should().Contain("Opłata: 0.30 PLN");
    }

    [Fact]
    public void ParseStream_QuotedDescriptionWithEmbeddedQuote_ParsedCorrectly()
    {
        var csv = Header +
                  "Płatność kartą,Bieżące,2025-05-22 22:05:37,2025-05-24 15:22:51,\"Hellopay Kereskedo\"\"\",-24.14,0.00,PLN,ZAKOŃCZONO,100.00\n";

        var result = _parser.ParseStream(ToStream(csv));

        var tx = result.Should().ContainSingle().Subject;
        tx.RawDescription.Should().StartWith("Hellopay Kereskedo\"");
        tx.Amount.Should().Be(24.14m);
    }

    [Fact]
    public void ParseStream_MixedRows_ReturnsOnlyValidCompletedNonExchangeRows()
    {
        var csv = Header +
                  // valid expense
                  "Płatność kartą,Bieżące,2025-06-15 12:00:00,2025-06-16 10:00:00,Shop A,-30.00,0.00,PLN,ZAKOŃCZONO,200.00\n" +
                  // cancelled - skip
                  "Płatność kartą,Bieżące,2025-06-15 13:00:00,,Shop B,-10.00,0.00,PLN,COFNIĘTO,\n" +
                  // exchange - skip
                  "Wymiana,Bieżące,2025-06-16 08:00:00,2025-06-16 08:00:00,Wymiana na USD,-200.00,0.00,PLN,ZAKOŃCZONO,0.00\n" +
                  // valid income
                  "Zasilenie,Bieżące,2025-06-17 09:00:00,2025-06-17 09:00:05,Zasilenie {xPay} za pomocą {card},1000.00,0.00,PLN,ZAKOŃCZONO,1000.00\n";

        var result = _parser.ParseStream(ToStream(csv));

        result.Should().SatisfyRespectively(
            expense =>
            {
                expense.RawDescription.Should().StartWith("Shop A");
                expense.IsExpense.Should().BeTrue();
                expense.Amount.Should().Be(30.00m);
            },
            income =>
            {
                income.IsExpense.Should().BeFalse();
                income.Amount.Should().Be(1000.00m);
            });
    }

    [Fact]
    public void SplitCsvLine_SimpleFields_SplitsCorrectly()
    {
        var result = RevolutCsvBankStatementParser.SplitCsvLine("a,b,c");
        result.Should().Equal("a", "b", "c");
    }

    [Fact]
    public void SplitCsvLine_QuotedFieldWithComma_TreatedAsSingleField()
    {
        var result = RevolutCsvBankStatementParser.SplitCsvLine("a,\"b,c\",d");
        result.Should().Equal("a", "b,c", "d");
    }

    [Fact]
    public void SplitCsvLine_QuotedFieldWithEscapedQuote_UnescapesQuote()
    {
        var result = RevolutCsvBankStatementParser.SplitCsvLine("a,\"say \"\"hello\"\"\",b");
        result.Should().Equal("a", "say \"hello\"", "b");
    }
}
