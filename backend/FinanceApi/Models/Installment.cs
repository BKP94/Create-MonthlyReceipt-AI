using System.ComponentModel.DataAnnotations.Schema;

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
    // Computed Properties — คำนวณอัตโนมัติ ไม่บันทึกลง DB
    // [NotMapped] บอก EF Core ให้ข้ามคอลัมน์เหล่านี้
    // =====================================================

    [NotMapped] public int RemainingInstallments => TotalInstallments - PaidInstallments;
    [NotMapped] public decimal TotalAmount => TotalInstallments * MonthlyAmount;
    [NotMapped] public decimal PaidAmount => PaidInstallments * MonthlyAmount;
    [NotMapped] public decimal RemainingAmount => RemainingInstallments * MonthlyAmount;
    [NotMapped] public bool IsCompleted => PaidInstallments >= TotalInstallments;
}
