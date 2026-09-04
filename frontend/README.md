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

## มือถือ & PWA

หน้าจอปรับตามขนาดอัตโนมัติที่ breakpoint `md` (900px):

- **จอเล็ก** — ตารางเปลี่ยนเป็นการ์ด (`MobileDataCard`), ปุ่มเพิ่มเป็นปุ่มลอยมุมขวาล่าง (`AddFab`),
  dialog เปิดเต็มจอ (`ResponsiveDialog`), เมนูซ่อนหลังปุ่ม hamburger
- **จอใหญ่** — ตารางและ sidebar เหมือนเดิมทุกอย่าง

แอปเป็น PWA (ผ่าน `vite-plugin-pwa`) — ติดตั้งลงหน้าจอโฮมมือถือได้ และเปิดดูข้อมูล
ที่โหลดไว้แล้วได้แม้ออฟไลน์ (service worker cache API แบบ NetworkFirst)

ไอคอนสร้างจากโค้ด ไม่ต้องใช้โปรแกรมแต่งรูป:

```bash
node scripts/generate-icons.mjs
```

> service worker ถูกปิดไว้ตอน `pnpm dev` (`devOptions.enabled: false`) เพื่อไม่ให้กวน HMR
> ถ้าจะทดสอบ PWA จริงต้อง `pnpm build && pnpm preview`

---

## ตัวแปรสภาพแวดล้อม

ดู `.env.example` — ปกติตอนพัฒนาไม่ต้องตั้งอะไร

| ตัวแปร | ใช้ทำอะไร |
|---|---|
| `VITE_BASE_PATH` | path ที่แอปถูกเสิร์ฟ (GitHub Pages ต้องเป็น `/<repo>/`) |
| `VITE_API_URL` | origin ของ backend เมื่ออยู่คนละโดเมนกับ frontend |

---

## Deploy

ดู [DEPLOY.md](../DEPLOY.md) — frontend ไป GitHub Pages, backend ไป Azure App Service

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
