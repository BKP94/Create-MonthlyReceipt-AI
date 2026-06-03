using FinanceApi.Data;
using FinanceApi.Services;
using Microsoft.EntityFrameworkCore;

// ========================================================
// Program.cs — จุดเริ่มต้นของ ASP.NET Core Web API
// ========================================================

var builder = WebApplication.CreateBuilder(args);

// กำหนดให้ Backend รันที่ port 5000 เสมอ
builder.WebHost.UseUrls("http://localhost:5000");

// ลงทะเบียน Controllers และปรับ JSON serializer
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        // PropertyNamingPolicy = null → ชื่อ property ใน JSON ตรงกับ C# เลย (PascalCase)
        options.JsonSerializerOptions.PropertyNamingPolicy = null;
        options.JsonSerializerOptions.WriteIndented = true;
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddOpenApi();

// ตั้งค่า CORS — อนุญาต Frontend (port 3000) เรียก Backend (port 5000)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:3000")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// =========================================================
// SQLite + EF Core
// DataPath จาก config หรือใช้ default → data/db/finance.db
// =========================================================
var dataPath = builder.Configuration["DataPath"]
    ?? Path.Combine(AppContext.BaseDirectory, "data", "db");
Directory.CreateDirectory(dataPath);

var dbFile = Path.Combine(dataPath, "finance.db");

// AddDbContextFactory → SqliteDataService (Singleton) สร้าง DbContext ใหม่ต่อ operation
builder.Services.AddDbContextFactory<FinanceDbContext>(options =>
    options.UseSqlite($"Data Source={dbFile}"));

builder.Services.AddSingleton<SqliteDataService>();

var app = builder.Build();

// EnsureCreated() → สร้าง tables ถ้ายังไม่มี (ไม่ลบข้อมูลเดิม)
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<FinanceDbContext>();
    db.Database.EnsureCreated();
}

// Normalize DueDates — แปลง format เก่า (d/M/yyyy) → yyyy-MM-dd ครั้งเดียวตอน startup
app.Services.GetRequiredService<SqliteDataService>().NormalizeDueDates();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors("AllowFrontend");
app.MapControllers();

app.Run();
