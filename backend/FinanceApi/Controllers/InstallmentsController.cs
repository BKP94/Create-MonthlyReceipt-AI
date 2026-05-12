using Microsoft.AspNetCore.Mvc;
using FinanceApi.Models;
using FinanceApi.Services;

namespace FinanceApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class InstallmentsController(CsvDataService csv) : ControllerBase
{
    [HttpGet]
    public IActionResult GetAll([FromQuery] bool? activeOnly)
    {
        var list = csv.GetAllInstallments();
        if (activeOnly == true)
            list = list.Where(i => !i.IsCompleted).ToList();
        return Ok(list);
    }

    [HttpGet("{id:int}")]
    public IActionResult GetById(int id)
    {
        var item = csv.GetInstallmentById(id);
        if (item is null) return NotFound(new { message = "ไม่พบรายการผ่อนชำระที่ระบุ" });
        return Ok(item);
    }

    [HttpPost]
    public IActionResult Create([FromBody] Installment installment)
    {
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

        var created = csv.AddInstallment(installment);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id:int}")]
    public IActionResult Update(int id, [FromBody] Installment installment)
    {
        if (string.IsNullOrWhiteSpace(installment.Name))
            return BadRequest(new { message = "กรุณาระบุชื่อรายการผ่อน" });
        if (installment.MonthlyAmount <= 0)
            return BadRequest(new { message = "จำนวนเงินต่องวดต้องมากกว่า 0" });
        if (installment.PaidInstallments > installment.TotalInstallments)
            return BadRequest(new { message = "งวดที่ชำระแล้วเกินจำนวนงวดทั้งหมด" });

        var updated = csv.UpdateInstallment(id, installment);
        if (updated is null) return NotFound(new { message = "ไม่พบรายการผ่อนชำระที่ระบุ" });
        return Ok(updated);
    }

    [HttpDelete("{id:int}")]
    public IActionResult Delete(int id)
    {
        if (!csv.DeleteInstallment(id))
            return NotFound(new { message = "ไม่พบรายการผ่อนชำระที่ระบุ" });
        return Ok(new { message = "ลบรายการผ่อนชำระเรียบร้อยแล้ว", id });
    }
}
