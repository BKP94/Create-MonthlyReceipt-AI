import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
});

export const expenseApi = {
  getAll: (year, month) =>
    api.get('/expenses', { params: year && month ? { year, month } : {} }),
  getById: (id) => api.get(`/expenses/${id}`),
  create: (data) => api.post('/expenses', data),
  update: (id, data) => api.put(`/expenses/${id}`, data),
  togglePaid: (id, isPaid) => api.patch(`/expenses/${id}/paid`, isPaid),
  remove: (id) => api.delete(`/expenses/${id}`),
};

export const installmentApi = {
  getAll: (activeOnly) =>
    api.get('/installments', { params: activeOnly ? { activeOnly: true } : {} }),
  getById: (id) => api.get(`/installments/${id}`),
  create: (data) => api.post('/installments', data),
  update: (id, data) => api.put(`/installments/${id}`, data),
  remove: (id) => api.delete(`/installments/${id}`),
};

export const budgetApi = {
  get: () => api.get('/budget'),
  update: (data) => api.put('/budget', data),
};

export const dashboardApi = {
  get: (year, month) =>
    api.get('/dashboard', { params: year && month ? { year, month } : {} }),
};
