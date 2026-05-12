using Microsoft.AspNetCore.Mvc;
using FinanceApi.Models;
using FinanceApi.Services;

namespace FinanceApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DashboardController(CsvDataService csv) : ControllerBase
{
    private static readonly string[] ThaiMonths =
    [
        "", "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
        "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
    ];

    [HttpGet]
    public IActionResult Get([FromQuery] int? year, [FromQuery] int? month)
    {
        var now = DateTime.Now;
        int y = year ?? now.Year;
        int m = month ?? now.Month;

        if (m is < 1 or > 12)
            return BadRequest(new { message = "เดือนต้องอยู่ระหว่าง 1-12" });

        var budget = csv.GetBudget();
        var allExpenses = csv.GetAllExpenses();
        var installments = csv.GetAllInstallments();

        var currentExpenses = allExpenses
            .Where(e => e.Year == y && e.Month == m)
            .ToList();

        var totalDebt = currentExpenses
            .Where(e => e.Category == "debt")
            .Sum(e => e.Amount);

        var totalDaily = currentExpenses
            .Where(e => e.Category == "daily")
            .Sum(e => e.Amount);

        var activeInstallments = installments.Where(i => !i.IsCompleted).ToList();
        var totalInstallmentsMonthly = activeInstallments.Sum(i => i.MonthlyAmount);

        var totalExpenses = currentExpenses.Sum(e => e.Amount);

        var trend = BuildTrend(allExpenses, y, m);

        var summary = new DashboardSummary
        {
            Year = y,
            Month = m,
            MonthName = $"{ThaiMonths[m]} {y + 543}",

            Salary = budget.Salary,
            DebtBudget = budget.DebtBudget,
            DailyBudget = budget.DailyBudget,
            SavingsBudget = budget.SavingsBudget,

            TotalExpenses = totalExpenses,
            Remaining = budget.Salary - totalExpenses,
            TotalDebtExpenses = totalDebt,
            TotalDailyExpenses = totalDaily,
            TotalInstallmentsMonthly = totalInstallmentsMonthly,

            DebtUsagePercent = budget.DebtBudget > 0
                ? Math.Round(totalDebt / budget.DebtBudget * 100, 1) : 0,
            DailyUsagePercent = budget.DailyBudget > 0
                ? Math.Round(totalDaily / budget.DailyBudget * 100, 1) : 0,

            ActiveInstallments = activeInstallments,
            CurrentMonthExpenses = currentExpenses,
            MonthlyTrend = trend
        };

        return Ok(summary);
    }

    private List<MonthlyTrend> BuildTrend(List<Expense> allExpenses, int year, int month)
    {
        var trend = new List<MonthlyTrend>();
        for (int i = 5; i >= 0; i--)
        {
            var d = new DateTime(year, month, 1).AddMonths(-i);
            var monthExpenses = allExpenses
                .Where(e => e.Year == d.Year && e.Month == d.Month)
                .ToList();

            trend.Add(new MonthlyTrend
            {
                Month = $"{d.Year}-{d.Month:D2}",
                Year = d.Year,
                MonthNumber = d.Month,
                MonthName = $"{ThaiMonths[d.Month]} {d.Year + 543}",
                TotalExpenses = monthExpenses.Sum(e => e.Amount),
                Expenses = monthExpenses
            });
        }
        return trend;
    }
}
