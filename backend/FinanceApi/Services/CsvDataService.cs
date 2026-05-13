using System.Globalization;
using System.Text;
using FinanceApi.Models;

namespace FinanceApi.Services;

public class CsvDataService
{
    private readonly string _dataPath;
    private readonly string _expensesFile;
    private readonly string _installmentsFile;
    private readonly string _budgetFile;
    private readonly string _salaryHistoryFile;

    private static readonly object _lock = new();

    public CsvDataService(IConfiguration config)
    {
        _dataPath = config["DataPath"] ?? Path.Combine(AppContext.BaseDirectory, "data", "db");
        Directory.CreateDirectory(_dataPath);

        _expensesFile = Path.Combine(_dataPath, "expenses.csv");
        _installmentsFile = Path.Combine(_dataPath, "installments.csv");
        _budgetFile = Path.Combine(_dataPath, "budget.csv");
        _salaryHistoryFile = Path.Combine(_dataPath, "salary_history.csv");

        InitializeFiles();
    }

    private void InitializeFiles()
    {
        if (!File.Exists(_expensesFile))
        {
            WriteAllText(_expensesFile, "Id,Year,Month,Name,Amount,Category,DueDate,Note\r\n");
        }

        if (!File.Exists(_installmentsFile))
        {
            var sb = new StringBuilder();
            sb.AppendLine("Id,Name,TotalInstallments,PaidInstallments,MonthlyAmount,StartDate,Note");
            sb.AppendLine("1,ผ่อนรถมอไซค์,36,0,5157.00,2026-05-01,");
            sb.AppendLine("2,ผ่อนโช็ค,10,0,1357.00,2026-05-01,");
            WriteAllText(_installmentsFile, sb.ToString());
        }

        if (!File.Exists(_budgetFile))
        {
            var sb = new StringBuilder();
            sb.AppendLine("Salary,SocialSecurity,StudentLoan,OtherDeductions,DebtPercent,DailyExpensePercent,SavingsPercent,UpdatedAt");
            sb.AppendLine($"42334.00,0.00,0.00,0.00,50,30,20,{DateTime.Now.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture)}");
            WriteAllText(_budgetFile, sb.ToString());
        }

        if (!File.Exists(_salaryHistoryFile))
        {
            WriteAllText(_salaryHistoryFile, "Id,Year,Salary,Note,CreatedAt\r\n");
        }
    }

    // ==================== EXPENSES ====================

    public List<Expense> GetAllExpenses()
    {
        lock (_lock)
        {
            if (!File.Exists(_expensesFile)) return [];
            return ReadAllLines(_expensesFile)
                .Skip(1)
                .Where(l => !string.IsNullOrWhiteSpace(l))
                .Select(ParseExpense)
                .OfType<Expense>()
                .ToList();
        }
    }

    public List<Expense> GetExpensesByMonth(int year, int month)
    {
        return GetAllExpenses().Where(e => e.Year == year && e.Month == month).ToList();
    }

    public Expense? GetExpenseById(int id)
    {
        return GetAllExpenses().FirstOrDefault(e => e.Id == id);
    }

    public Expense AddExpense(Expense expense)
    {
        lock (_lock)
        {
            var expenses = ReadExpensesUnsafe();
            expense.Id = expenses.Count > 0 ? expenses.Max(e => e.Id) + 1 : 1;
            expenses.Add(expense);
            SaveExpensesUnsafe(expenses);
            return expense;
        }
    }

    public Expense? UpdateExpense(int id, Expense expense)
    {
        lock (_lock)
        {
            var expenses = ReadExpensesUnsafe();
            var idx = expenses.FindIndex(e => e.Id == id);
            if (idx < 0) return null;
            expense.Id = id;
            expenses[idx] = expense;
            SaveExpensesUnsafe(expenses);
            return expense;
        }
    }

    public bool DeleteExpense(int id)
    {
        lock (_lock)
        {
            var expenses = ReadExpensesUnsafe();
            var removed = expenses.RemoveAll(e => e.Id == id);
            if (removed > 0) SaveExpensesUnsafe(expenses);
            return removed > 0;
        }
    }

    private List<Expense> ReadExpensesUnsafe()
    {
        if (!File.Exists(_expensesFile)) return [];
        return ReadAllLines(_expensesFile)
            .Skip(1)
            .Where(l => !string.IsNullOrWhiteSpace(l))
            .Select(ParseExpense)
            .OfType<Expense>()
            .ToList();
    }

    private void SaveExpensesUnsafe(List<Expense> expenses)
    {
        var sb = new StringBuilder();
        sb.AppendLine("Id,Year,Month,Name,Amount,Category,DueDate,Note,IsPaid");
        foreach (var e in expenses)
        {
            sb.AppendLine(string.Join(",",
                e.Id, e.Year, e.Month,
                Escape(e.Name),
                e.Amount.ToString("F2"),
                Escape(e.Category),
                Escape(e.DueDate ?? ""),
                Escape(e.Note ?? ""),
                e.IsPaid ? "1" : "0"));
        }
        WriteAllText(_expensesFile, sb.ToString());
    }

    private static Expense? ParseExpense(string line)
    {
        try
        {
            var p = SplitCsv(line);
            if (p.Length < 6) return null;
            return new Expense
            {
                Id = int.Parse(p[0]),
                Year = int.Parse(p[1]),
                Month = int.Parse(p[2]),
                Name = p[3],
                Amount = decimal.Parse(p[4]),
                Category = p[5],
                DueDate = p.Length > 6 && !string.IsNullOrEmpty(p[6]) ? p[6] : null,
                Note = p.Length > 7 && !string.IsNullOrEmpty(p[7]) ? p[7] : null,
                IsPaid = p.Length > 8 && p[8] == "1"
            };
        }
        catch { return null; }
    }

    // ==================== INSTALLMENTS ====================

    public List<Installment> GetAllInstallments()
    {
        lock (_lock)
        {
            return ReadInstallmentsUnsafe();
        }
    }

    public Installment? GetInstallmentById(int id)
    {
        return GetAllInstallments().FirstOrDefault(i => i.Id == id);
    }

    public Installment AddInstallment(Installment installment)
    {
        lock (_lock)
        {
            var list = ReadInstallmentsUnsafe();
            installment.Id = list.Count > 0 ? list.Max(i => i.Id) + 1 : 1;
            list.Add(installment);
            SaveInstallmentsUnsafe(list);
            return installment;
        }
    }

    public Installment? UpdateInstallment(int id, Installment installment)
    {
        lock (_lock)
        {
            var list = ReadInstallmentsUnsafe();
            var idx = list.FindIndex(i => i.Id == id);
            if (idx < 0) return null;
            installment.Id = id;
            list[idx] = installment;
            SaveInstallmentsUnsafe(list);
            return installment;
        }
    }

    public bool DeleteInstallment(int id)
    {
        lock (_lock)
        {
            var list = ReadInstallmentsUnsafe();
            var removed = list.RemoveAll(i => i.Id == id);
            if (removed > 0) SaveInstallmentsUnsafe(list);
            return removed > 0;
        }
    }

    private List<Installment> ReadInstallmentsUnsafe()
    {
        if (!File.Exists(_installmentsFile)) return [];
        return ReadAllLines(_installmentsFile)
            .Skip(1)
            .Where(l => !string.IsNullOrWhiteSpace(l))
            .Select(ParseInstallment)
            .OfType<Installment>()
            .ToList();
    }

    private void SaveInstallmentsUnsafe(List<Installment> list)
    {
        var sb = new StringBuilder();
        sb.AppendLine("Id,Name,TotalInstallments,PaidInstallments,MonthlyAmount,StartDate,Note");
        foreach (var i in list)
        {
            sb.AppendLine(string.Join(",",
                i.Id,
                Escape(i.Name),
                i.TotalInstallments,
                i.PaidInstallments,
                i.MonthlyAmount.ToString("F2"),
                Escape(i.StartDate),
                Escape(i.Note ?? "")));
        }
        WriteAllText(_installmentsFile, sb.ToString());
    }

    private static Installment? ParseInstallment(string line)
    {
        try
        {
            var p = SplitCsv(line);
            if (p.Length < 6) return null;
            return new Installment
            {
                Id = int.Parse(p[0]),
                Name = p[1],
                TotalInstallments = int.Parse(p[2]),
                PaidInstallments = int.Parse(p[3]),
                MonthlyAmount = decimal.Parse(p[4]),
                StartDate = p[5],
                Note = p.Length > 6 && !string.IsNullOrEmpty(p[6]) ? p[6] : null
            };
        }
        catch { return null; }
    }

    // ==================== BUDGET ====================

    public Budget GetBudget()
    {
        lock (_lock)
        {
            if (!File.Exists(_budgetFile))
                return new Budget { UpdatedAt = DateTime.Now.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture) };

            var line = ReadAllLines(_budgetFile).Skip(1).FirstOrDefault(l => !string.IsNullOrWhiteSpace(l));
            return (line is not null ? ParseBudget(line) : null)
                   ?? new Budget { UpdatedAt = DateTime.Now.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture) };
        }
    }

    public Budget UpdateBudget(Budget budget)
    {
        lock (_lock)
        {
            budget.UpdatedAt = DateTime.Now.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);
            var sb = new StringBuilder();
            sb.AppendLine("Salary,SocialSecurity,StudentLoan,OtherDeductions,DebtPercent,DailyExpensePercent,SavingsPercent,UpdatedAt");
            sb.AppendLine($"{budget.Salary:F2},{budget.SocialSecurity:F2},{budget.StudentLoan:F2},{budget.OtherDeductions:F2},{budget.DebtPercent},{budget.DailyExpensePercent},{budget.SavingsPercent},{budget.UpdatedAt}");
            WriteAllText(_budgetFile, sb.ToString());
            return budget;
        }
    }

    private static Budget? ParseBudget(string line)
    {
        try
        {
            var p = SplitCsv(line);
            if (p.Length < 4) return null;

            // รองรับ format เก่า (4 คอลัมน์) และ format ใหม่ (8 คอลัมน์)
            bool isNewFormat = p.Length >= 8;
            return new Budget
            {
                Salary           = decimal.Parse(p[0]),
                SocialSecurity   = isNewFormat ? decimal.Parse(p[1]) : 0m,
                StudentLoan      = isNewFormat ? decimal.Parse(p[2]) : 0m,
                OtherDeductions  = isNewFormat ? decimal.Parse(p[3]) : 0m,
                DebtPercent          = decimal.Parse(p[isNewFormat ? 4 : 1]),
                DailyExpensePercent  = decimal.Parse(p[isNewFormat ? 5 : 2]),
                SavingsPercent       = decimal.Parse(p[isNewFormat ? 6 : 3]),
                UpdatedAt = p.Length > (isNewFormat ? 7 : 4)
                    ? p[isNewFormat ? 7 : 4]
                    : DateTime.Now.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture)
            };
        }
        catch { return null; }
    }

    // ==================== SALARY HISTORY ====================

    public List<SalaryHistory> GetAllSalaryHistory()
    {
        lock (_lock)
        {
            if (!File.Exists(_salaryHistoryFile)) return [];
            return ReadAllLines(_salaryHistoryFile)
                .Skip(1)
                .Where(l => !string.IsNullOrWhiteSpace(l))
                .Select(ParseSalaryHistory)
                .OfType<SalaryHistory>()
                .OrderBy(h => h.Year)
                .ToList();
        }
    }

    public SalaryHistory? GetSalaryHistoryById(int id)
    {
        return GetAllSalaryHistory().FirstOrDefault(h => h.Id == id);
    }

    public SalaryHistory AddSalaryHistory(SalaryHistory record)
    {
        lock (_lock)
        {
            var list = ReadSalaryHistoryUnsafe();
            record.Id = list.Count > 0 ? list.Max(h => h.Id) + 1 : 1;
            record.CreatedAt = DateTime.Now.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);
            list.Add(record);
            SaveSalaryHistoryUnsafe(list);
            return record;
        }
    }

    public SalaryHistory? UpdateSalaryHistory(int id, SalaryHistory record)
    {
        lock (_lock)
        {
            var list = ReadSalaryHistoryUnsafe();
            var idx = list.FindIndex(h => h.Id == id);
            if (idx < 0) return null;
            record.Id = id;
            record.CreatedAt = list[idx].CreatedAt; // คงวันที่เดิมไว้
            list[idx] = record;
            SaveSalaryHistoryUnsafe(list);
            return record;
        }
    }

    public bool DeleteSalaryHistory(int id)
    {
        lock (_lock)
        {
            var list = ReadSalaryHistoryUnsafe();
            var removed = list.RemoveAll(h => h.Id == id);
            if (removed > 0) SaveSalaryHistoryUnsafe(list);
            return removed > 0;
        }
    }

    private List<SalaryHistory> ReadSalaryHistoryUnsafe()
    {
        if (!File.Exists(_salaryHistoryFile)) return [];
        return ReadAllLines(_salaryHistoryFile)
            .Skip(1)
            .Where(l => !string.IsNullOrWhiteSpace(l))
            .Select(ParseSalaryHistory)
            .OfType<SalaryHistory>()
            .ToList();
    }

    private void SaveSalaryHistoryUnsafe(List<SalaryHistory> list)
    {
        var sb = new StringBuilder();
        sb.AppendLine("Id,Year,Salary,Note,CreatedAt");
        foreach (var h in list)
        {
            sb.AppendLine(string.Join(",",
                h.Id,
                h.Year,
                h.Salary.ToString("F2"),
                Escape(h.Note ?? ""),
                Escape(h.CreatedAt ?? "")));
        }
        WriteAllText(_salaryHistoryFile, sb.ToString());
    }

    private static SalaryHistory? ParseSalaryHistory(string line)
    {
        try
        {
            var p = SplitCsv(line);
            if (p.Length < 3) return null;
            return new SalaryHistory
            {
                Id        = int.Parse(p[0]),
                Year      = int.Parse(p[1]),
                Salary    = decimal.Parse(p[2]),
                Note      = p.Length > 3 && !string.IsNullOrEmpty(p[3]) ? p[3] : null,
                CreatedAt = p.Length > 4 && !string.IsNullOrEmpty(p[4]) ? p[4] : null,
            };
        }
        catch { return null; }
    }

    // ==================== HELPERS ====================

    private static string[] ReadAllLines(string path)
    {
        return File.ReadAllLines(path, new UTF8Encoding(encoderShouldEmitUTF8Identifier: true, throwOnInvalidBytes: false));
    }

    private static void WriteAllText(string path, string content)
    {
        File.WriteAllText(path, content, new UTF8Encoding(encoderShouldEmitUTF8Identifier: true));
    }

    private static string[] SplitCsv(string line)
    {
        var result = new List<string>();
        bool inQuotes = false;
        var current = new StringBuilder();

        for (int i = 0; i < line.Length; i++)
        {
            char c = line[i];
            if (c == '"')
            {
                if (inQuotes && i + 1 < line.Length && line[i + 1] == '"')
                {
                    current.Append('"');
                    i++;
                }
                else
                {
                    inQuotes = !inQuotes;
                }
            }
            else if (c == ',' && !inQuotes)
            {
                result.Add(current.ToString().Trim());
                current.Clear();
            }
            else
            {
                current.Append(c);
            }
        }
        result.Add(current.ToString().Trim());
        return [.. result];
    }

    private static string Escape(string value)
    {
        if (value.Contains(',') || value.Contains('"') || value.Contains('\n'))
            return $"\"{value.Replace("\"", "\"\"")}\"";
        return value;
    }
}
