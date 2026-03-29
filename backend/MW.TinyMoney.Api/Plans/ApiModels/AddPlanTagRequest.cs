using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace MW.TinyMoney.Api.Plans.ApiModels;

public class AddPlanTagRequest : IValidatableObject
{
    public int TagId { get; set; }
    public decimal Amount { get; set; }
    public string Description { get; set; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (TagId <= 0)
            yield return new ValidationResult("TagId is required.", [nameof(TagId)]);
        if (Amount <= 0)
            yield return new ValidationResult("Amount must be greater than zero.", [nameof(Amount)]);
    }
}