using System.ComponentModel.DataAnnotations.Schema;

namespace FinanceApi.Models;

// ========================================================
// Budget.cs — Model ข้อมูลงบประมาณส่วนตัว
// เก็บข้อมูลเงินเดือน รายการหัก และสัดส่วนงบแต่ละหมวด
// บันทึกใน SQLite table "Budgets" (มีแค่ 1 row เสมอ Id = 1)
// ========================================================

public class Budget
{
    // Primary Key สำหรับ EF Core — ค่าจะเป็น 1 เสมอ (single-row table)
    public int Id { get; set; } = 1;

    // เงินเดือน "ก่อน" หัก (Gross Salary)
    public decimal Salary { get; set; } = 42334m;

    // รายการหักจากเงินเดือน
    public decimal SocialSecurity { get; set; } = 0m;    // ประกันสังคม (ปกติ 750 บาท/เดือน)
    public decimal StudentLoan { get; set; } = 0m;        // กยศ. (กองทุนกู้ยืมเพื่อการศึกษา)
    public decimal OtherDeductions { get; set; } = 0m;   // รายการหักอื่นๆ

    // สัดส่วนงบแต่ละหมวด (รวมต้องได้ 100%)
    public decimal DebtPercent { get; set; } = 50m;           // งบหนี้/ผ่อน 50%
    public decimal DailyExpensePercent { get; set; } = 30m;   // งบประจำวัน 30%
    public decimal SavingsPercent { get; set; } = 20m;        // งบเก็บออม 20%

    // วันที่อัปเดตล่าสุด — บันทึกเป็น string ใน CSV เช่น "2026-05-10 14:30"
    public string UpdatedAt { get; set; } = string.Empty;

    // =====================================================
    // Computed Properties — คำนวณอัตโนมัติ ไม่บันทึกลง DB
    // [NotMapped] บอก EF Core ให้ข้ามคอลัมน์นี้ ไม่สร้าง column ใน SQLite
    // =====================================================

    [NotMapped]
    public decimal TotalDeductions => SocialSecurity + StudentLoan + OtherDeductions;
    [NotMapped]
    public decimal NetSalary => Salary - TotalDeductions;

    [NotMapped]
    public decimal DebtBudget => Math.Round(NetSalary * DebtPercent / 100, 2);
    [NotMapped]
    public decimal DailyBudget => Math.Round(NetSalary * DailyExpensePercent / 100, 2);
    [NotMapped]
    public decimal SavingsBudget => Math.Round(NetSalary * SavingsPercent / 100, 2);
}
