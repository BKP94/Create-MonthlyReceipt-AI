// ========================================================
// Expenses.jsx — หน้ารายจ่ายรายเดือน
// ฟีเจอร์:
//   - ดูรายจ่ายตามปี/เดือน (MonthSelector)
//   - เพิ่ม/แก้ไข/ลบรายจ่าย (Dialog + ConfirmDialog)
//   - Checkbox ติ๊กเมื่อชำระแล้ว (PATCH /api/expenses/:id/paid)
//   - แถวสีเขียวเมื่อชำระแล้ว
//   - Summary Chip แสดงยอดรวมแต่ละหมวด
// ========================================================

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Alert, Box, Button, Card, CardContent, Checkbox, Chip, CircularProgress,
  Dialog, DialogActions, DialogContent, DialogTitle,
  FormControl, FormControlLabel, Grid, IconButton, InputLabel, MenuItem,
  Paper, Select, Snackbar, Switch, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TextField, Tooltip, Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { expenseApi, installmentApi } from '../api/financeApi';
import MonthSelector from '../components/MonthSelector';
import {
  formatCurrency, thaiFullMonths, categoryConfig, YEARS,
} from '../utils/formatters';

// รายการหมวดหมู่สำหรับ dropdown ใน dialog
const CATEGORIES = [
  { value: 'debt',    label: 'หนี้/ผ่อน' },
  { value: 'daily',  label: 'ประจำวัน' },
  { value: 'savings',label: 'เงินเก็บ' },
  { value: 'other',  label: 'อื่นๆ' },
];

// ค่าเริ่มต้นของฟอร์มเมื่อเปิด dialog เพิ่มใหม่
const emptyForm = {
  Name: '', Amount: '', Category: 'debt',
  Year: new Date().getFullYear(), Month: new Date().getMonth() + 1,
  DueDate: '', Note: '',
};

// =====================================================
// ExpenseDialog — Dialog สำหรับเพิ่ม/แก้ไขรายจ่าย
// Props:
//   open: boolean — เปิด/ปิด dialog
//   expense: object|null — null=เพิ่มใหม่, object=แก้ไข
//   defaultYear/defaultMonth: ค่าเริ่มต้นเมื่อเพิ่มใหม่
//   onClose: ฟังก์ชันปิด dialog
//   onSaved: ฟังก์ชันเมื่อบันทึกสำเร็จ (รับ message, severity)
// =====================================================
function ExpenseDialog({ open, expense, defaultYear, defaultMonth, onClose, onSaved }) {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [multiMonth, setMultiMonth] = useState(false);
  const [monthCount, setMonthCount] = useState(3);

  // เมื่อ dialog เปิด — เติมข้อมูลเดิม (แก้ไข) หรือ reset (เพิ่มใหม่)
  useEffect(() => {
    if (open) {
      setForm(expense
        ? { ...expense, Amount: expense.Amount?.toString() ?? '' }
        : { ...emptyForm, Year: defaultYear, Month: defaultMonth }
      );
      setErrors({});
      setMultiMonth(false);
      setMonthCount(3);
    }
  }, [open, expense, defaultYear, defaultMonth]);

  // คำนวณช่วงเดือนที่จะเพิ่ม สำหรับแสดง preview
  const previewRange = useMemo(() => {
    const count = Math.max(2, Math.min(parseInt(monthCount) || 2, 24));
    const startM = Number(form.Month);
    const startY = Number(form.Year);
    const endM = ((startM - 1 + count - 1) % 12) + 1;
    const endY = startY + Math.floor((startM - 1 + count - 1) / 12);
    return `${thaiFullMonths[startM]} ${startY + 543} – ${thaiFullMonths[endM]} ${endY + 543}`;
  }, [form.Month, form.Year, monthCount]);

  // validate — ตรวจสอบข้อมูลก่อนบันทึก คืน object ของ errors
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
      if (expense?.Id) {
        // แก้ไข — อัปเดตรายการเดียว
        const payload = { ...form, Amount: parseFloat(form.Amount), Year: Number(form.Year), Month: Number(form.Month) };
        await expenseApi.update(expense.Id, payload);
        onSaved('บันทึกรายการเรียบร้อยแล้ว');
      } else {
        // เพิ่มใหม่ — ถ้า multiMonth ให้สร้างทีละเดือนวนไปตาม count
        const count = multiMonth ? Math.max(2, Math.min(parseInt(monthCount) || 2, 24)) : 1;
        const baseYear = Number(form.Year);
        const baseMonth = Number(form.Month);
        const amount = parseFloat(form.Amount);

        for (let i = 0; i < count; i++) {
          const m = ((baseMonth - 1 + i) % 12) + 1;
          const y = baseYear + Math.floor((baseMonth - 1 + i) / 12);
          // วันสิ้นเดือน: new Date(y, m, 0) = วันสุดท้ายของเดือน m
          const lastDay = new Date(y, m, 0).getDate();
          const due = multiMonth
            ? `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
            : form.DueDate;
          await expenseApi.create({ ...form, Amount: amount, Year: y, Month: m, DueDate: due });
        }

        onSaved(count > 1
          ? `เพิ่มรายจ่าย ${count} เดือนเรียบร้อยแล้ว`
          : 'บันทึกรายการเรียบร้อยแล้ว'
        );
      }
    } catch {
      onSaved('เกิดข้อผิดพลาด กรุณาลองใหม่', 'error');
    } finally {
      setSaving(false);
    }
  };

  // set — helper สร้าง onChange handler สำหรับแต่ละ field
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{expense ? 'แก้ไขรายจ่าย' : 'เพิ่มรายจ่าย'}</DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <Grid container spacing={2} sx={{ mt: 0 }}>
          {/* ชื่อรายการ */}
          <Grid item xs={12}>
            <TextField label="ชื่อรายการ *" fullWidth value={form.Name}
              onChange={set('Name')} error={!!errors.Name} helperText={errors.Name} />
          </Grid>
          {/* จำนวนเงิน */}
          <Grid item xs={12} sm={6}>
            <TextField label="จำนวนเงิน (บาท) *" fullWidth type="number"
              value={form.Amount} onChange={set('Amount')}
              error={!!errors.Amount} helperText={errors.Amount}
              inputProps={{ min: 0, step: '0.01' }} />
          </Grid>
          {/* หมวดหมู่ */}
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
          {/* ปี */}
          <Grid item xs={6} sm={6}>
            <FormControl fullWidth>
              <InputLabel>ปี</InputLabel>
              <Select value={form.Year} label="ปี" onChange={set('Year')}>
                {YEARS.map((y) => <MenuItem key={y} value={y}>{y + 543}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          {/* เดือน (เดือนเริ่มต้น) */}
          <Grid item xs={6} sm={6}>
            <FormControl fullWidth>
              <InputLabel>{multiMonth ? 'เดือนเริ่มต้น' : 'เดือน'}</InputLabel>
              <Select value={form.Month} label={multiMonth ? 'เดือนเริ่มต้น' : 'เดือน'} onChange={set('Month')}>
                {thaiFullMonths.slice(1).map((n, i) => (
                  <MenuItem key={i + 1} value={i + 1}>{n}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          {/* วันครบกำหนด — ซ่อนเมื่อ multiMonth เพราะจะ auto-set เป็นสิ้นเดือน */}
          {!multiMonth && (
            <Grid item xs={12} sm={6}>
              <TextField label="วันครบกำหนด" fullWidth type="date"
                value={form.DueDate ?? ''} onChange={set('DueDate')}
                InputLabelProps={{ shrink: true }} />
            </Grid>
          )}
          {/* หมายเหตุ */}
          <Grid item xs={12} sm={multiMonth ? 12 : 6}>
            <TextField label="หมายเหตุ" fullWidth value={form.Note ?? ''}
              onChange={set('Note')} />
          </Grid>

          {/* ─── เพิ่มหลายเดือน (เฉพาะตอนเพิ่มใหม่) ─── */}
          {!expense && (
            <>
              <Grid item xs={12}>
                <Box sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 1.5 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={multiMonth}
                        onChange={(e) => setMultiMonth(e.target.checked)}
                        color="primary"
                      />
                    }
                    label={
                      <Typography variant="body2" fontWeight={600}>
                        เพิ่มหลายเดือนพร้อมกัน
                      </Typography>
                    }
                  />
                </Box>
              </Grid>

              {multiMonth && (
                <>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="จำนวนเดือน"
                      fullWidth
                      type="number"
                      value={monthCount}
                      onChange={(e) => setMonthCount(e.target.value)}
                      inputProps={{ min: 2, max: 24, step: 1 }}
                      helperText="2 – 24 เดือน"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{
                      bgcolor: 'info.50', border: '1px solid', borderColor: 'info.200',
                      borderRadius: 1, px: 1.5, py: 1, height: '100%',
                      display: 'flex', alignItems: 'center',
                    }}>
                      <Typography variant="body2" color="text.secondary">
                        วันครบกำหนด → <strong>วันสิ้นเดือน</strong> ของแต่ละเดือนอัตโนมัติ
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12}>
                    <Box sx={{
                      bgcolor: 'primary.50', border: '1px solid', borderColor: 'primary.200',
                      borderRadius: 1, px: 2, py: 1,
                    }}>
                      <Typography variant="body2" color="primary.main">
                        จะเพิ่ม <strong>{Math.max(2, Math.min(parseInt(monthCount) || 2, 24))} รายการ</strong>: {previewRange}
                      </Typography>
                    </Box>
                  </Grid>
                </>
              )}
            </>
          )}
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        <Button variant="outlined" onClick={onClose} fullWidth disabled={saving}>ยกเลิก</Button>
        <Button variant="contained" onClick={handleSave} fullWidth disabled={saving}>
          {saving ? <CircularProgress size={22} /> : (multiMonth && !expense ? `เพิ่ม ${Math.max(2, Math.min(parseInt(monthCount) || 2, 24))} เดือน` : 'บันทึก')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// =====================================================
// Expenses — Component หลักของหน้ารายจ่ายรายเดือน
// =====================================================
export default function Expenses() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [expenses, setExpenses] = useState([]);  // รายการรายจ่ายทั้งหมดของเดือนที่เลือก
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);        // null=เพิ่มใหม่, object=แก้ไข
  const [deleteTarget, setDeleteTarget] = useState(null);    // expense ที่กำลังจะลบ
  const [relatedExpenses, setRelatedExpenses] = useState([]); // รายการที่ชื่อ+หมวดเดียวกันในเดือนอื่น
  const [loadingRelated, setLoadingRelated] = useState(false);
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' });

  // fetchExpenses — โหลดรายจ่ายของ year/month ที่เลือก
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

  // handleSaved — เรียกเมื่อ dialog บันทึกสำเร็จ
  const handleSaved = (msg, severity = 'success') => {
    setDialogOpen(false);
    setEditTarget(null);
    showSnack(msg, severity);
    if (severity !== 'error') fetchExpenses(); // โหลดข้อมูลใหม่
  };

  // handleTogglePaid — สลับสถานะชำระของรายการ
  // ใช้ Optimistic Update: อัปเดต state ทันที → ส่ง API → ถ้า error ให้ revert กลับ
  // วิธีนี้ทำให้ UI ตอบสนองทันทีโดยไม่ต้องรอ API
  //
  // พิเศษ: ถ้า category = "debt" → หารายการผ่อนที่ชื่อตรงกัน (case-insensitive)
  //   - ติ๊ก (true)  → PaidInstallments + 1
  //   - เอาออก (false) → PaidInstallments - 1 (ไม่ต่ำกว่า 0)
  const handleTogglePaid = async (exp) => {
    const newVal = !exp.IsPaid;

    // อัปเดต state ทันที (Optimistic Update)
    setExpenses((prev) => prev.map((e) => e.Id === exp.Id ? { ...e, IsPaid: newVal } : e));

    try {
      // 1) อัปเดตสถานะชำระของรายจ่าย
      await expenseApi.togglePaid(exp.Id, newVal); // PATCH /api/expenses/:id/paid

      // 2) ถ้าเป็นหมวด "debt" → ค้นหารายการผ่อนที่ชื่อตรงกันแล้วอัปเดต PaidInstallments
      if (exp.Category === 'debt') {
        // ดึงรายการผ่อนทั้งหมด (activeOnly=false เพื่อรวมที่ครบแล้วด้วย)
        const instRes = await installmentApi.getAll(false);

        // normalize — ตัดคำว่า "บัตร" นำหน้า + trim + lowercase
        // เพราะรายจ่ายที่จ่ายผ่านบัตรเครดิตจะมี "บัตร " นำหน้า เช่น "บัตร ผ่อนยาง"
        // แต่รายการผ่อนชื่อ "ผ่อนยาง" → ต้องตัด prefix ออกก่อนเทียบ
        const normalize = (s) =>
          (s ?? '').trim().toLowerCase().replace(/^บัตร\s*/, '').trim();

        const expName = normalize(exp.Name);

        // ค้นหาด้วยชื่อที่ normalize แล้ว — ตรงกันเป๊ะ หรือชื่อผ่อนเป็นส่วนหนึ่งของชื่อรายจ่าย
        // (รองรับทั้ง "ผ่อนยาง"="ผ่อนยาง" และ "บัตร ผ่อนยาง"→"ผ่อนยาง")
        const match = instRes.data.find((i) => {
          if (i.IsCompleted) return false;
          const instName = normalize(i.Name);
          return expName === instName || expName.includes(instName) || instName.includes(expName);
        });

        if (match) {
          // คำนวณงวดใหม่ — ป้องกันติดลบและเกินจำนวนงวดทั้งหมด
          const newPaid = newVal
            ? Math.min(match.PaidInstallments + 1, match.TotalInstallments) // ติ๊ก → +1
            : Math.max(match.PaidInstallments - 1, 0);                      // เอาออก → -1

          // อัปเดตเฉพาะเมื่อค่าเปลี่ยนจริง
          if (newPaid !== match.PaidInstallments) {
            // PUT /api/installments/:id — ส่งข้อมูลครบทุก field พร้อม PaidInstallments ใหม่
            await installmentApi.update(match.Id, {
              ...match,
              PaidInstallments: newPaid,
            });
          }
        }
      }
    } catch {
      // ถ้า API ล้มเหลว revert state กลับค่าเดิม
      setExpenses((prev) => prev.map((e) => e.Id === exp.Id ? { ...e, IsPaid: exp.IsPaid } : e));
    }
  };

  const closeDeleteDialog = () => { setDeleteTarget(null); setRelatedExpenses([]); };

  // เมื่อกดปุ่มลบ — เปิด dialog แล้วโหลดรายการที่ชื่อ+หมวดเดียวกันในทุกเดือน
  const handleDeleteClick = async (exp) => {
    setDeleteTarget(exp);
    setLoadingRelated(true);
    try {
      const res = await expenseApi.getAll(); // ดึงทั้งหมดไม่กรองเดือน
      const related = res.data.filter((e) =>
        e.Name.trim().toLowerCase() === exp.Name.trim().toLowerCase() &&
        e.Category === exp.Category
      ).sort((a, b) => a.Year !== b.Year ? a.Year - b.Year : a.Month - b.Month);
      setRelatedExpenses(related);
    } catch {
      setRelatedExpenses([exp]); // fallback
    } finally {
      setLoadingRelated(false);
    }
  };

  // ลบเฉพาะรายการเดียวที่เลือก
  const handleDeleteSingle = async () => {
    try {
      await expenseApi.remove(deleteTarget.Id);
      showSnack('ลบรายการเรียบร้อยแล้ว');
      fetchExpenses();
    } catch {
      showSnack('ลบไม่สำเร็จ', 'error');
    } finally {
      closeDeleteDialog();
    }
  };

  // ลบทุกเดือนที่ชื่อ+หมวดเดียวกัน
  const handleDeleteAll = async () => {
    try {
      await Promise.all(relatedExpenses.map((e) => expenseApi.remove(e.Id)));
      showSnack(`ลบ ${relatedExpenses.length} รายการเรียบร้อยแล้ว`);
      fetchExpenses();
    } catch {
      showSnack('ลบบางรายการไม่สำเร็จ', 'error');
    } finally {
      closeDeleteDialog();
    }
  };

  // คำนวณยอดรวมทั้งหมด
  const total = expenses.reduce((s, e) => s + (e.Amount ?? 0), 0);

  // byCategory — ยอดรวมแยกตามหมวด (สำหรับ Chip สรุป)
  // filter เอาเฉพาะหมวดที่มีข้อมูล (total > 0)
  const byCategory = CATEGORIES.map((c) => ({
    ...c,
    total: expenses.filter((e) => e.Category === c.value).reduce((s, e) => s + e.Amount, 0),
  })).filter((c) => c.total > 0);

  return (
    <Box>
      {/* Header — ชื่อหน้า + MonthSelector + ปุ่มเพิ่ม */}
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

      {/* Summary Chips — แสดงยอดรวมแต่ละหมวด */}
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
            // Empty state — แสดงเมื่อยังไม่มีรายจ่าย
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
                    {/* padding="checkbox" → ลดขนาด cell ให้พอดีกับ Checkbox */}
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
                    // bgcolor เปลี่ยนเป็นเขียวอ่อนเมื่อ IsPaid = true
                    <TableRow key={exp.Id} hover
                      sx={{ bgcolor: exp.IsPaid ? '#E8F5E9' : 'inherit' }}>

                      {/* Checkbox ชำระแล้ว */}
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={!!exp.IsPaid}
                          onChange={() => handleTogglePaid(exp)}
                          color="success"
                          size="small"
                        />
                      </TableCell>

                      {/* ลำดับที่ — สีจางลงเมื่อชำระแล้ว */}
                      <TableCell sx={{ color: exp.IsPaid ? 'text.disabled' : 'inherit' }}>{i + 1}</TableCell>
                      <TableCell>{exp.Name}</TableCell>

                      {/* หมวดหมู่ Chip */}
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

                      {/* วันครบกำหนด — แสดงในรูปแบบ yyyy-dd-mm */}
                      <TableCell align="center">
                        {exp.DueDate
                          ? new Date(exp.DueDate).toLocaleDateString('en-CA').replace(/(\d{4})-(\d{2})-(\d{2})/, '$1-$3-$2')
                          : '-'}
                      </TableCell>

                      <TableCell align="center">
                        <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 120 }}>
                          {exp.Note || '-'}
                        </Typography>
                      </TableCell>

                      {/* ปุ่ม แก้ไข / ลบ */}
                      <TableCell align="center">
                        <Tooltip title="แก้ไข">
                          <IconButton size="small" color="primary"
                            onClick={() => { setEditTarget(exp); setDialogOpen(true); }}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="ลบ">
                          <IconButton size="small" color="error"
                            onClick={() => handleDeleteClick(exp)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}

                  {/* แถวรวมยอด */}
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

      {/* Dialog เพิ่ม/แก้ไข */}
      <ExpenseDialog
        open={dialogOpen}
        expense={editTarget}
        defaultYear={year}
        defaultMonth={month}
        onClose={() => { setDialogOpen(false); setEditTarget(null); }}
        onSaved={handleSaved}
      />

      {/* Dialog ยืนยันการลบ */}
      <Dialog open={!!deleteTarget} onClose={closeDeleteDialog} maxWidth="xs" fullWidth>
        <DialogTitle>ลบรายจ่าย</DialogTitle>
        <DialogContent>
          {loadingRelated ? (
            <Box display="flex" justifyContent="center" py={3}><CircularProgress size={28} /></Box>
          ) : relatedExpenses.length > 1 ? (
            <>
              <Typography gutterBottom>
                พบรายการ <strong>"{deleteTarget?.Name}"</strong> จำนวน{' '}
                <strong>{relatedExpenses.length} เดือน</strong>:
              </Typography>
              <Box sx={{ pl: 1, mb: 2 }}>
                {relatedExpenses.map((e) => (
                  <Typography key={e.Id} variant="body2"
                    color={e.Id === deleteTarget?.Id ? 'primary.main' : 'text.secondary'}>
                    • {thaiFullMonths[e.Month]} {e.Year + 543}
                    {e.Id === deleteTarget?.Id ? ' ← เดือนนี้' : ''}
                  </Typography>
                ))}
              </Box>
              <Typography variant="body2" color="text.secondary">
                ต้องการลบเฉพาะเดือนนี้ หรือลบทั้งหมด?
              </Typography>
            </>
          ) : (
            <Typography>
              คุณต้องการลบรายจ่ายนี้ใช่หรือไม่?<br />
              การดำเนินการนี้ไม่สามารถยกเลิกได้
            </Typography>
          )}
        </DialogContent>
        {!loadingRelated && (
          <DialogActions sx={{ px: 2, pb: 2, gap: 1 }}>
            <Button variant="outlined" onClick={closeDeleteDialog}>ยกเลิก</Button>
            {relatedExpenses.length > 1 && (
              <Button variant="outlined" color="error" onClick={handleDeleteSingle}>
                เฉพาะเดือนนี้
              </Button>
            )}
            <Button variant="contained" color="error"
              onClick={relatedExpenses.length > 1 ? handleDeleteAll : handleDeleteSingle}>
              {relatedExpenses.length > 1 ? `ลบทั้งหมด ${relatedExpenses.length} เดือน` : 'ลบ'}
            </Button>
          </DialogActions>
        )}
      </Dialog>

      {/* Snackbar แจ้งเตือนผลการทำงาน */}
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
