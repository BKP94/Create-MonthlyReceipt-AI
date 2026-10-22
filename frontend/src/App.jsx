// ========================================================
// App.jsx — จุดเริ่มต้นหลักของ React Application
// ทำหน้าที่:
//   1. ครอบ ThemeProvider → กำหนด theme (สี, ฟอนต์) ทั้งแอป
//   2. ครอบ BrowserRouter → เปิดใช้งาน React Router (URL routing)
//   3. ครอบ Layout → กรอบหน้าจอ (Sidebar + AppBar)
//   4. กำหนด Routes → แต่ละ URL ตรงกับ Component ไหน
// ========================================================

import { lazy, Suspense, useMemo } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import useMediaQuery from '@mui/material/useMediaQuery';
import { createLedgerTheme } from './theme';
import Layout from './components/Layout';

// lazy — แต่ละหน้าแยกเป็นไฟล์ของตัวเอง โหลดเมื่อเปิดหน้านั้นครั้งแรก
// ก้อน recharts (~370 kB) จึงโหลดเฉพาะตอนเข้า Dashboard / ประวัติเงินเดือน
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Expenses = lazy(() => import('./pages/Expenses'));
const Installments = lazy(() => import('./pages/Installments'));
const Budget = lazy(() => import('./pages/Budget'));
const SalaryHistory = lazy(() => import('./pages/SalaryHistory'));
const MonthlySummary = lazy(() => import('./pages/MonthlySummary'));

function PageFallback() {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
      <CircularProgress aria-label="กำลังโหลดหน้า" />
    </Box>
  );
}

export default function App() {
  // โหมดมืดตามการตั้งค่าเครื่อง — noSsr ให้ได้ค่าจริงตั้งแต่ render แรก ไม่กระพริบ
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)', { noSsr: true });
  const theme = useMemo(() => createLedgerTheme(prefersDark ? 'dark' : 'light'), [prefersDark]);

  return (
    // ThemeProvider — ส่ง theme ลงไปทุก Component ลูก ผ่าน React Context
    <ThemeProvider theme={theme}>

      {/* CssBaseline — reset CSS ให้สม่ำเสมอทุก browser (คล้าย normalize.css) */}
      <CssBaseline />

      {/* HashRouter — URL เป็น /#/expenses
          ใช้แทน BrowserRouter เพราะ GitHub Pages เป็น static host
          ที่ rewrite ทุก path ไปที่ index.html ไม่ได้ (deep link จะได้ 404) */}
      <HashRouter>

        {/* Layout — กรอบหน้าจอหลัก (Sidebar + AppBar + เนื้อหา) */}
        <Layout>

          {/* Routes — จับคู่ URL กับ Component */}
          <Suspense fallback={<PageFallback />}>
          <Routes>
            {/* / → หน้าแดชบอร์ดสรุปภาพรวม */}
            <Route path="/"              element={<Dashboard />} />

            {/* /expenses → หน้ารายจ่ายรายเดือน */}
            <Route path="/expenses"      element={<Expenses />} />

            {/* /installments → หน้ารายการผ่อนชำระ */}
            <Route path="/installments"  element={<Installments />} />

            {/* /budget → หน้าตั้งค่างบประมาณ */}
            <Route path="/budget"        element={<Budget />} />

            {/* /salary-history → หน้าประวัติเงินเดือนรายปี */}
            <Route path="/salary-history" element={<SalaryHistory />} />

            {/* /monthly-summary → หน้าสรุปรายจ่ายรายเดือน 12 การ์ด */}
            <Route path="/monthly-summary" element={<MonthlySummary />} />
          </Routes>
          </Suspense>
        </Layout>
      </HashRouter>
    </ThemeProvider>
  );
}
