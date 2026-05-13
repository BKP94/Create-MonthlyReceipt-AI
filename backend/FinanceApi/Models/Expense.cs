namespace FinanceApi.Models;

// ========================================================
// Expense.cs — Model รายจ่ายรายเดือน
// Model คือ class ที่ใช้แทนโครงสร้างข้อมูล 1 แถวใน expenses.csv
// ASP.NET Core จะ serialize/deserialize JSON ↔ class นี้อัตโนมัติ
// ========================================================

public class Expense
{
    // รหัสรายการ — สร้างอัตโนมัติ (max Id + 1) ตอน AddExpense
    public int Id { get; set; }

    // ปีและเดือนของรายจ่าย (ใช้ปี ค.ศ.)
    public int Year { get; set; }
    public int Month { get; set; }

    // ชื่อรายการ เช่น "ผ่อนรถยนต์", "ค่าเช่า"
    public string Name { get; set; } = string.Empty;

    // จำนวนเงิน (บาท) — ใช้ decimal เพราะแม่นยำกว่า double สำหรับเงิน
    public decimal Amount { get; set; }

    // หมวดหมู่ — มี 4 ค่า: "debt"=หนี้/ผ่อน, "daily"=ประจำวัน, "savings"=เงินเก็บ, "other"=อื่นๆ
    public string Category { get; set; } = "other";

    // วันครบกำหนด — เป็น string เพราะเก็บในหลาย format (nullable = ไม่บังคับ)
    public string? DueDate { get; set; }

    // หมายเหตุ — nullable หมายความว่าเป็น null ได้ (ไม่จำเป็นต้องกรอก)
    public string? Note { get; set; }

    // สถานะชำระแล้ว — false = ยังไม่ชำระ, true = ชำระแล้ว (row จะเปลี่ยนสีเขียว)
    public bool IsPaid { get; set; } = false;
}
