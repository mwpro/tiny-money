using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace MW.TinyMoney.Api.Plans.ApiModels
{
    public class CreatePlanRequest
    {
        [Required]
        public string Title { get; set; }
        public string Description { get; set; }
        [Required]
        public DateTime DateFrom { get; set; }
        public DateTime? DateTo { get; set; }
    }

    public class UpdatePlanRequest
    {
        [Required]
        public string Title { get; set; }
        public string Description { get; set; }
        [Required]
        public DateTime DateFrom { get; set; }
        public DateTime? DateTo { get; set; }
    }

    public class AddPlanTagRequest
    {
        [Required]
        public int TagId { get; set; }
        [Required]
        public decimal Amount { get; set; }
        public string Description { get; set; }
    }

    public class UpdatePlanTagRequest
    {
        [Required]
        public decimal Amount { get; set; }
        public string Description { get; set; }
    }

    public class PlanTagDto
    {
        public int Id { get; set; }
        public int TagId { get; set; }
        public string TagName { get; set; }
        public decimal Amount { get; set; }
        public string Description { get; set; }
        public decimal Spent { get; set; }
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
}
