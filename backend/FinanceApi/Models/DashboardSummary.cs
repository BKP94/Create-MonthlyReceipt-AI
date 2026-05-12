namespace FinanceApi.Models;

public class MonthlyTrend
{
    public string Month { get; set; } = string.Empty; // YYYY-MM
    public int Year { get; set; }
    public int MonthNumber { get; set; }
    public string MonthName { get; set; } = string.Empty;
    public decimal TotalExpenses { get; set; }
    public List<Expense> Expenses { get; set; } = [];
}

public class DashboardSummary
{
    public int Year { get; set; }
    public int Month { get; set; }
    public string MonthName { get; set; } = string.Empty;

    // งบประมาณ
    public decimal Salary { get; set; }
    public decimal DebtBudget { get; set; }
    public decimal DailyBudget { get; set; }
    public decimal SavingsBudget { get; set; }

    // ยอดจริงเดือนนี้
    public decimal TotalExpenses { get; set; }
    public decimal Remaining { get; set; }
    public decimal TotalDebtExpenses { get; set; }
    public decimal TotalDailyExpenses { get; set; }
    public decimal TotalInstallmentsMonthly { get; set; }

    // เปอร์เซ็นต์การใช้งาน
    public decimal DebtUsagePercent { get; set; }
    public decimal DailyUsagePercent { get; set; }

    // รายการผ่อนที่ยังค้างอยู่
    public List<Installment> ActiveInstallments { get; set; } = [];

    // รายจ่ายเดือนนี้
    public List<Expense> CurrentMonthExpenses { get; set; } = [];

    // แนวโน้ม 6 เดือนล่าสุด
    public List<MonthlyTrend> MonthlyTrend { get; set; } = [];
}
