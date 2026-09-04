// ========================================================
// apiConfig.js — จัดการ URL ของ backend แบบตั้งค่าได้ตอนรัน
//
// ทำไมต้องตั้งตอนรัน ไม่ใช่ตอน build?
//   Cloudflare Tunnel แบบไม่ผูกโดเมน (quick tunnel) จะสุ่ม URL ใหม่
//   ทุกครั้งที่รีสตาร์ท ถ้าฝัง URL ไว้ตอน build จะต้อง rebuild + deploy
//   ใหม่ทุกครั้ง — ใช้จริงไม่ไหว จึงเก็บไว้ใน localStorage ของเบราว์เซอร์แทน
//
// ลำดับความสำคัญ:
//   1. ค่าที่ผู้ใช้กรอกในหน้าตั้งค่า (localStorage)
//   2. VITE_API_URL ที่ตั้งตอน build (ถ้ามี)
//   3. '' → เรียก /api บนโดเมนเดียวกัน (โหมดพัฒนา ผ่าน dev proxy)
// ========================================================

const STORAGE_KEY = 'finance.apiBaseUrl';

// อ่านค่าจาก localStorage — ครอบ try/catch เพราะเบราว์เซอร์บางโหมด
// (private browsing บางตัว) โยน error เมื่อเข้าถึง localStorage
function readStored() {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? '';
  } catch {
    return '';
  }
}

// getApiBaseUrl — origin ของ backend เช่น 'https://xxx.trycloudflare.com'
// คืน '' หมายถึงใช้โดเมนเดียวกับหน้าเว็บ
export function getApiBaseUrl() {
  return readStored() || import.meta.env.VITE_API_URL || '';
}

// setApiBaseUrl — บันทึกค่าที่ผู้ใช้กรอก ('' = ล้างค่า กลับไปใช้ค่า default)
export function setApiBaseUrl(url) {
  const clean = (url ?? '').trim().replace(/\/+$/, ''); // ตัด / ท้ายออก
  try {
    if (clean) localStorage.setItem(STORAGE_KEY, clean);
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // เขียนไม่ได้ก็ปล่อยผ่าน — ผู้ใช้จะต้องกรอกใหม่รอบหน้า
  }
  return clean;
}

// getApiRoot — path เต็มที่ axios ใช้เป็น baseURL
export function getApiRoot() {
  const base = getApiBaseUrl();
  return base ? `${base}/api` : '/api';
}

// isConfigured — true เมื่อมี backend URL ชัดเจนแล้ว
// ใช้ตัดสินว่าจะเด้งหน้าตั้งค่าให้ผู้ใช้กรอกหรือยัง
export function isConfigured() {
  return Boolean(getApiBaseUrl());
}
