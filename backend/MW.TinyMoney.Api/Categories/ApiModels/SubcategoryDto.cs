namespace MW.TinyMoney.Api.Categories.ApiModels;

public class SubcategoryDto
{
    public int Id { get; set; }
    public string Name { get; set; }
}

public class DetailedSubcategoryDto
{
    public int Id { get; set; }
    public string Name { get; set; }
    public bool IsDeleted { get; set; }
    public bool HasUsages { get; set; }
}
