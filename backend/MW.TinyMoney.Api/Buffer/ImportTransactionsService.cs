using System.Collections.Generic;
using System.Linq;
using MW.TinyMoney.Api.Buffer.ApiModels;
using MW.TinyMoney.Api.Buffer.Parsers;

namespace MW.TinyMoney.Api.Buffer;

public interface IImportTransactionsService
{
    ICommandResult<int> ImportTransactions(BankStatementFile bankStatementFile);
}

public class ImportTransactionsService : IImportTransactionsService
{
    private readonly IBufferedTransactionStore _bufferedTransactionStore;
    private readonly IEnumerable<IBankStatementParser> _bankStatementParsers;

    public ImportTransactionsService(IBufferedTransactionStore bufferedTransactionStore,
        IEnumerable<IBankStatementParser> bankStatementParsers)
    {
        _bufferedTransactionStore = bufferedTransactionStore;
        _bankStatementParsers = bankStatementParsers;
    }

    public ICommandResult<int> ImportTransactions(BankStatementFile bankStatementFile)
    {
        if (string.IsNullOrWhiteSpace(bankStatementFile.FileType))
        {
            return new InvalidInputResult<int>("File type cannot be empty");
        }
        
        var parser = _bankStatementParsers.FirstOrDefault(x => x.CanHandle(bankStatementFile));
        if (parser == null)
        {
            return new InvalidInputResult<int>("No parser found for given statement type");
        }
        
        var parsingResult = parser.Parse(bankStatementFile.FileContent);
        _bufferedTransactionStore.SaveTransactionsToBuffer(parsingResult);
        return new CommandSuccess<int>(parsingResult.Count());
    }
}