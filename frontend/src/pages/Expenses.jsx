import { useState, useEffect, useCallback } from 'react';
import {
  Alert, Box, Button, Card, CardContent, Checkbox, Chip, CircularProgress,
  Dialog, DialogActions, DialogContent, DialogTitle,
  FormControl, Grid, IconButton, InputLabel, MenuItem,
  Paper, Select, Snackbar, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TextField, Tooltip, Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { expenseApi } from '../api/financeApi';
import ConfirmDialog from '../components/ConfirmDialog';
import MonthSelector from '../components/MonthSelector';
import {
  formatCurrency, thaiFullMonths, categoryConfig, YEARS,
} from '../utils/formatters';

const CATEGORIES = [
  { value: 'debt',    label: 'หนี้/ผ่อน' },
  { value: 'daily',  label: 'ประจำวัน' },
  { value: 'savings',label: 'เงินเก็บ' },
  { value: 'other',  label: 'อื่นๆ' },
];

const emptyForm = {
  Name: '', Amount: '', Category: 'debt',
  Year: new Date().getFullYear(), Month: new Date().getMonth() + 1,
  DueDate: '', Note: '',
};

function ExpenseDialog({ open, expense, defaultYear, defaultMonth, onClose, onSaved }) {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (open) {
      setForm(expense
        ? { ...expense, Amount: expense.Amount?.toString() ?? '' }
        : { ...emptyForm, Year: defaultYear, Month: defaultMonth }
      );
      setErrors({});
    }
  }, [open, expense, defaultYear, defaultMonth]);

  const validate = () => {
    const e = {};
    if (!form.Name.trim()) e.Name = 'กรุณาระบุชื่อรายการ';
    if (!form.Amount || isNaN(form.Amount) || Number(form.Amount) <= 0)
      e.Amount = 'กรุณาระบุจำนวนเงินที่ถูกต้อง';
    if (!form.Category) e.Category = 'กรุณาเลือกหมวดหมู่';
    return e;
  };

  const handleSave = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    try {
      const payload = { ...form, Amount: parseFloat(form.Amount), Year: Number(form.Year), Month: Number(form.Month) };
      if (expense?.Id) await expenseApi.update(expense.Id, payload);
      else await expenseApi.create(payload);
      onSaved('บันทึกรายการเรียบร้อยแล้ว');
    } catch {
      onSaved('เกิดข้อผิดพลาด กรุณาลองใหม่', 'error');
    } finally {
      setSaving(false);
    }
  };

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{expense ? 'แก้ไขรายจ่าย' : 'เพิ่มรายจ่าย'}</DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <Grid container spacing={2} sx={{ mt: 0 }}>
          <Grid item xs={12}>
            <TextField label="ชื่อรายการ *" fullWidth value={form.Name}
              onChange={set('Name')} error={!!errors.Name} helperText={errors.Name} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="จำนวนเงิน (บาท) *" fullWidth type="number"
              value={form.Amount} onChange={set('Amount')}
              error={!!errors.Amount} helperText={errors.Amount}
              inputProps={{ min: 0, step: '0.01' }} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth error={!!errors.Category}>
              <InputLabel>หมวดหมู่ *</InputLabel>
              <Select value={form.Category} label="หมวดหมู่ *" onChange={set('Category')}>
                {CATEGORIES.map((c) => (
                  <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} sm={6}>
            <FormControl fullWidth>
              <InputLabel>ปี</InputLabel>
              <Select value={form.Year} label="ปี" onChange={set('Year')}>
                {YEARS.map((y) => <MenuItem key={y} value={y}>{y + 543}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} sm={6}>
            <FormControl fullWidth>
              <InputLabel>เดือน</InputLabel>
              <Select value={form.Month} label="เดือน" onChange={set('Month')}>
                {thaiFullMonths.slice(1).map((n, i) => (
                  <MenuItem key={i + 1} value={i + 1}>{n}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="วันครบกำหนด" fullWidth type="date"
              value={form.DueDate ?? ''} onChange={set('DueDate')}
              InputLabelProps={{ shrink: true }} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="หมายเหตุ" fullWidth value={form.Note ?? ''}
              onChange={set('Note')} />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        <Button variant="outlined" onClick={onClose} fullWidth disabled={saving}>ยกเลิก</Button>
        <Button variant="contained" onClick={handleSave} fullWidth disabled={saving}>
          {saving ? <CircularProgress size={22} /> : 'บันทึก'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function Expenses() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' });

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await expenseApi.getAll(year, month);
      setExpenses(res.data);
    } catch {
      showSnack('โหลดข้อมูลไม่สำเร็จ', 'error');
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);

  const showSnack = (msg, severity = 'success') =>
    setSnack({ open: true, msg, severity });

  const handleSaved = (msg, severity = 'success') => {
    setDialogOpen(false);
    setEditTarget(null);
    showSnack(msg, severity);
    if (severity !== 'error') fetchExpenses();
  };

  const handleTogglePaid = async (exp) => {
    const newVal = !exp.IsPaid;
    setExpenses((prev) => prev.map((e) => e.Id === exp.Id ? { ...e, IsPaid: newVal } : e));
    try {
      await expenseApi.togglePaid(exp.Id, newVal);
    } catch {
      setExpenses((prev) => prev.map((e) => e.Id === exp.Id ? { ...e, IsPaid: exp.IsPaid } : e));
    }
  };

  const handleDelete = async () => {
    try {
      await expenseApi.remove(deleteId);
      showSnack('ลบรายการเรียบร้อยแล้ว');
      fetchExpenses();
    } catch {
      showSnack('ลบไม่สำเร็จ', 'error');
    } finally {
      setDeleteId(null);
    }
  };

  const total = expenses.reduce((s, e) => s + (e.Amount ?? 0), 0);
  const byCategory = CATEGORIES.map((c) => ({
    ...c,
    total: expenses.filter((e) => e.Category === c.value).reduce((s, e) => s + e.Amount, 0),
  })).filter((c) => c.total > 0);

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2} mb={3}>
        <Typography variant="h5">รายจ่ายรายเดือน</Typography>
        <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
          <MonthSelector year={year} month={month} onChange={(y, m) => { setYear(y); setMonth(m); }} />
          <Button variant="contained" startIcon={<AddIcon />}
            onClick={() => { setEditTarget(null); setDialogOpen(true); }}>
            เพิ่มรายจ่าย
          </Button>
        </Box>
      </Box>

      {/* Summary chips */}
      {!loading && expenses.length > 0 && (
        <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
          <Chip label={`รวม ${expenses.length} รายการ`} variant="outlined" size="medium" />
          <Chip label={`ยอดรวม ฿${formatCurrency(total)}`} color="error" variant="outlined" size="medium" />
          {byCategory.map((c) => (
            <Chip key={c.value}
              label={`${c.label}: ฿${formatCurrency(c.total)}`}
              color={categoryConfig[c.value]?.color}
              variant="outlined" size="medium" />
          ))}
        </Box>
      )}

      <Card>
        <CardContent sx={{ p: 0 }}>
          {loading ? (
            <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>
          ) : expenses.length === 0 ? (
            <Box py={6} textAlign="center">
              <Typography color="text.secondary" mb={2}>
                ยังไม่มีรายจ่ายในเดือนนี้
              </Typography>
              <Button variant="outlined" startIcon={<AddIcon />}
                onClick={() => { setEditTarget(null); setDialogOpen(true); }}>
                เพิ่มรายจ่ายแรก
              </Button>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: '#F5F5F5' } }}>
                    <TableCell padding="checkbox" />
                    <TableCell>#</TableCell>
                    <TableCell>ชื่อรายการ</TableCell>
                    <TableCell align="center">หมวดหมู่</TableCell>
                    <TableCell align="right">จำนวนเงิน</TableCell>
                    <TableCell align="center">วันครบกำหนด</TableCell>
                    <TableCell align="center">หมายเหตุ</TableCell>
                    <TableCell align="center">ดำเนินการ</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {expenses.map((exp, i) => (
                    <TableRow key={exp.Id} hover
                      sx={{ bgcolor: exp.IsPaid ? '#E8F5E9' : 'inherit' }}>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={!!exp.IsPaid}
                          onChange={() => handleTogglePaid(exp)}
                          color="success"
                          size="small"
                        />
                      </TableCell>
                      <TableCell sx={{ color: exp.IsPaid ? 'text.disabled' : 'inherit' }}>{i + 1}</TableCell>
                      <TableCell>{exp.Name}</TableCell>
                      <TableCell align="center">
                        <Chip
                          label={categoryConfig[exp.Category]?.label ?? exp.Category}
                          color={categoryConfig[exp.Category]?.color}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>
                        ฿{formatCurrency(exp.Amount)}
                      </TableCell>
                      <TableCell align="center">
                        {exp.DueDate
                          ? new Date(exp.DueDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })
                          : '-'}
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 120 }}>
                          {exp.Note || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="แก้ไข">
                          <IconButton size="small" color="primary"
                            onClick={() => { setEditTarget(exp); setDialogOpen(true); }}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="ลบ">
                          <IconButton size="small" color="error"
                            onClick={() => setDeleteId(exp.Id)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                  {/* Total row */}
                  <TableRow sx={{ '& td': { fontWeight: 700, bgcolor: '#FAFAFA' } }}>
                    <TableCell colSpan={3} align="right">รวมทั้งหมด</TableCell>
                    <TableCell align="right" sx={{ color: 'error.main', fontSize: '1rem' }}>
                      ฿{formatCurrency(total)}
                    </TableCell>
                    <TableCell colSpan={3} />
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      <ExpenseDialog
        open={dialogOpen}
        expense={editTarget}
        defaultYear={year}
        defaultMonth={month}
        onClose={() => { setDialogOpen(false); setEditTarget(null); }}
        onSaved={handleSaved}
      />

      <ConfirmDialog
        open={!!deleteId}
        message="คุณต้องการลบรายจ่ายนี้ใช่หรือไม่? การดำเนินการนี้ไม่สามารถยกเลิกได้"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />

      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snack.severity} sx={{ width: '100%' }} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
