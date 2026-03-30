using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace MW.TinyMoney.Api.Plans.ApiModels;

public class UpdatePlanTagRequest : IValidatableObject
{
    public decimal Amount { get; set; }
    public string Description { get; set; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (Amount <= 0)
            yield return new ValidationResult("Amount must be greater than zero.", [nameof(Amount)]);
    }
}