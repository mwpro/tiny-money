namespace MW.TinyMoney.Api.Tags.ApiModels
{
    public class TagDto
    {
        public int? Id { get; set; }
        public string Name { get; set; }
    }

    public class NewTagDto
    {
        public string Name { get; set; }
    }

    public class TagDetailsDto
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public int NumberOfTransactions { get; set; }
        public int NumberOfPlans { get; set; }
    }
}
