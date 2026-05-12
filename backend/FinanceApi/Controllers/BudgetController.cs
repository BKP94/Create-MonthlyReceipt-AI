using Microsoft.AspNetCore.Mvc;
using FinanceApi.Models;
using FinanceApi.Services;

namespace FinanceApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BudgetController(CsvDataService csv) : ControllerBase
{
    [HttpGet]
    public IActionResult Get()
    {
        return Ok(csv.GetBudget());
    }

    [HttpPut]
    public IActionResult Update([FromBody] Budget budget)
    {
        if (budget.Salary <= 0)
            return BadRequest(new { message = "เงินเดือนต้องมากกว่า 0" });

        if (budget.SocialSecurity < 0 || budget.StudentLoan < 0 || budget.OtherDeductions < 0)
            return BadRequest(new { message = "รายการหักต้องไม่ติดลบ" });

        if (budget.TotalDeductions >= budget.Salary)
            return BadRequest(new { message = "รายการหักรวมต้องน้อยกว่าเงินเดือน" });

        var total = budget.DebtPercent + budget.DailyExpensePercent + budget.SavingsPercent;
        if (Math.Abs(total - 100m) > 0.01m)
            return BadRequest(new { message = $"สัดส่วนรวมต้องเท่ากับ 100% (ปัจจุบัน: {total}%)" });

        if (budget.DebtPercent < 0 || budget.DailyExpensePercent < 0 || budget.SavingsPercent < 0)
            return BadRequest(new { message = "สัดส่วนต้องไม่ติดลบ" });

        var updated = csv.UpdateBudget(budget);
        return Ok(updated);
    }
}
