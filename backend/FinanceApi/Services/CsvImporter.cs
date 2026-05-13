using System.Globalization;
using System.Text;
using FinanceApi.Data;
using FinanceApi.Models;

namespace FinanceApi.Services;

// ========================================================
// CsvImporter.cs — ตัวช่วยนำเข้าข้อมูลจาก CSV → SQLite
// รันเพียงครั้งเดียวตอน startup ถ้า database ยังว่างเปล่า
// หลังจากนั้น SqliteDataService จัดการข้อมูลทั้งหมดแทน
// ========================================================

public static class CsvImporter
{
    // เรียกจาก Program.cs หลัง EnsureCreated()
    // ถ้า Expenses และ Installments ว่างทั้งคู่ → นำเข้าจาก CSV
    public static void ImportIfEmpty(FinanceDbContext db, string csvPath)
    {
        bool hasExpenses     = db.Expenses.Any();
        bool hasInstallments = db.Installments.Any();
        bool hasBudget       = db.Budgets.Any();

        // ถ้ามีข้อมูลอยู่แล้ว → ข้ามการนำเข้า
        if (hasExpenses && hasInstallments && hasBudget) return;

        Console.WriteLine("[CsvImporter] กำลังนำเข้าข้อมูลจาก CSV ไปยัง SQLite...");

        if (!hasExpenses)
            ImportExpenses(db, Path.Combine(csvPath, "expenses.csv"));

        if (!hasInstallments)
            ImportInstallments(db, Path.Combine(csvPath, "installments.csv"));

        if (!hasBudget)
            ImportBudget(db, Path.Combine(csvPath, "budget.csv"));

        ImportSalaryHistory(db, Path.Combine(csvPath, "salary_history.csv"));

        Console.WriteLine("[CsvImporter] นำเข้าข้อมูลเสร็จสิ้น ✓");
    }

    // ==================== นำเข้า Expenses ====================
    private static void ImportExpenses(FinanceDbContext db, string filePath)
    {
        if (!File.Exists(filePath)) return;
        var count = 0;
        foreach (var line in ReadLines(filePath))
        {
            var p = SplitCsv(line);
            if (p.Length < 6) continue;
            try
            {
                db.Expenses.Add(new Expense
                {
                    Id       = int.Parse(p[0]),
                    Year     = int.Parse(p[1]),
                    Month    = int.Parse(p[2]),
                    Name     = p[3],
                    Amount   = decimal.Parse(p[4], CultureInfo.InvariantCulture),
                    Category = p[5],
                    DueDate  = p.Length > 6 && !string.IsNullOrEmpty(p[6]) ? p[6] : null,
                    Note     = p.Length > 7 && !string.IsNullOrEmpty(p[7]) ? p[7] : null,
                    IsPaid   = p.Length > 8 && p[8] == "1",
                });
                count++;
            }
            catch { /* ข้าม row ที่ parse ไม่ได้ */ }
        }
        db.SaveChanges();
        Console.WriteLine($"  Expenses: นำเข้า {count} รายการ");
    }

    // ==================== นำเข้า Installments ====================
    private static void ImportInstallments(FinanceDbContext db, string filePath)
    {
        if (!File.Exists(filePath)) return;
        var count = 0;
        foreach (var line in ReadLines(filePath))
        {
            var p = SplitCsv(line);
            if (p.Length < 6) continue;
            try
            {
                db.Installments.Add(new Installment
                {
                    Id                 = int.Parse(p[0]),
                    Name               = p[1],
                    TotalInstallments  = int.Parse(p[2]),
                    PaidInstallments   = int.Parse(p[3]),
                    MonthlyAmount      = decimal.Parse(p[4], CultureInfo.InvariantCulture),
                    StartDate          = p[5],
                    Note               = p.Length > 6 && !string.IsNullOrEmpty(p[6]) ? p[6] : null,
                });
                count++;
            }
            catch { }
        }
        db.SaveChanges();
        Console.WriteLine($"  Installments: นำเข้า {count} รายการ");
    }

    // ==================== นำเข้า Budget ====================
    private static void ImportBudget(FinanceDbContext db, string filePath)
    {
        if (!File.Exists(filePath)) return;
        var line = ReadLines(filePath).FirstOrDefault();
        if (line is null) return;
        var p = SplitCsv(line);
        if (p.Length < 4) return;
        try
        {
            bool isNewFormat = p.Length >= 8;
            db.Budgets.Add(new Budget
            {
                Id                   = 1,
                Salary               = decimal.Parse(p[0], CultureInfo.InvariantCulture),
                SocialSecurity       = isNewFormat ? decimal.Parse(p[1], CultureInfo.InvariantCulture) : 0m,
                StudentLoan          = isNewFormat ? decimal.Parse(p[2], CultureInfo.InvariantCulture) : 0m,
                OtherDeductions      = isNewFormat ? decimal.Parse(p[3], CultureInfo.InvariantCulture) : 0m,
                DebtPercent          = decimal.Parse(p[isNewFormat ? 4 : 1], CultureInfo.InvariantCulture),
                DailyExpensePercent  = decimal.Parse(p[isNewFormat ? 5 : 2], CultureInfo.InvariantCulture),
                SavingsPercent       = decimal.Parse(p[isNewFormat ? 6 : 3], CultureInfo.InvariantCulture),
                UpdatedAt            = p.Length > (isNewFormat ? 7 : 4)
                    ? p[isNewFormat ? 7 : 4]
                    : DateTime.Now.ToString("yyyy-MM-dd"),
            });
            db.SaveChanges();
            Console.WriteLine("  Budget: นำเข้าสำเร็จ");
        }
        catch { }
    }

    // ==================== นำเข้า SalaryHistory ====================
    private static void ImportSalaryHistory(FinanceDbContext db, string filePath)
    {
        if (!File.Exists(filePath)) return;
        // ถ้ามีข้อมูลอยู่แล้วให้ข้าม (เผื่อเรียกซ้ำ)
        if (db.SalaryHistories.Any()) return;
        var count = 0;
        foreach (var line in ReadLines(filePath))
        {
            var p = SplitCsv(line);
            if (p.Length < 3) continue;
            try
            {
                db.SalaryHistories.Add(new SalaryHistory
                {
                    Id        = int.Parse(p[0]),
                    Year      = int.Parse(p[1]),
                    Salary    = decimal.Parse(p[2], CultureInfo.InvariantCulture),
                    Note      = p.Length > 3 && !string.IsNullOrEmpty(p[3]) ? p[3] : null,
                    CreatedAt = p.Length > 4 && !string.IsNullOrEmpty(p[4]) ? p[4] : null,
                });
                count++;
            }
            catch { }
        }
        if (count > 0)
        {
            db.SaveChanges();
            Console.WriteLine($"  SalaryHistory: นำเข้า {count} รายการ");
        }
    }

    // ==================== HELPERS ====================

    // อ่านทุก line ยกเว้น header (บรรทัดแรก)
    private static IEnumerable<string> ReadLines(string path)
    {
        var encoding = new UTF8Encoding(encoderShouldEmitUTF8Identifier: true, throwOnInvalidBytes: false);
        return File.ReadAllLines(path, encoding)
            .Skip(1)
            .Where(l => !string.IsNullOrWhiteSpace(l));
    }

    // CSV parser เหมือนกับใน CsvDataService
    private static string[] SplitCsv(string line)
    {
        var result = new List<string>();
        bool inQuotes = false;
        var current = new System.Text.StringBuilder();
        for (int i = 0; i < line.Length; i++)
        {
            char c = line[i];
            if (c == '"')
            {
                if (inQuotes && i + 1 < line.Length && line[i + 1] == '"')
                { current.Append('"'); i++; }
                else
                { inQuotes = !inQuotes; }
            }
            else if (c == ',' && !inQuotes)
            { result.Add(current.ToString().Trim()); current.Clear(); }
            else
            { current.Append(c); }
        }
        result.Add(current.ToString().Trim());
        return [.. result];
    }
}
