# Finance API - โปรแกรมบริหารการเงินส่วนตัว

ASP.NET Core Web API สำหรับจัดการการเงินส่วนตัว รองรับการบันทึกรายจ่าย, ผ่อนชำระ, และงบประมาณ 50/30/20

---

## ความต้องการของระบบ

- [.NET 10 SDK](https://dotnet.microsoft.com/download) หรือสูงกว่า

ตรวจสอบเวอร์ชัน:
```bash
dotnet --version
```

---

## วิธีรัน

```bash
cd C:\Project_BEER\Monthly_Receipt\backend\FinanceApi
dotnet run
```

API จะรันที่ **http://localhost:5000**

---

## โครงสร้างไฟล์ข้อมูล (CSV)

ไฟล์ข้อมูลอยู่ที่: `C:\Project_BEER\Monthly_Receipt\data\db\`

| ไฟล์ | คำอธิบาย |
|------|-----------|
| `expenses.csv` | รายจ่ายรายเดือน |
| `installments.csv` | รายการผ่อนชำระ (pre-populated จากข้อมูลตัวอย่าง) |
| `budget.csv` | เงินเดือนและสัดส่วนงบ 50/30/20 |

> ไฟล์จะถูกสร้างอัตโนมัติเมื่อรัน API ครั้งแรก

---

## API Endpoints

### รายจ่ายรายเดือน `/api/expenses`

| Method | Endpoint | คำอธิบาย |
|--------|----------|-----------|
| GET | `/api/expenses` | ดูรายจ่ายทั้งหมด |
| GET | `/api/expenses?year=2026&month=5` | กรองตามเดือน |
| GET | `/api/expenses/{id}` | ดูรายจ่ายตาม ID |
| POST | `/api/expenses` | เพิ่มรายจ่าย |
| PUT | `/api/expenses/{id}` | แก้ไขรายจ่าย |
| DELETE | `/api/expenses/{id}` | ลบรายจ่าย |

**ตัวอย่าง POST body:**
```json
{
  "Year": 2026,
  "Month": 5,
  "Name": "ค่าเช่าที่พัก",
  "Amount": 6000,
  "Category": "debt",
  "DueDate": "2026-05-01",
  "Note": ""
}
```

หมวดหมู่ (Category):
- `debt` = หนี้/ผ่อนชำระ (50%)
- `daily` = รายจ่ายประจำวัน (30%)
- `savings` = เงินเก็บ (20%)
- `other` = อื่นๆ

---

### ผ่อนชำระ `/api/installments`

| Method | Endpoint | คำอธิบาย |
|--------|----------|-----------|
| GET | `/api/installments` | ดูรายการผ่อนทั้งหมด |
| GET | `/api/installments?activeOnly=true` | ดูเฉพาะที่ยังผ่อนอยู่ |
| GET | `/api/installments/{id}` | ดูตาม ID |
| POST | `/api/installments` | เพิ่มรายการผ่อน |
| PUT | `/api/installments/{id}` | แก้ไข (เช่น อัปเดตงวดที่จ่ายแล้ว) |
| DELETE | `/api/installments/{id}` | ลบรายการ |

**ตัวอย่าง POST body:**
```json
{
  "Name": "ผ่อนรถยนต์",
  "TotalInstallments": 48,
  "PaidInstallments": 12,
  "MonthlyAmount": 3958.00,
  "StartDate": "2025-01-01",
  "Note": ""
}
```

---

### งบประมาณ `/api/budget`

| Method | Endpoint | คำอธิบาย |
|--------|----------|-----------|
| GET | `/api/budget` | ดูเงินเดือนและสัดส่วนงบ |
| PUT | `/api/budget` | อัปเดตเงินเดือนและสัดส่วน |

**ตัวอย่าง PUT body:**
```json
{
  "Salary": 42334,
  "DebtPercent": 50,
  "DailyExpensePercent": 30,
  "SavingsPercent": 20
}
```
> หมายเหตุ: DebtPercent + DailyExpensePercent + SavingsPercent ต้องรวมกันได้ 100%

---

### Dashboard `/api/dashboard`

| Method | Endpoint | คำอธิบาย |
|--------|----------|-----------|
| GET | `/api/dashboard` | สรุปการเงินเดือนปัจจุบัน |
| GET | `/api/dashboard?year=2026&month=5` | สรุปการเงินเดือนที่ระบุ |

**ผลลัพธ์ประกอบด้วย:**
- เงินเดือน + งบแต่ละส่วน (50/30/20)
- รายจ่ายรวมเดือนนี้ + เงินคงเหลือ
- รายการผ่อนที่ยังค้างอยู่
- แนวโน้มรายจ่าย 6 เดือนล่าสุด
- เปอร์เซ็นต์การใช้งบในแต่ละส่วน

---

## ตัวอย่างการทดสอบ API

```bash
# ดู Dashboard เดือนพฤษภาคม 2026
curl http://localhost:5000/api/dashboard?year=2026&month=5

# ดูรายจ่ายเดือนพฤษภาคม 2026
curl http://localhost:5000/api/expenses?year=2026&month=5

# เพิ่มรายจ่าย
curl -X POST http://localhost:5000/api/expenses \
  -H "Content-Type: application/json" \
  -d "{\"Year\":2026,\"Month\":5,\"Name\":\"ค่าน้ำไฟ\",\"Amount\":1200,\"Category\":\"debt\"}"

# ดูรายการผ่อนทั้งหมด
curl http://localhost:5000/api/installments

# อัปเดตเงินเดือน
curl -X PUT http://localhost:5000/api/budget \
  -H "Content-Type: application/json" \
  -d "{\"Salary\":45000,\"DebtPercent\":50,\"DailyExpensePercent\":30,\"SavingsPercent\":20}"
```

---

## การตั้งค่า

แก้ไข path ข้อมูลใน `appsettings.json`:
```json
{
  "DataPath": "C:\\Project_BEER\\Monthly_Receipt\\data\\db"
}
```
