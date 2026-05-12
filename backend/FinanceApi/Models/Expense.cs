namespace FinanceApi.Models;

public class Expense
{
    public int Id { get; set; }
    public int Year { get; set; }
    public int Month { get; set; }
    public string Name { get; set; } = string.Empty;
    public decimal Amount { get; set; }

    // หมวดหมู่: debt=หนี้/ผ่อน, daily=ประจำวัน, savings=เงินเก็บ, other=อื่นๆ
    public string Category { get; set; } = "other";
    public string? DueDate { get; set; }
    public string? Note { get; set; }
    public bool IsPaid { get; set; } = false;
}
