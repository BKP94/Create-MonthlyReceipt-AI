using Microsoft.EntityFrameworkCore;
using FinanceApi.Models;

namespace FinanceApi.Data;

// ========================================================
// FinanceDbContext.cs — EF Core Database Context
// เชื่อมต่อ Model กับ SQLite database (finance.db)
// แต่ละ DbSet<T> = 1 table ใน database
// ========================================================

public class FinanceDbContext : DbContext
{
    public FinanceDbContext(DbContextOptions<FinanceDbContext> options) : base(options) { }

    // ทั้ง 4 tables
    public DbSet<Expense>       Expenses        => Set<Expense>();
    public DbSet<Installment>   Installments    => Set<Installment>();
    public DbSet<Budget>        Budgets         => Set<Budget>();
    public DbSet<SalaryHistory> SalaryHistories => Set<SalaryHistory>();
}
