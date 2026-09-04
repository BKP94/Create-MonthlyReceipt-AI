using FinanceApi.Data;
using FinanceApi.Services;
using Microsoft.EntityFrameworkCore;

// ========================================================
// Program.cs — จุดเริ่มต้นของ ASP.NET Core Web API
// ========================================================

var builder = WebApplication.CreateBuilder(args);

// รันเป็น Windows Service ได้ — เริ่มเองตอนเปิดเครื่องโดยไม่ต้องล็อกอิน
// และไม่มีหน้าต่าง console ค้างอยู่
// เมื่อรันปกติด้วย `dotnet run` บรรทัดนี้ไม่มีผลอะไร (ตรวจเองว่าอยู่ในโหมดไหน)
// ContentRootPath ถูกตั้งเป็นโฟลเดอร์ของ .exe ให้อัตโนมัติ
// จึงอ่าน appsettings.json เจอแม้ working directory ของ service จะเป็น System32
builder.Services.AddWindowsService(options =>
{
    options.ServiceName = "FinanceApi";
});

// กำหนดให้ Backend รันที่ port 5000 เสมอ
// ผูกกับ localhost เท่านั้น — เครื่องอื่นใน LAN เข้าตรงๆ ไม่ได้
// การเข้าจากมือถือทำผ่าน tunnel ที่รันบนเครื่องเดียวกัน (ดู CONNECT.md)
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

// ตั้งค่า CORS — อนุญาต Frontend เรียก Backend
// localhost:3000 = โหมดพัฒนา
// origin เพิ่มเติมตั้งผ่าน config "AllowedOrigins" (คั่นด้วย ,)
//   เช่น environment variable: AllowedOrigins=https://bkp94.github.io
// จำเป็นเมื่อ deploy frontend ขึ้น GitHub Pages ซึ่งอยู่คนละโดเมนกับ backend
var allowedOrigins = (builder.Configuration["AllowedOrigins"] ?? "")
    .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
    .Append("http://localhost:3000")
    .Distinct()
    .ToArray();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(allowedOrigins)
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
