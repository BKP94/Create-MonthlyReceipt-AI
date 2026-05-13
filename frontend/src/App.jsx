// ========================================================
// App.jsx — จุดเริ่มต้นหลักของ React Application
// ทำหน้าที่:
//   1. ครอบ ThemeProvider → กำหนด theme (สี, ฟอนต์) ทั้งแอป
//   2. ครอบ BrowserRouter → เปิดใช้งาน React Router (URL routing)
//   3. ครอบ Layout → กรอบหน้าจอ (Sidebar + AppBar)
//   4. กำหนด Routes → แต่ละ URL ตรงกับ Component ไหน
// ========================================================

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Expenses from './pages/Expenses';
import Installments from './pages/Installments';
import Budget from './pages/Budget';

export default function App() {
  return (
    // ThemeProvider — ส่ง theme ลงไปทุก Component ลูก ผ่าน React Context
    <ThemeProvider theme={theme}>

      {/* CssBaseline — reset CSS ให้สม่ำเสมอทุก browser (คล้าย normalize.css) */}
      <CssBaseline />

      {/* BrowserRouter — เปิดใช้ HTML5 History API สำหรับ navigation */}
      <BrowserRouter>

        {/* Layout — กรอบหน้าจอหลัก (Sidebar + AppBar + เนื้อหา) */}
        <Layout>

          {/* Routes — จับคู่ URL กับ Component */}
          <Routes>
            {/* / → หน้าแดชบอร์ดสรุปภาพรวม */}
            <Route path="/"              element={<Dashboard />} />

            {/* /expenses → หน้ารายจ่ายรายเดือน */}
            <Route path="/expenses"      element={<Expenses />} />

            {/* /installments → หน้ารายการผ่อนชำระ */}
            <Route path="/installments"  element={<Installments />} />

            {/* /budget → หน้าตั้งค่างบประมาณ */}
            <Route path="/budget"        element={<Budget />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </ThemeProvider>
  );
}
