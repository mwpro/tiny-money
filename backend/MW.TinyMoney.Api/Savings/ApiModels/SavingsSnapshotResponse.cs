using System.Collections.Generic;

namespace MW.TinyMoney.Api.Savings.ApiModels;

public class SavingsSnapshotResponse
{
    public IEnumerable<SavingsSnapshotEntryResponseModel> Entries { get; set; } = [];
    public decimal CushionActual { get; set; }
    public decimal CushionTarget { get; set; }
}
