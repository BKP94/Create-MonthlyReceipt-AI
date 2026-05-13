namespace FinanceApi.Models;

// ========================================================
// Budget.cs — Model ข้อมูลงบประมาณส่วนตัว
// เก็บข้อมูลเงินเดือน รายการหัก และสัดส่วนงบแต่ละหมวด
// ข้อมูลถูกบันทึกใน data/db/budget.csv และโหลดผ่าน CsvDataService
// ========================================================

public class Budget
{
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
    // Computed Properties — คำนวณอัตโนมัติ ไม่ต้องบันทึกใน CSV
    // => คือ expression body property (getter อย่างเดียว)
    // =====================================================

    // เงินเดือนสุทธิ = เงินเดือน - ประกันสังคม - กยศ. - อื่นๆ
    public decimal TotalDeductions => SocialSecurity + StudentLoan + OtherDeductions;
    public decimal NetSalary => Salary - TotalDeductions;

    // คำนวณงบแต่ละส่วนจากเงินเดือนสุทธิ
    // Math.Round(..., 2) → ปัดทศนิยม 2 ตำแหน่ง
    public decimal DebtBudget => Math.Round(NetSalary * DebtPercent / 100, 2);
    public decimal DailyBudget => Math.Round(NetSalary * DailyExpensePercent / 100, 2);
    public decimal SavingsBudget => Math.Round(NetSalary * SavingsPercent / 100, 2);
}
