using FinanceApi.Data;
using FinanceApi.Models;
using Microsoft.EntityFrameworkCore;

namespace FinanceApi.Services;

// ========================================================
// SqliteDataService.cs — จัดการข้อมูลทั้งหมดผ่าน SQLite
// ใช้ IDbContextFactory เพราะ service นี้เป็น Singleton
// แต่ DbContext ต้องสร้างใหม่ต่อ operation (ไม่ใช่ thread-safe)
// ========================================================

public class SqliteDataService(IDbContextFactory<FinanceDbContext> factory)
{
    // สร้าง DbContext ใหม่ต่อ 1 operation
    private FinanceDbContext Db() => factory.CreateDbContext();

    // ==================== EXPENSES ====================

    public List<Expense> GetAllExpenses()
    {
        using var db = Db();
        return db.Expenses
            .OrderBy(e => e.Year).ThenBy(e => e.Month).ThenBy(e => e.Id)
            .ToList();
    }

    public List<Expense> GetExpensesByMonth(int year, int month)
    {
        using var db = Db();
        return db.Expenses
            .Where(e => e.Year == year && e.Month == month)
            .OrderBy(e => e.Id)
            .ToList();
    }

    public Expense? GetExpenseById(int id)
    {
        using var db = Db();
        return db.Expenses.FirstOrDefault(e => e.Id == id);
    }

    // แปลง DueDate ที่บันทึกในรูปแบบเก่า (d/M/yyyy) → yyyy-MM-dd
    // ใช้ raw SQL เพราะ SQLite string functions แม่นยำกว่า LINQ translation
    public void NormalizeDueDates()
    {
        using var db = Db();
        db.Database.ExecuteSqlRaw(@"
            UPDATE Expenses
            SET DueDate = (
                SUBSTR(DueDate,
                    INSTR(DueDate, '/') + INSTR(SUBSTR(DueDate, INSTR(DueDate, '/') + 1), '/') + 1, 4)
                || '-' ||
                SUBSTR('00' || SUBSTR(SUBSTR(DueDate, INSTR(DueDate, '/') + 1), 1,
                    INSTR(SUBSTR(DueDate, INSTR(DueDate, '/') + 1), '/') - 1), -2)
                || '-' ||
                SUBSTR('00' || SUBSTR(DueDate, 1, INSTR(DueDate, '/') - 1), -2)
            )
            WHERE DueDate LIKE '%/%'
        ");
    }

    public Expense AddExpense(Expense expense)
    {
        using var db = Db();
        expense.Id = 0; // ให้ SQLite Auto Increment กำหนด Id เอง
        db.Expenses.Add(expense);
        db.SaveChanges();
        return expense;
    }

    public Expense? UpdateExpense(int id, Expense expense)
    {
        using var db = Db();
        var existing = db.Expenses.FirstOrDefault(e => e.Id == id);
        if (existing is null) return null;
        // คัดลอกค่าทั้งหมดจาก expense ไปยัง existing (ยกเว้น [NotMapped])
        existing.Year     = expense.Year;
        existing.Month    = expense.Month;
        existing.Name     = expense.Name;
        existing.Amount   = expense.Amount;
        existing.Category = expense.Category;
        existing.DueDate  = expense.DueDate;
        existing.Note     = expense.Note;
        existing.IsPaid   = expense.IsPaid;
        db.SaveChanges();
        return existing;
    }

    public bool DeleteExpense(int id)
    {
        using var db = Db();
        var expense = db.Expenses.FirstOrDefault(e => e.Id == id);
        if (expense is null) return false;
        db.Expenses.Remove(expense);
        db.SaveChanges();
        return true;
    }

    // ==================== INSTALLMENTS ====================

    public List<Installment> GetAllInstallments()
    {
        using var db = Db();
        return db.Installments.OrderBy(i => i.Id).ToList();
    }

    public Installment? GetInstallmentById(int id)
    {
        using var db = Db();
        return db.Installments.FirstOrDefault(i => i.Id == id);
    }

    public Installment AddInstallment(Installment installment)
    {
        using var db = Db();
        installment.Id = 0;
        db.Installments.Add(installment);
        db.SaveChanges();
        return installment;
    }

    public Installment? UpdateInstallment(int id, Installment installment)
    {
        using var db = Db();
        var existing = db.Installments.FirstOrDefault(i => i.Id == id);
        if (existing is null) return null;
        existing.Name               = installment.Name;
        existing.TotalInstallments  = installment.TotalInstallments;
        existing.PaidInstallments   = installment.PaidInstallments;
        existing.MonthlyAmount      = installment.MonthlyAmount;
        existing.StartDate          = installment.StartDate;
        existing.Note               = installment.Note;
        db.SaveChanges();
        return existing;
    }

    public bool DeleteInstallment(int id)
    {
        using var db = Db();
        var inst = db.Installments.FirstOrDefault(i => i.Id == id);
        if (inst is null) return false;
        db.Installments.Remove(inst);
        db.SaveChanges();
        return true;
    }

    // ==================== BUDGET ====================

    public Budget GetBudget()
    {
        using var db = Db();
        // ถ้ายังไม่มีข้อมูล Budget → สร้าง row แรกด้วยค่า default
        var budget = db.Budgets.FirstOrDefault();
        if (budget is null)
        {
            budget = new Budget
            {
                Id        = 1,
                UpdatedAt = DateTime.Now.ToString("yyyy-MM-dd"),
            };
            db.Budgets.Add(budget);
            db.SaveChanges();
        }
        return budget;
    }

    public Budget UpdateBudget(Budget budget)
    {
        using var db = Db();
        budget.Id        = 1; // Budget มีแค่ 1 row เสมอ
        budget.UpdatedAt = DateTime.Now.ToString("yyyy-MM-dd");
        var existing = db.Budgets.FirstOrDefault();
        if (existing is null)
        {
            // ยังไม่มี row → insert
            db.Budgets.Add(budget);
        }
        else
        {
            // มีแล้ว → update
            existing.Salary              = budget.Salary;
            existing.SocialSecurity      = budget.SocialSecurity;
            existing.StudentLoan         = budget.StudentLoan;
            existing.OtherDeductions     = budget.OtherDeductions;
            existing.DebtPercent         = budget.DebtPercent;
            existing.DailyExpensePercent = budget.DailyExpensePercent;
            existing.SavingsPercent      = budget.SavingsPercent;
            existing.UpdatedAt           = budget.UpdatedAt;
            budget = existing; // return ตัวที่ track อยู่ (computed props จะคำนวณถูกต้อง)
        }
        db.SaveChanges();
        return budget;
    }

    // ==================== SALARY HISTORY ====================

    public List<SalaryHistory> GetAllSalaryHistory()
    {
        using var db = Db();
        return db.SalaryHistories.OrderBy(h => h.Year).ToList();
    }

    public SalaryHistory? GetSalaryHistoryById(int id)
    {
        using var db = Db();
        return db.SalaryHistories.FirstOrDefault(h => h.Id == id);
    }

    public SalaryHistory AddSalaryHistory(SalaryHistory record)
    {
        using var db = Db();
        record.Id        = 0;
        record.CreatedAt = DateTime.Now.ToString("yyyy-MM-dd");
        db.SalaryHistories.Add(record);
        db.SaveChanges();
        return record;
    }

    public SalaryHistory? UpdateSalaryHistory(int id, SalaryHistory record)
    {
        using var db = Db();
        var existing = db.SalaryHistories.FirstOrDefault(h => h.Id == id);
        if (existing is null) return null;
        existing.Year   = record.Year;
        existing.Salary = record.Salary;
        existing.Note   = record.Note;
        // CreatedAt คงเดิม ไม่เปลี่ยนวันที่บันทึกครั้งแรก
        db.SaveChanges();
        return existing;
    }

    public bool DeleteSalaryHistory(int id)
    {
        using var db = Db();
        var record = db.SalaryHistories.FirstOrDefault(h => h.Id == id);
        if (record is null) return false;
        db.SalaryHistories.Remove(record);
        db.SaveChanges();
        return true;
    }
}
