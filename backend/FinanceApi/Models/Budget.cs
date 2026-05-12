namespace FinanceApi.Models;

public class Budget
{
    public decimal Salary { get; set; } = 42334m;
    public decimal SocialSecurity { get; set; } = 0m;    // ประกันสังคม
    public decimal StudentLoan { get; set; } = 0m;        // กยศ.
    public decimal OtherDeductions { get; set; } = 0m;   // อื่นๆ
    public decimal DebtPercent { get; set; } = 50m;
    public decimal DailyExpensePercent { get; set; } = 30m;
    public decimal SavingsPercent { get; set; } = 20m;
    public string UpdatedAt { get; set; } = string.Empty;

    // เงินเดือนสุทธิ = เงินเดือน - ประกันสังคม - กยศ. - อื่นๆ
    public decimal TotalDeductions => SocialSecurity + StudentLoan + OtherDeductions;
    public decimal NetSalary => Salary - TotalDeductions;

    // คำนวณงบแต่ละส่วนจากเงินเดือนสุทธิ
    public decimal DebtBudget => Math.Round(NetSalary * DebtPercent / 100, 2);
    public decimal DailyBudget => Math.Round(NetSalary * DailyExpensePercent / 100, 2);
    public decimal SavingsBudget => Math.Round(NetSalary * SavingsPercent / 100, 2);
}
