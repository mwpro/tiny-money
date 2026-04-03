using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace MW.TinyMoney.Api.Savings.ApiModels;

public class UpdateSavingsGoalRequest
{
    [Required, MaxLength(100)]
    public string Name { get; set; } = "";

    [Range(0.01, 9999999999.99)]
    public decimal TargetAmount { get; set; }

    public DateOnly? TargetDate { get; set; }

    public IReadOnlyCollection<int> CategoryIds { get; set; } = [];
}
