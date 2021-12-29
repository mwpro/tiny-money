using System.Collections.Generic;

namespace MW.TinyMoney.Api.Reports
{
    public class ReportModel<TValue>
    {
        public IEnumerable<string> Labels { get; set; }

        public IEnumerable<ReportDataSet<TValue>> Datasets { get; set; }
    }
    
    public class ReportDataSet<TValue>
    {
        public string Label { get; set; }
        public IEnumerable<TValue> Data { get; set; }
    }
}