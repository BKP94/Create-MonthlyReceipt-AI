using Microsoft.AspNetCore.Mvc;
using FinanceApi.Models;
using FinanceApi.Services;

namespace FinanceApi.Controllers;

// ========================================================
// SalaryHistoryController.cs — API ประวัติเงินเดือนรายปี
// URL: /api/salary-history
// รองรับ CRUD ครบ + auto-sync Budget เมื่อเพิ่ม/แก้ไขปีล่าสุด
// ========================================================

[ApiController]
[Route("api/salary-history")]
public class SalaryHistoryController(SqliteDataService db) : ControllerBase
{
    // GET /api/salary-history — ดึงทั้งหมด เรียงตามปีจากเก่าไปใหม่
    [HttpGet]
    public IActionResult GetAll()
    {
        return Ok(db.GetAllSalaryHistory());
    }

    // GET /api/salary-history/1
    [HttpGet("{id:int}")]
    public IActionResult GetById(int id)
    {
        var item = db.GetSalaryHistoryById(id);
        if (item is null) return NotFound(new { message = "ไม่พบข้อมูลเงินเดือนที่ระบุ" });
        return Ok(item);
    }

    // POST /api/salary-history — เพิ่มรายการปีใหม่
    // ถ้าปีที่เพิ่มคือปีล่าสุด → อัปเดตเงินเดือนใน Budget อัตโนมัติ
    [HttpPost]
    public IActionResult Create([FromBody] SalaryHistory record)
    {
        if (record.Year <= 0)
            return BadRequest(new { message = "กรุณาระบุปีให้ถูกต้อง" });
        if (record.Salary <= 0)
            return BadRequest(new { message = "เงินเดือนต้องมากกว่า 0" });

        // ตรวจสอบว่ามีข้อมูลปีนี้แล้วหรือยัง (ห้ามซ้ำ)
        var existing = db.GetAllSalaryHistory();
        if (existing.Any(h => h.Year == record.Year))
            return BadRequest(new { message = $"มีข้อมูลเงินเดือนปี {record.Year} อยู่แล้ว" });

        var created = db.AddSalaryHistory(record);

        // ตรวจสอบว่าปีที่เพิ่มคือปีล่าสุดหรือไม่
        // ถ้าใช่ → sync เงินเดือนไปที่ Budget settings อัตโนมัติ
        var allHistory = db.GetAllSalaryHistory();
        bool budgetUpdated = false;
        decimal newNetSalary = 0;

        if (allHistory.Any() && created.Year == allHistory.Max(h => h.Year))
        {
            var budget = db.GetBudget();
            budget.Salary = created.Salary;
            var updatedBudget = db.UpdateBudget(budget);
            budgetUpdated = true;
            newNetSalary = updatedBudget.NetSalary;
        }

        return CreatedAtAction(nameof(GetById), new { id = created.Id }, new
        {
            record = created,
            budgetUpdated,
            newNetSalary = budgetUpdated ? newNetSalary : (decimal?)null,
        });
    }

    // PUT /api/salary-history/1 — แก้ไขรายการ
    // ถ้าปีที่แก้ไขคือปีล่าสุด → sync เงินเดือนไปที่ Budget ด้วย
    [HttpPut("{id:int}")]
    public IActionResult Update(int id, [FromBody] SalaryHistory record)
    {
        if (record.Year <= 0)
            return BadRequest(new { message = "กรุณาระบุปีให้ถูกต้อง" });
        if (record.Salary <= 0)
            return BadRequest(new { message = "เงินเดือนต้องมากกว่า 0" });

        // ตรวจสอบปีซ้ำ (ยกเว้นรายการตัวเอง)
        var existing = db.GetAllSalaryHistory();
        if (existing.Any(h => h.Year == record.Year && h.Id != id))
            return BadRequest(new { message = $"มีข้อมูลเงินเดือนปี {record.Year} อยู่แล้ว" });

        var updated = db.UpdateSalaryHistory(id, record);
        if (updated is null) return NotFound(new { message = "ไม่พบข้อมูลเงินเดือนที่ระบุ" });

        // sync Budget ถ้าเป็นปีล่าสุด
        var allHistory = db.GetAllSalaryHistory();
        bool budgetUpdated = false;
        decimal newNetSalary = 0;

        if (allHistory.Any() && updated.Year == allHistory.Max(h => h.Year))
        {
            var budget = db.GetBudget();
            budget.Salary = updated.Salary;
            var updatedBudget = db.UpdateBudget(budget);
            budgetUpdated = true;
            newNetSalary = updatedBudget.NetSalary;
        }

        return Ok(new
        {
            record = updated,
            budgetUpdated,
            newNetSalary = budgetUpdated ? newNetSalary : (decimal?)null,
        });
    }

    // DELETE /api/salary-history/1
    [HttpDelete("{id:int}")]
    public IActionResult Delete(int id)
    {
        if (!db.DeleteSalaryHistory(id))
            return NotFound(new { message = "ไม่พบข้อมูลเงินเดือนที่ระบุ" });
        return Ok(new { message = "ลบข้อมูลเงินเดือนเรียบร้อยแล้ว", id });
    }
}
