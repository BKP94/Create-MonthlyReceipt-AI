using Microsoft.AspNetCore.Mvc;
using FinanceApi.Models;
using FinanceApi.Services;

namespace FinanceApi.Controllers;

// ========================================================
// BudgetController.cs — API ตั้งค่างบประมาณ
// URL: /api/budget
// รองรับ GET (ดึงค่าปัจจุบัน) และ PUT (อัปเดต)
// ข้อมูลถูกบันทึกลง SQLite ผ่าน SqliteDataService
// ========================================================

[ApiController]
[Route("api/[controller]")]
public class BudgetController(SqliteDataService db) : ControllerBase
{
    // GET /api/budget — ดึงข้อมูลงบประมาณปัจจุบัน
    // ส่งกลับ Budget object พร้อม computed properties (NetSalary, DebtBudget ฯลฯ)
    [HttpGet]
    public IActionResult Get()
    {
        return Ok(db.GetBudget());
    }

    // PUT /api/budget — อัปเดตงบประมาณทั้งหมด
    // [FromBody] → รับ JSON จาก request body แล้ว deserialize เป็น Budget
    [HttpPut]
    public IActionResult Update([FromBody] Budget budget)
    {
        // Validate: เงินเดือนต้องมากกว่า 0
        if (budget.Salary <= 0)
            return BadRequest(new { message = "เงินเดือนต้องมากกว่า 0" });

        // Validate: รายการหักต้องไม่เป็นลบ
        if (budget.SocialSecurity < 0 || budget.StudentLoan < 0 || budget.OtherDeductions < 0)
            return BadRequest(new { message = "รายการหักต้องไม่ติดลบ" });

        // Validate: รายการหักรวมต้องน้อยกว่าเงินเดือน (ไม่งั้น NetSalary จะติดลบ)
        if (budget.TotalDeductions >= budget.Salary)
            return BadRequest(new { message = "รายการหักรวมต้องน้อยกว่าเงินเดือน" });

        // Validate: สัดส่วนรวมต้องได้ 100% พอดี
        // Math.Abs → ค่าสัมบูรณ์ (ป้องกัน floating point error เล็กน้อย เช่น 99.9999...)
        var total = budget.DebtPercent + budget.DailyExpensePercent + budget.SavingsPercent;
        if (Math.Abs(total - 100m) > 0.01m)
            return BadRequest(new { message = $"สัดส่วนรวมต้องเท่ากับ 100% (ปัจจุบัน: {total}%)" });

        // Validate: สัดส่วนแต่ละหมวดต้องไม่ติดลบ
        if (budget.DebtPercent < 0 || budget.DailyExpensePercent < 0 || budget.SavingsPercent < 0)
            return BadRequest(new { message = "สัดส่วนต้องไม่ติดลบ" });

        // บันทึกข้อมูล แล้วส่งกลับ Budget ที่อัปเดตแล้ว (พร้อม UpdatedAt ใหม่)
        var updated = db.UpdateBudget(budget);
        return Ok(updated);
    }
}
