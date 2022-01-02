namespace MW.TinyMoney.Api.Buffer;

public interface ICommandResult<TResultType>
{
}

public class InvalidInputResult<TReturnType> : ICommandResult<TReturnType>
{
    public InvalidInputResult(string reason)
    {
        Reason = reason;
    }

    public string Reason { get; }
}

public class CommandSuccess<TReturnType> :  ICommandResult<TReturnType>
{
    public CommandSuccess(TReturnType result)
    {
        Result = result;
    }

    public TReturnType Result { get; }
} 