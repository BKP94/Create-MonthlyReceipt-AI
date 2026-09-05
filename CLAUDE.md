# Monthly Receipt — โปรแกรมบริหารการเงินส่วนตัว

## ⚠️ กฎข้อแรก — วิธีรันและอัปเดตแอป

แอปนี้ **รันเป็น Windows Service ชื่อ `FinanceApi`** ไม่ใช่ dev server

**ห้ามใช้ `dotnet run` เพื่อทดสอบ** — service ถือ port 5000 อยู่ จะแย่ง port กัน
(อาการ: API ตอบ 200 แต่ `Get-Service FinanceApi` ขึ้น Stopped)

แก้โค้ดแล้ว — ทั้ง C# และ frontend — ให้รันอันเดียวนี้ใน **PowerShell แบบ Run as administrator**:

```powershell
powershell -ExecutionPolicy Bypass -File C:\Project_BEER\Monthly_Receipt\scripts\update-service.ps1
```

สคริปต์ทำครบในตัว: build frontend → ก๊อปเข้า `wwwroot` → `dotnet publish` → รีสตาร์ท service → ทดสอบ API

| สคริปต์ | ใช้เมื่อไหร่ |
|---|---|
| `scripts\update-service.ps1` | แก้โค้ดแล้ว (ใช้บ่อยสุด) |
| `scripts\install-service.ps1` | ติดตั้งครั้งแรก / ย้ายโฟลเดอร์ |
| `scripts\uninstall-service.ps1` | ถอน service (ข้อมูลไม่หาย) |

ตรวจสถานะ:

```powershell
Get-Service FinanceApi
```

---

## โครงสร้าง

```
backend/FinanceApi/     ASP.NET Core (.NET 10) + EF Core + SQLite
  wwwroot/              frontend build (gitignored, สร้างจาก update-service.ps1)
backend/publish/        binary ที่ service รันจริง (gitignored)
frontend/               React 18 + Vite 5 + MUI v5
data/db/finance.db      ข้อมูลจริง (gitignored)
scripts/                สคริปต์จัดการ Windows Service
```

**หน้าเว็บกับ API อยู่โดเมนเดียวกัน** — backend เสิร์ฟ `wwwroot` ที่ `/` และ API ที่ `/api/*`
ไม่มี CORS ให้กังวลในการใช้งานปกติ

เข้าใช้งานจริงผ่าน Tailscale: `https://desktop-ptt1otr.tail2d0ea0.ts.net`
รายละเอียดทั้งหมดอยู่ใน [CONNECT.md](CONNECT.md)

---

## ข้อควรระวัง

- **ห้าม commit ข้อมูลการเงินจริง** — `data/db/` และ `data/samples/` อยู่ใน `.gitignore` แล้ว
  repo เป็น public เคยมีเคสข้อมูลจริงหลุดขึ้นไปแล้วต้องลบทั้ง history
- **สคริปต์ `.ps1` ต้องบันทึกเป็น UTF-8 with BOM** — Windows PowerShell 5.1 อ่านไฟล์ไม่มี BOM
  เป็น ANSI ทำให้ภาษาไทยเพี้ยนจน parser พัง (`The Try statement is missing its Catch`)
- **API ไม่มีระบบล็อกอิน** ด่านเดียวคือบัญชี Tailscale
- ข้อมูล response จาก API เป็น **PascalCase** (`MonthName`, `TotalExpenses`) ไม่ใช่ camelCase

---

## สำรองข้อมูล

```powershell
Stop-Service FinanceApi
Copy-Item C:\Project_BEER\Monthly_Receipt\data\db\finance.db "$env:USERPROFILE\Documents\finance-backup-$(Get-Date -f yyyyMMdd).db"
Start-Service FinanceApi
```
