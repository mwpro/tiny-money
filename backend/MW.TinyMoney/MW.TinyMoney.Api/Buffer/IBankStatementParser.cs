using System;
using System.Collections.Generic;
using System.Globalization;
using System.Text.RegularExpressions;
using MW.TinyMoney.Api.Buffer.ApiModels;

namespace MW.TinyMoney.Api.Controllers
{
    //public class BufferedTransaction
    //{
    //    public int Id { get; set; }
    //    public decimal Amount { get; set; }
    //    public DateTime ImportDate { get; set; }
    //    public DateTime TransactionDate { get; set; }
    //    // public int? MatchedVendorId { get; private set; }
    //    // public int? MatchedSubcategoryId { get; private set; }
    //    public string RawBankStatementDescription { get; set; }
    //}

    public interface IBankStatementParser
    {
        IEnumerable<BufferedTransaction> Parse(string rawContent);
    }

    public class GetinPdfBankStatementParser : IBankStatementParser
    {
        private readonly static CultureInfo PolishCulture = CultureInfo.CreateSpecificCulture("pl-PL");

        // (?'transactionDate'\d{4}.\d{2}.\d{2})\s(?'postingDate'\d{4}.\d{2}.\d{2})\s(?'transactionDecription'(?:.*?\r?\n?)*)(?'transactionAmount'-?(?>\d+\s)?\d{1,3},\d{2})\s(?>-?(?>\d+\s)?\d{1,3},\d{2})
        private static Regex statementRegex = new Regex(
            "(?'transactionDate'\\d{4}.\\d{2}.\\d{2})\\s(?'postingDate'\\d{4}.\\d{2}.\\d{2})\\s(?'transactionDecription'(?:.*?\\r?\\n?)*)(?'transactionAmount'-?(?>\\d+\\s)?\\d{1,3},\\d{2})\\s(?>-?(?>\\d+\\s)?\\d{1,3},\\d{2})");

        public IEnumerable<BufferedTransaction> Parse(string rawContent)
        {
            var result = new List<BufferedTransaction>();

            var matches = statementRegex.Matches(rawContent);

            foreach (Match match in matches)
            {
                var date = match.Groups.GetValueOrDefault("transactionDate").Value;
                var description = match.Groups.GetValueOrDefault("transactionDecription").Value;
                var amount = match.Groups.GetValueOrDefault("transactionAmount").Value;
                result.Add(CreateBufferedTransaction(description, amount, date));
            }

            return result;
        }

        private static BufferedTransaction CreateBufferedTransaction(string description, string amount, string date)
        { // todo try-catch - parsing may fail
            return new BufferedTransaction()
            {
                Amount = decimal.Parse(amount, PolishCulture) * -1,
                TransactionDate = DateTime.Parse(date, PolishCulture),
                ImportDate = DateTime.UtcNow,
                RawBankStatementDescription = description
            };
        }
    }
}
