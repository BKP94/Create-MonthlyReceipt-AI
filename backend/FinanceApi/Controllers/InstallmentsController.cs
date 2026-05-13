using Microsoft.AspNetCore.Mvc;
using FinanceApi.Models;
using FinanceApi.Services;

namespace FinanceApi.Controllers;

// ========================================================
// InstallmentsController.cs — API รายการผ่อนชำระ
// URL: /api/installments
// รองรับ CRUD ครบ + filter เฉพาะรายการที่ยังผ่อนอยู่
// ========================================================

[ApiController]
[Route("api/[controller]")]
public class InstallmentsController(SqliteDataService db) : ControllerBase
{
    // GET /api/installments — ดึงทั้งหมด
    // GET /api/installments?activeOnly=true — ดึงเฉพาะที่ยังไม่หมด (IsCompleted = false)
    [HttpGet]
    public IActionResult GetAll([FromQuery] bool? activeOnly)
    {
        var list = db.GetAllInstallments();
        if (activeOnly == true)
            list = list.Where(i => !i.IsCompleted).ToList();
        return Ok(list);
    }

    // GET /api/installments/1
    [HttpGet("{id:int}")]
    public IActionResult GetById(int id)
    {
        var item = db.GetInstallmentById(id);
        if (item is null) return NotFound(new { message = "ไม่พบรายการผ่อนชำระที่ระบุ" });
        return Ok(item);
    }

    // POST /api/installments — เพิ่มรายการผ่อนใหม่
    [HttpPost]
    public IActionResult Create([FromBody] Installment installment)
    {
        // Validate ข้อมูลสำคัญก่อนบันทึก
        if (string.IsNullOrWhiteSpace(installment.Name))
            return BadRequest(new { message = "กรุณาระบุชื่อรายการผ่อน" });
        if (installment.MonthlyAmount <= 0)
            return BadRequest(new { message = "จำนวนเงินต่องวดต้องมากกว่า 0" });
        if (installment.TotalInstallments <= 0)
            return BadRequest(new { message = "จำนวนงวดต้องมากกว่า 0" });
        if (installment.PaidInstallments < 0)
            return BadRequest(new { message = "จำนวนงวดที่ชำระแล้วต้องไม่ติดลบ" });
        if (installment.PaidInstallments > installment.TotalInstallments)
            return BadRequest(new { message = "งวดที่ชำระแล้วเกินจำนวนงวดทั้งหมด" });

        var created = db.AddInstallment(installment);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    // PUT /api/installments/1 — แก้ไข (ใช้บันทึกงวดที่จ่ายแล้ว PaidInstallments++)
    [HttpPut("{id:int}")]
    public IActionResult Update(int id, [FromBody] Installment installment)
    {
        if (string.IsNullOrWhiteSpace(installment.Name))
            return BadRequest(new { message = "กรุณาระบุชื่อรายการผ่อน" });
        if (installment.MonthlyAmount <= 0)
            return BadRequest(new { message = "จำนวนเงินต่องวดต้องมากกว่า 0" });
        if (installment.PaidInstallments > installment.TotalInstallments)
            return BadRequest(new { message = "งวดที่ชำระแล้วเกินจำนวนงวดทั้งหมด" });

        var updated = db.UpdateInstallment(id, installment);
        if (updated is null) return NotFound(new { message = "ไม่พบรายการผ่อนชำระที่ระบุ" });
        return Ok(updated);
    }

    // DELETE /api/installments/1
    [HttpDelete("{id:int}")]
    public IActionResult Delete(int id)
    {
        if (!db.DeleteInstallment(id))
            return NotFound(new { message = "ไม่พบรายการผ่อนชำระที่ระบุ" });
        return Ok(new { message = "ลบรายการผ่อนชำระเรียบร้อยแล้ว", id });
    }
}
