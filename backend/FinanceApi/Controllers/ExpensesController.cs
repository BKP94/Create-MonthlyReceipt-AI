using Microsoft.AspNetCore.Mvc;
using FinanceApi.Models;
using FinanceApi.Services;

namespace FinanceApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ExpensesController(CsvDataService csv) : ControllerBase
{
    [HttpGet]
    public IActionResult GetAll([FromQuery] int? year, [FromQuery] int? month)
    {
        if (year.HasValue && month.HasValue)
            return Ok(csv.GetExpensesByMonth(year.Value, month.Value));
        return Ok(csv.GetAllExpenses());
    }

    [HttpGet("{id:int}")]
    public IActionResult GetById(int id)
    {
        var expense = csv.GetExpenseById(id);
        if (expense is null) return NotFound(new { message = "ไม่พบรายการที่ระบุ" });
        return Ok(expense);
    }

    [HttpPost]
    public IActionResult Create([FromBody] Expense expense)
    {
        if (string.IsNullOrWhiteSpace(expense.Name))
            return BadRequest(new { message = "กรุณาระบุชื่อรายการ" });
        if (expense.Amount <= 0)
            return BadRequest(new { message = "จำนวนเงินต้องมากกว่า 0" });
        if (expense.Year <= 0 || expense.Month is < 1 or > 12)
            return BadRequest(new { message = "กรุณาระบุปีและเดือนให้ถูกต้อง" });

        var created = csv.AddExpense(expense);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id:int}")]
    public IActionResult Update(int id, [FromBody] Expense expense)
    {
        if (string.IsNullOrWhiteSpace(expense.Name))
            return BadRequest(new { message = "กรุณาระบุชื่อรายการ" });
        if (expense.Amount <= 0)
            return BadRequest(new { message = "จำนวนเงินต้องมากกว่า 0" });

        var updated = csv.UpdateExpense(id, expense);
        if (updated is null) return NotFound(new { message = "ไม่พบรายการที่ระบุ" });
        return Ok(updated);
    }

    [HttpPatch("{id:int}/paid")]
    public IActionResult TogglePaid(int id, [FromBody] bool isPaid)
    {
        var expense = csv.GetExpenseById(id);
        if (expense is null) return NotFound(new { message = "ไม่พบรายการที่ระบุ" });
        expense.IsPaid = isPaid;
        var updated = csv.UpdateExpense(id, expense);
        return Ok(updated);
    }

    [HttpDelete("{id:int}")]
    public IActionResult Delete(int id)
    {
        if (!csv.DeleteExpense(id))
            return NotFound(new { message = "ไม่พบรายการที่ระบุ" });
        return Ok(new { message = "ลบรายการเรียบร้อยแล้ว", id });
    }
}
