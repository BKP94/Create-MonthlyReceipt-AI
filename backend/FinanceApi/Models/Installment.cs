namespace FinanceApi.Models;

// ========================================================
// Installment.cs — Model รายการผ่อนชำระ
// เก็บข้อมูลการผ่อนสินค้า เช่น ผ่อนรถ ผ่อนมือถือ
// Computed properties คำนวณจาก TotalInstallments / PaidInstallments
// ========================================================

public class Installment
{
    // รหัสรายการ — สร้างอัตโนมัติ
    public int Id { get; set; }

    // ชื่อรายการผ่อน เช่น "ผ่อนรถมอไซค์"
    public string Name { get; set; } = string.Empty;

    // จำนวนงวดทั้งหมด เช่น 36 งวด
    public int TotalInstallments { get; set; }

    // จำนวนงวดที่ชำระแล้ว
    public int PaidInstallments { get; set; }

    // ยอดต่องวด (บาท)
    public decimal MonthlyAmount { get; set; }

    // วันที่เริ่มต้นผ่อน format "yyyy-MM-dd"
    public string StartDate { get; set; } = string.Empty;

    // หมายเหตุ — nullable
    public string? Note { get; set; }

    // =====================================================
    // Computed Properties — คำนวณอัตโนมัติ ไม่เก็บใน CSV
    // =====================================================

    // งวดที่เหลือ = ทั้งหมด - ชำระแล้ว
    public int RemainingInstallments => TotalInstallments - PaidInstallments;

    // ยอดรวมทั้งหมด = จำนวนงวด × ต่องวด
    public decimal TotalAmount => TotalInstallments * MonthlyAmount;

    // ยอดที่จ่ายไปแล้ว = งวดที่จ่ายแล้ว × ต่องวด
    public decimal PaidAmount => PaidInstallments * MonthlyAmount;

    // ยอดคงเหลือ = งวดที่เหลือ × ต่องวด
    public decimal RemainingAmount => RemainingInstallments * MonthlyAmount;

    // ผ่อนหมดแล้วหรือยัง — ใช้ใน Dashboard กรอง Active installments
    public bool IsCompleted => PaidInstallments >= TotalInstallments;
}
