import axios from 'axios';

// ========================================================
// financeApi.js — ตัวกลางเรียก Backend API ทั้งหมด
// ใช้ axios library แทน fetch เพราะ syntax สั้นกว่า
// และจัดการ error / header ได้สะดวกกว่า
// ========================================================

// สร้าง axios instance ที่มี config กลางร่วมกัน
// baseURL: '/api' → ทุก request จะนำหน้าด้วย /api อัตโนมัติ
// proxy ใน vite.config.js แปลง /api → http://localhost:5000/api
const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
});

// =====================================================
// Expenses API — รายจ่ายรายเดือน
// =====================================================
export const expenseApi = {
  // GET /api/expenses?year=2026&month=5
  getAll: (year, month) =>
    api.get('/expenses', { params: year && month ? { year, month } : {} }),

  // GET /api/expenses/5
  getById: (id) => api.get(`/expenses/${id}`),

  // POST /api/expenses — ส่ง body เป็น JSON
  create: (data) => api.post('/expenses', data),

  // PUT /api/expenses/5 — อัปเดตทั้ง object
  update: (id, data) => api.put(`/expenses/${id}`, data),

  // PATCH /api/expenses/5/paid — อัปเดตเฉพาะสถานะชำระ (true/false)
  togglePaid: (id, isPaid) => api.patch(`/expenses/${id}/paid`, isPaid),

  // DELETE /api/expenses/5
  remove: (id) => api.delete(`/expenses/${id}`),
};

// =====================================================
// Installments API — รายการผ่อนชำระ
// =====================================================
export const installmentApi = {
  // activeOnly=true → ดึงเฉพาะที่ยังไม่หมด
  getAll: (activeOnly) =>
    api.get('/installments', { params: activeOnly ? { activeOnly: true } : {} }),

  getById: (id) => api.get(`/installments/${id}`),
  create: (data) => api.post('/installments', data),
  update: (id, data) => api.put(`/installments/${id}`, data),
  remove: (id) => api.delete(`/installments/${id}`),
};

// =====================================================
// Budget API — ตั้งค่างบประมาณ
// =====================================================
export const budgetApi = {
  get: () => api.get('/budget'),
  update: (data) => api.put('/budget', data),
};

// =====================================================
// Dashboard API — ข้อมูลสรุปภาพรวม
// =====================================================
export const dashboardApi = {
  get: (year, month) =>
    api.get('/dashboard', { params: year && month ? { year, month } : {} }),
};

// =====================================================
// Salary History API — ประวัติเงินเดือนรายปี
// =====================================================
export const salaryHistoryApi = {
  // GET /api/salary-history — ดึงทั้งหมด (เรียงปีจากเก่าไปใหม่)
  getAll: () => api.get('/salary-history'),

  // POST /api/salary-history — เพิ่มปีใหม่ (ถ้าปีล่าสุดจะ sync Budget อัตโนมัติ)
  create: (data) => api.post('/salary-history', data),

  // PUT /api/salary-history/1 — แก้ไข
  update: (id, data) => api.put(`/salary-history/${id}`, data),

  // DELETE /api/salary-history/1
  remove: (id) => api.delete(`/salary-history/${id}`),
};
