using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace MW.TinyMoney.Api.Plans.ApiModels;

public class CreatePlanRequest : IValidatableObject
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

public class PlanTagDto
{
    public int TagId { get; set; }
    public string TagName { get; set; }
    public decimal Amount { get; set; }
    public string Description { get; set; }
    public decimal Spent { get; set; }
    public decimal SpentPercent { get; set; }
}

public class PlanSummaryDto
{
    public int Id { get; set; }
    public string Title { get; set; }
    public string Description { get; set; }
    public DateTime DateFrom { get; set; }
    public DateTime? DateTo { get; set; }
    public decimal TotalBudget { get; set; }
    public decimal TotalSpent { get; set; }
    public decimal SpentPercent { get; set; }
    public bool IsActive { get; set; }
}

public class PlanDetailDto
{
    public int Id { get; set; }
    public string Title { get; set; }
    public string Description { get; set; }
    public DateTime DateFrom { get; set; }
    public DateTime? DateTo { get; set; }
    public IEnumerable<PlanTagDto> TagLines { get; set; }
}
