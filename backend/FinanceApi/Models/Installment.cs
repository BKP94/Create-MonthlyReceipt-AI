namespace FinanceApi.Models;

public class Installment
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int TotalInstallments { get; set; }
    public int PaidInstallments { get; set; }
    public decimal MonthlyAmount { get; set; }
    public string StartDate { get; set; } = string.Empty;
    public string? Note { get; set; }

    // คำนวณอัตโนมัติ
    public int RemainingInstallments => TotalInstallments - PaidInstallments;
    public decimal TotalAmount => TotalInstallments * MonthlyAmount;
    public decimal PaidAmount => PaidInstallments * MonthlyAmount;
    public decimal RemainingAmount => RemainingInstallments * MonthlyAmount;
    public bool IsCompleted => PaidInstallments >= TotalInstallments;
}
