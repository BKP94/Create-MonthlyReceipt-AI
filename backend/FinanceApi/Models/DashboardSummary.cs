namespace FinanceApi.Models;

// สรุปรายจ่ายรายเดือนสำหรับ 1 เดือน (ใช้ใน YearlySummary)
public class MonthYearlySummary
{
    public int Month { get; set; }
    public string MonthName { get; set; } = string.Empty;
    public decimal TotalExpenses { get; set; }
    public decimal Remaining { get; set; }
    public int ExpenseCount { get; set; }
}

// สรุปรายจ่ายรายปี 12 เดือน สำหรับหน้า Monthly Summary
public class YearlySummary
{
    public int Year { get; set; }
    public decimal Salary { get; set; }
    public List<MonthYearlySummary> Months { get; set; } = [];
}

// ========================================================
// DashboardSummary.cs — Model ข้อมูลสรุปสำหรับ Dashboard
// DashboardController รวมข้อมูลจากทุกส่วนแล้วส่งเป็น object นี้
// ========================================================

// ข้อมูลรายจ่ายรายเดือน สำหรับ BarChart แนวโน้ม 6 เดือน
public class MonthlyTrend
{
    public string Month { get; set; } = string.Empty; // รูปแบบ "YYYY-MM" เช่น "2026-05"
    public int Year { get; set; }
    public int MonthNumber { get; set; }              // เลขเดือน 1-12
    public string MonthName { get; set; } = string.Empty; // ชื่อเดือนภาษาไทย เช่น "พฤษภาคม 2569"
    public decimal TotalExpenses { get; set; }        // ยอดรวมรายจ่ายทั้งเดือน
    public List<Expense> Expenses { get; set; } = []; // รายการรายจ่ายทั้งหมดของเดือนนั้น
}

// สรุปรวมทุกอย่างสำหรับแสดงผลในหน้า Dashboard
public class DashboardSummary
{
    // ปีและเดือนที่กำลังดูอยู่
    public int Year { get; set; }
    public int Month { get; set; }
    public string MonthName { get; set; } = string.Empty; // เช่น "พฤษภาคม 2569"

    // =====================================================
    // งบประมาณตั้งไว้ (จาก Budget settings)
    // =====================================================
    public decimal Salary { get; set; }         // เงินเดือนสุทธิ (NetSalary)
    public decimal DebtBudget { get; set; }     // งบหนี้/ผ่อน (50% ของ NetSalary)
    public decimal DailyBudget { get; set; }    // งบประจำวัน (30%)
    public decimal SavingsBudget { get; set; }  // งบเงินเก็บ (20%)

    // =====================================================
    // ยอดใช้จ่ายจริงเดือนนี้ (จาก Expenses)
    // =====================================================
    public decimal TotalExpenses { get; set; }       // รายจ่ายรวมทั้งหมด
    public decimal Remaining { get; set; }            // เงินคงเหลือ = NetSalary - TotalExpenses
    public decimal TotalDebtExpenses { get; set; }   // รายจ่ายหมวด debt รวม
    public decimal TotalDailyExpenses { get; set; }  // รายจ่ายหมวด daily รวม
    public decimal TotalInstallmentsMonthly { get; set; } // ยอดผ่อนที่ต้องจ่ายเดือนนี้

    // =====================================================
    // เปอร์เซ็นต์การใช้งบ — ใช้แสดง progress bar
    // =====================================================
    public decimal DebtUsagePercent { get; set; }    // ใช้งบหนี้ไปกี่ %
    public decimal DailyUsagePercent { get; set; }   // ใช้งบประจำวันไปกี่ %

    // รายการผ่อนที่ยังไม่หมด (IsCompleted = false) — แสดงในตารางด้านล่าง
    public List<Installment> ActiveInstallments { get; set; } = [];

    // รายจ่ายทั้งหมดของเดือนที่กำลังดูอยู่
    public List<Expense> CurrentMonthExpenses { get; set; } = [];

    // ข้อมูล 6 เดือนล่าสุด สำหรับ BarChart
    public List<MonthlyTrend> MonthlyTrend { get; set; } = [];
}
