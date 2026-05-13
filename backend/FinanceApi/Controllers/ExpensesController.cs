using Microsoft.AspNetCore.Mvc;
using FinanceApi.Models;
using FinanceApi.Services;

namespace FinanceApi.Controllers;

// ========================================================
// ExpensesController.cs — API รายจ่ายรายเดือน
// [ApiController]    → เปิดใช้ฟีเจอร์อัตโนมัติ เช่น validation, 400 response
// [Route("api/[controller]")] → URL จะเป็น /api/expenses
// Primary Constructor (SqliteDataService db) → DI inject service เข้ามาอัตโนมัติ
// ========================================================

[ApiController]
[Route("api/[controller]")]
public class ExpensesController(SqliteDataService db) : ControllerBase
{
    // GET /api/expenses?year=2026&month=5
    // ดึงรายจ่ายตามปี/เดือน ถ้าไม่ส่ง query param จะดึงทั้งหมด
    [HttpGet]
    public IActionResult GetAll([FromQuery] int? year, [FromQuery] int? month)
    {
        if (year.HasValue && month.HasValue)
            return Ok(db.GetExpensesByMonth(year.Value, month.Value));
        return Ok(db.GetAllExpenses());
    }

    // GET /api/expenses/5 — ดึงรายการเดียวตาม Id
    [HttpGet("{id:int}")]
    public IActionResult GetById(int id)
    {
        var expense = db.GetExpenseById(id);
        // ถ้าไม่เจอ return 404 Not Found พร้อม message ภาษาไทย
        if (expense is null) return NotFound(new { message = "ไม่พบรายการที่ระบุ" });
        return Ok(expense);
    }

    // POST /api/expenses — สร้างรายการใหม่
    // [FromBody] → รับข้อมูลจาก Request Body เป็น JSON แล้ว deserialize เป็น Expense
    [HttpPost]
    public IActionResult Create([FromBody] Expense expense)
    {
        // Validate ข้อมูลก่อนบันทึก
        if (string.IsNullOrWhiteSpace(expense.Name))
            return BadRequest(new { message = "กรุณาระบุชื่อรายการ" });
        if (expense.Amount <= 0)
            return BadRequest(new { message = "จำนวนเงินต้องมากกว่า 0" });
        if (expense.Year <= 0 || expense.Month is < 1 or > 12)
            return BadRequest(new { message = "กรุณาระบุปีและเดือนให้ถูกต้อง" });

        var created = db.AddExpense(expense);
        // 201 Created พร้อม Location header ชี้ไปที่ URL ของรายการที่สร้าง
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    // PUT /api/expenses/5 — แก้ไขรายการทั้งหมด (ส่งข้อมูลครบทุก field)
    [HttpPut("{id:int}")]
    public IActionResult Update(int id, [FromBody] Expense expense)
    {
        if (string.IsNullOrWhiteSpace(expense.Name))
            return BadRequest(new { message = "กรุณาระบุชื่อรายการ" });
        if (expense.Amount <= 0)
            return BadRequest(new { message = "จำนวนเงินต้องมากกว่า 0" });

        var updated = db.UpdateExpense(id, expense);
        if (updated is null) return NotFound(new { message = "ไม่พบรายการที่ระบุ" });
        return Ok(updated);
    }

    // PATCH /api/expenses/5/paid — อัปเดตเฉพาะสถานะชำระ (ไม่ต้องส่งข้อมูลทั้งหมด)
    // PATCH เหมาะกับการอัปเดตบางส่วน ต่างจาก PUT ที่ต้องส่งครบ
    [HttpPatch("{id:int}/paid")]
    public IActionResult TogglePaid(int id, [FromBody] bool isPaid)
    {
        var expense = db.GetExpenseById(id);
        if (expense is null) return NotFound(new { message = "ไม่พบรายการที่ระบุ" });
        // อัปเดตเฉพาะ field IsPaid แล้วบันทึก
        expense.IsPaid = isPaid;
        var updated = db.UpdateExpense(id, expense);
        return Ok(updated);
    }

    // DELETE /api/expenses/5 — ลบรายการ
    [HttpDelete("{id:int}")]
    public IActionResult Delete(int id)
    {
        if (!db.DeleteExpense(id))
            return NotFound(new { message = "ไม่พบรายการที่ระบุ" });
        return Ok(new { message = "ลบรายการเรียบร้อยแล้ว", id });
    }
}
