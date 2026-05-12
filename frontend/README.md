# Finance Frontend - โปรแกรมบริหารการเงินส่วนตัว

React.js + Material UI v5 สำหรับจัดการการเงินส่วนตัว

---

## ความต้องการของระบบ

- [Node.js 18+](https://nodejs.org/) (ปัจจุบันใช้ v24)
- npm 9+
- Backend API รันอยู่ที่ http://localhost:5000

---

## วิธีรัน

### 1. ติดตั้ง dependencies

```bash
cd C:\Project_BEER\Monthly_Receipt\frontend
npm install
```

### 2. รัน development server

```bash
npm run dev
```

Frontend จะรันที่ **http://localhost:3000**

> **สำคัญ:** ต้องรัน Backend (`dotnet run`) ก่อนเปิด Frontend

---

## หน้าที่มีในระบบ

| หน้า | URL | คำอธิบาย |
|------|-----|-----------|
| แดชบอร์ด | `/` | สรุปภาพรวมการเงิน, กราฟ 6 เดือน |
| รายจ่าย | `/expenses` | จัดการรายจ่ายรายเดือน |
| ผ่อนชำระ | `/installments` | รายการผ่อนชำระ + ความคืบหน้า |
| ตั้งค่างบ | `/budget` | ปรับเงินเดือนและสัดส่วน 50/30/20 |

---

## Tech Stack

- **React 18** + Vite 5
- **Material UI v5** (MUI)
- **Recharts** สำหรับกราฟ
- **React Router v6**
- **Axios** สำหรับ API calls
- **Sarabun font** (Google Fonts)

---

## โครงสร้างโปรเจกต์

```
frontend/
├── src/
│   ├── api/
│   │   └── financeApi.js    — Axios API calls
│   ├── components/
│   │   ├── Layout.jsx       — Sidebar + AppBar
│   │   ├── MonthSelector.jsx
│   │   └── ConfirmDialog.jsx
│   ├── pages/
│   │   ├── Dashboard.jsx    — แดชบอร์ด
│   │   ├── Expenses.jsx     — รายจ่าย
│   │   ├── Installments.jsx — ผ่อนชำระ
│   │   └── Budget.jsx       — งบประมาณ
│   ├── utils/
│   │   └── formatters.js    — ฟอร์แมตเงิน, ชื่อเดือนไทย
│   ├── App.jsx
│   ├── main.jsx
│   └── theme.js             — MUI theme (สีหลัก, ฟอนต์)
├── index.html
├── vite.config.js           — Proxy /api → localhost:5000
└── package.json
```

---

## Build for production

```bash
npm run build
npm run preview
```
