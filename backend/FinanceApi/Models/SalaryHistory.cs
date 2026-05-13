namespace FinanceApi.Models;

// ========================================================
// SalaryHistory.cs — Model ประวัติเงินเดือนรายปี
// บันทึกเงินเดือนแต่ละปี เพื่อดูพัฒนาการและ % การขึ้นเงินเดือน
// ข้อมูลถูกบันทึกใน data/db/salary_history.csv
// ========================================================

public class SalaryHistory
{
    // รหัสรายการ — สร้างอัตโนมัติ
    public int Id { get; set; }

    // ปี ค.ศ. เช่น 2026
    public int Year { get; set; }

    // เงินเดือน (Gross) ของปีนั้น
    public decimal Salary { get; set; }

    // หมายเหตุ เช่น "ขึ้นประจำปี", "ปรับโครงสร้าง"
    public string? Note { get; set; }

    // วันที่บันทึก (บันทึกอัตโนมัติ)
    public string? CreatedAt { get; set; }
}
