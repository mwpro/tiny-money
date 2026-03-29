using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace MW.TinyMoney.Api.Plans.ApiModels;

public class UpdatePlanRequest : IValidatableObject
{
    public string Title { get; set; }
    public string Description { get; set; }
    public DateTime DateFrom { get; set; }
    public DateTime? DateTo { get; set; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (string.IsNullOrWhiteSpace(Title))
            yield return new ValidationResult("Title is required.", [nameof(Title)]);
        if (DateTo.HasValue && DateTo.Value < DateFrom)
            yield return new ValidationResult("DateTo must be on or after DateFrom.", [nameof(DateTo)]);
    }
}