using Microsoft.AspNetCore.Mvc;
using FinanceApi.Models;
using FinanceApi.Services;

namespace FinanceApi.Controllers;

// ========================================================
// DashboardController.cs — API สรุปข้อมูลภาพรวม
// URL: GET /api/dashboard?year=2026&month=5
// รวบรวมข้อมูลจาก Budget + Expenses + Installments แล้วส่งเป็น DashboardSummary
// ========================================================

[ApiController]
[Route("api/[controller]")]
public class DashboardController(CsvDataService csv) : ControllerBase
{
    // ชื่อเดือนภาษาไทย — index 0 เว้นว่าง เพราะเดือนเริ่มที่ 1
    private static readonly string[] ThaiMonths =
    [
        "", "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
        "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
    ];

    // GET /api/dashboard?year=2026&month=5
    // ถ้าไม่ส่ง year/month จะใช้เดือนปัจจุบันอัตโนมัติ
    [HttpGet]
    public IActionResult Get([FromQuery] int? year, [FromQuery] int? month)
    {
        var now = DateTime.Now;
        int y = year ?? now.Year;
        int m = month ?? now.Month;

        if (m is < 1 or > 12)
            return BadRequest(new { message = "เดือนต้องอยู่ระหว่าง 1-12" });

        // โหลดข้อมูลจาก CSV ทั้ง 3 ส่วน
        var budget = csv.GetBudget();
        var allExpenses = csv.GetAllExpenses();
        var installments = csv.GetAllInstallments();

        // กรองรายจ่ายเฉพาะเดือนที่ต้องการ
        var currentExpenses = allExpenses
            .Where(e => e.Year == y && e.Month == m)
            .ToList();

        // รวมยอดแต่ละหมวดหมู่
        var totalDebt = currentExpenses
            .Where(e => e.Category == "debt")
            .Sum(e => e.Amount);

        var totalDaily = currentExpenses
            .Where(e => e.Category == "daily")
            .Sum(e => e.Amount);

        // กรองเฉพาะรายการผ่อนที่ยังไม่หมด
        var activeInstallments = installments.Where(i => !i.IsCompleted).ToList();
        var totalInstallmentsMonthly = activeInstallments.Sum(i => i.MonthlyAmount);

        var totalExpenses = currentExpenses.Sum(e => e.Amount);

        // สร้างข้อมูล 6 เดือนย้อนหลัง สำหรับ BarChart
        var trend = BuildTrend(allExpenses, y, m);

        // รวบรวมทุกอย่างเป็น DashboardSummary object เดียว
        var summary = new DashboardSummary
        {
            Year = y,
            Month = m,
            MonthName = $"{ThaiMonths[m]} {y + 543}", // แสดงปี พ.ศ.

            // ใช้ NetSalary (เงินเดือนสุทธิหลังหักแล้ว) เป็นฐาน
            Salary = budget.NetSalary,
            DebtBudget = budget.DebtBudget,
            DailyBudget = budget.DailyBudget,
            SavingsBudget = budget.SavingsBudget,

            TotalExpenses = totalExpenses,
            Remaining = budget.NetSalary - totalExpenses, // เงินคงเหลือ
            TotalDebtExpenses = totalDebt,
            TotalDailyExpenses = totalDaily,
            TotalInstallmentsMonthly = totalInstallmentsMonthly,

            // คำนวณ % การใช้งบ — ป้องกัน divide by zero ด้วย > 0
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

    // สร้างข้อมูลแนวโน้ม 6 เดือนย้อนหลัง
    // i=5 คือเดือนที่เก่าสุด, i=0 คือเดือนปัจจุบัน
    private List<MonthlyTrend> BuildTrend(List<Expense> allExpenses, int year, int month)
    {
        var trend = new List<MonthlyTrend>();
        for (int i = 5; i >= 0; i--)
        {
            // AddMonths(-i) = ย้อนหลัง i เดือน (DateTime จัดการข้ามปีให้อัตโนมัติ)
            var d = new DateTime(year, month, 1).AddMonths(-i);
            var monthExpenses = allExpenses
                .Where(e => e.Year == d.Year && e.Month == d.Month)
                .ToList();

            trend.Add(new MonthlyTrend
            {
                Month = $"{d.Year}-{d.Month:D2}",          // D2 = แสดง 2 หลักเสมอ เช่น "05"
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
