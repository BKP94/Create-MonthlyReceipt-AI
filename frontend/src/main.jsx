import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.jsx';

// registerSW — ลงทะเบียน service worker ของ PWA
// immediate: true → เมื่อ deploy เวอร์ชันใหม่ service worker จะเข้าควบคุมทันที
// onNeedRefresh → reload หน้าให้อัตโนมัติ ผู้ใช้จะได้ไม่ค้างอยู่เวอร์ชันเก่า
registerSW({
  immediate: true,
  onNeedRefresh() {
    window.location.reload();
  },
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
