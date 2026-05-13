using FinanceApi.Services;

// ========================================================
// Program.cs — จุดเริ่มต้นของ ASP.NET Core Web API
// ทุกอย่างใน .NET 6+ เริ่มที่ไฟล์นี้ไฟล์เดียว (Minimal Hosting Model)
// ========================================================

var builder = WebApplication.CreateBuilder(args);

// กำหนดให้ Backend รันที่ port 5000 เสมอ
builder.WebHost.UseUrls("http://localhost:5000");

// ลงทะเบียน Controllers และปรับ JSON serializer
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        // PropertyNamingPolicy = null → ชื่อ property ใน JSON ตรงกับ C# เลย (PascalCase)
        // เช่น "Salary", "IsPaid" ไม่ใช่ "salary", "isPaid"
        options.JsonSerializerOptions.PropertyNamingPolicy = null;

        // WriteIndented = true → JSON ที่ส่งกลับมีการจัดย่อหน้า อ่านง่ายขึ้น
        options.JsonSerializerOptions.WriteIndented = true;
    });

// เพิ่ม OpenAPI (Swagger) สำหรับ document API อัตโนมัติ
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddOpenApi();

// ตั้งค่า CORS (Cross-Origin Resource Sharing)
// เพราะ Frontend (port 3000) และ Backend (port 5000) คนละ origin กัน
// ถ้าไม่ตั้ง CORS, browser จะ block request จาก Frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:3000")  // อนุญาตเฉพาะ Frontend
              .AllowAnyHeader()                       // อนุญาตทุก HTTP Header
              .AllowAnyMethod();                      // อนุญาตทุก HTTP Method (GET, POST, PUT, DELETE, PATCH)
    });
});

// ลงทะเบียน CsvDataService เป็น Singleton
// Singleton = สร้าง instance เดียวตลอดอายุโปรแกรม → ไม่สร้างใหม่ทุก request
// เหมาะกับ CsvDataService เพราะมี _lock สำหรับ thread-safe file access
builder.Services.AddSingleton<CsvDataService>();

var app = builder.Build();

// เปิด OpenAPI endpoint เฉพาะตอน Development
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

// ใช้ CORS policy ที่ตั้งไว้ด้านบน (ต้องมาก่อน MapControllers)
app.UseCors("AllowFrontend");

// Map URL path ไปหา Controller/Action โดยอัตโนมัติตาม Attribute [Route]
app.MapControllers();

app.Run();
