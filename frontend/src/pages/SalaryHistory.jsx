// ========================================================
// SalaryHistory.jsx — หน้าประวัติเงินเดือนรายปี
// ฟีเจอร์:
//   - บันทึกเงินเดือนแต่ละปี พร้อมหมายเหตุ
//   - คำนวณ % ขึ้นเงินเดือนเทียบปีก่อนหน้าอัตโนมัติ
//   - BarChart แสดงพัฒนาการเงินเดือน
//   - เมื่อเพิ่ม/แก้ไขปีล่าสุด → Budget settings อัปเดตอัตโนมัติ
// ========================================================

import { useState, useEffect, useCallback } from 'react';
import {
  Alert, Box, Button, Card, CardContent, Chip, CircularProgress,
  Dialog, DialogActions, DialogContent, DialogTitle,
  Grid, IconButton, Snackbar, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TextField, Tooltip, Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import SyncIcon from '@mui/icons-material/Sync';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as ChartTooltip, ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts';
import { salaryHistoryApi } from '../api/financeApi';
import ConfirmDialog from '../components/ConfirmDialog';
import { formatCurrency, formatCurrencyShort } from '../utils/formatters';

// =====================================================
// คำนวณ % เพิ่มขึ้นเทียบกับปีก่อนหน้า
// เพิ่ม field changeAmount และ changePercent ให้แต่ละ record
// =====================================================
function enrichWithChange(list) {
  return list.map((item, i) => {
    const prev = list[i - 1];
    if (!prev) return { ...item, changeAmount: null, changePercent: null };
    const changeAmount = item.Salary - prev.Salary;
    const changePercent = prev.Salary > 0
      ? Math.round((changeAmount / prev.Salary) * 10000) / 100  // ทศนิยม 2 ตำแหน่ง
      : null;
    return { ...item, changeAmount, changePercent };
  });
}

// =====================================================
// SummaryCard — การ์ดสรุปตัวเลขด้านบน
// =====================================================
const SummaryCard = ({ title, value, subtitle, color = 'primary.main', icon }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent sx={{ p: 2.5 }}>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
        <Box flex={1}>
          <Typography variant="body2" color="text.secondary" mb={0.5}>{title}</Typography>
          <Typography variant="h5" fontWeight={700} color={color}>{value}</Typography>
          {subtitle && (
            <Typography variant="caption" color="text.secondary">{subtitle}</Typography>
          )}
        </Box>
        {icon && (
          <Box sx={{ bgcolor: `${color}22`, borderRadius: 2, p: 1, ml: 1 }}>
            {icon}
          </Box>
        )}
      </Box>
    </CardContent>
  </Card>
);

// =====================================================
// CustomTooltip — Tooltip กำหนดเองสำหรับ BarChart
// =====================================================
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <Card sx={{ p: 1.5, minWidth: 160 }}>
      <Typography variant="body2" fontWeight={600} mb={0.5}>{label}</Typography>
      <Typography variant="body2" color="primary.main">
        ฿{formatCurrency(payload[0].value)}
      </Typography>
      {payload[0].payload.changePercent != null && (
        <Typography
          variant="caption"
          color={payload[0].payload.changePercent > 0 ? 'success.main' : 'error.main'}
        >
          {payload[0].payload.changePercent > 0 ? '+' : ''}{payload[0].payload.changePercent}%
        </Typography>
      )}
    </Card>
  );
};

// =====================================================
// SalaryDialog — Dialog เพิ่ม/แก้ไขข้อมูลเงินเดือน
// =====================================================
function SalaryDialog({ open, record, onClose, onSaved }) {
  const [form, setForm] = useState({ Year: '', Salary: '', Note: '' });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (open) {
      setForm(record
        ? { Year: record.Year.toString(), Salary: record.Salary.toString(), Note: record.Note ?? '' }
        : { Year: new Date().getFullYear().toString(), Salary: '', Note: '' }
      );
      setErrors({});
    }
  }, [open, record]);

  const validate = () => {
    const e = {};
    if (!form.Year || isNaN(form.Year) || Number(form.Year) < 2000)
      e.Year = 'กรุณาระบุปี ค.ศ. ที่ถูกต้อง (เช่น 2026)';
    if (!form.Salary || isNaN(form.Salary) || Number(form.Salary) <= 0)
      e.Salary = 'กรุณาระบุเงินเดือนที่ถูกต้อง';
    return e;
  };

  const handleSave = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    try {
      const payload = {
        Year: Number(form.Year),
        Salary: parseFloat(form.Salary),
        Note: form.Note.trim() || null,
      };
      let res;
      if (record?.Id) res = await salaryHistoryApi.update(record.Id, payload);
      else res = await salaryHistoryApi.create(payload);

      onSaved(res.data);
    } catch (err) {
      const msg = err.response?.data?.message ?? 'เกิดข้อผิดพลาด กรุณาลองใหม่';
      setErrors({ _server: msg });
    } finally {
      setSaving(false);
    }
  };

  const set = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setErrors((prev) => ({ ...prev, [k]: undefined, _server: undefined }));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{record ? 'แก้ไขข้อมูลเงินเดือน' : 'เพิ่มข้อมูลเงินเดือน'}</DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <Box display="flex" flexDirection="column" gap={2} mt={0.5}>
          {/* ปี ค.ศ. */}
          <TextField
            label="ปี ค.ศ. *"
            fullWidth
            type="number"
            value={form.Year}
            onChange={set('Year')}
            error={!!errors.Year}
            helperText={errors.Year || (form.Year ? `พ.ศ. ${Number(form.Year) + 543}` : '')}
            inputProps={{ min: 2000, max: 2100 }}
          />
          {/* เงินเดือน */}
          <TextField
            label="เงินเดือน (บาท) *"
            fullWidth
            type="number"
            value={form.Salary}
            onChange={set('Salary')}
            error={!!errors.Salary}
            helperText={errors.Salary || (form.Salary ? `฿${formatCurrency(parseFloat(form.Salary) || 0)}` : '')}
            inputProps={{ min: 1, step: '0.01' }}
          />
          {/* หมายเหตุ */}
          <TextField
            label="หมายเหตุ"
            fullWidth
            value={form.Note}
            onChange={set('Note')}
            placeholder="เช่น ขึ้นประจำปี, ปรับโครงสร้าง"
          />
          {/* Server error */}
          {errors._server && <Alert severity="error">{errors._server}</Alert>}
        </Box>
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

// =====================================================
// SalaryHistory — Component หลักของหน้าประวัติเงินเดือน
// =====================================================
export default function SalaryHistory() {
  const [list, setList] = useState([]);        // เรียงจากเก่าไปใหม่
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' });

  const showSnack = (msg, severity = 'success') => setSnack({ open: true, msg, severity });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await salaryHistoryApi.getAll();
      setList(res.data);
    } catch {
      showSnack('โหลดข้อมูลไม่สำเร็จ', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // handleSaved — รับ response จาก dialog (มี record + budgetUpdated + newNetSalary)
  const handleSaved = (responseData) => {
    setDialogOpen(false);
    setEditTarget(null);
    fetchData(); // โหลดข้อมูลใหม่

    if (responseData.budgetUpdated) {
      showSnack(
        `บันทึกสำเร็จ ✓ อัปเดตเงินเดือนใน Budget แล้ว (สุทธิ ฿${formatCurrency(responseData.newNetSalary)})`,
        'success'
      );
    } else {
      showSnack('บันทึกข้อมูลเงินเดือนเรียบร้อยแล้ว');
    }
  };

  const handleDelete = async () => {
    try {
      await salaryHistoryApi.remove(deleteId);
      showSnack('ลบข้อมูลเรียบร้อยแล้ว');
      fetchData();
    } catch {
      showSnack('ลบไม่สำเร็จ', 'error');
    } finally {
      setDeleteId(null);
    }
  };

  // =====================================================
  // คำนวณสถิติจากข้อมูลทั้งหมด
  // =====================================================
  const enriched = enrichWithChange(list);  // เพิ่ม changeAmount, changePercent
  const first = list[0];
  const latest = list[list.length - 1];

  // % เพิ่มขึ้นรวมตั้งแต่ปีแรก
  const totalGrowthPct = first && latest && first.Salary > 0 && list.length > 1
    ? ((latest.Salary - first.Salary) / first.Salary * 100).toFixed(2)
    : null;

  // % เพิ่มขึ้นเฉลี่ยต่อปี (เฉลี่ยจากปีที่มีการเปลี่ยนแปลง)
  const changedYears = enriched.filter((r) => r.changePercent != null);
  const avgGrowthPct = changedYears.length > 0
    ? (changedYears.reduce((s, r) => s + r.changePercent, 0) / changedYears.length).toFixed(2)
    : null;

  // ข้อมูลสำหรับ BarChart
  const chartData = enriched.map((r) => ({
    name: `${r.Year + 543}`,  // แสดงปี พ.ศ. ใน chart
    เงินเดือน: r.Salary,
    changePercent: r.changePercent,
  }));

  // สีแท่ง BarChart — ไล่เข้มขึ้นตามลำดับ
  const BAR_COLORS = ['#90CAF9', '#64B5F6', '#42A5F5', '#2196F3', '#1976D2', '#1565C0', '#0D47A1'];

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2} mb={3}>
        <Box>
          <Typography variant="h5">ประวัติเงินเดือน</Typography>
          <Typography variant="body2" color="text.secondary">
            บันทึกการปรับเงินเดือนรายปี — ปีล่าสุดจะ sync ไปที่ตั้งค่างบประมาณอัตโนมัติ
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => { setEditTarget(null); setDialogOpen(true); }}
        >
          เพิ่มข้อมูลเงินเดือน
        </Button>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>
      ) : (
        <>
          {/* Summary Cards — แสดงเมื่อมีข้อมูล ≥ 1 รายการ */}
          {list.length > 0 && (
            <Grid container spacing={2} mb={3}>
              <Grid item xs={12} sm={6} md={3}>
                <SummaryCard
                  title="เงินเดือนล่าสุด"
                  value={`฿${formatCurrency(latest?.Salary)}`}
                  subtitle={`ปี พ.ศ. ${latest ? latest.Year + 543 : '-'}`}
                  color="primary.main"
                  icon={<TrendingUpIcon sx={{ color: 'primary.main' }} />}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <SummaryCard
                  title="เพิ่มขึ้นรวม"
                  value={totalGrowthPct != null ? `+${totalGrowthPct}%` : '-'}
                  subtitle={`จาก ฿${formatCurrency(first?.Salary)} ถึงปัจจุบัน`}
                  color="success.main"
                  icon={<TrendingUpIcon sx={{ color: 'success.main' }} />}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <SummaryCard
                  title="เพิ่มขึ้นเฉลี่ย/ปี"
                  value={avgGrowthPct != null ? `+${avgGrowthPct}%` : '-'}
                  subtitle="เฉลี่ยจากปีที่มีการเปลี่ยนแปลง"
                  color="info.main"
                  icon={<TrendingUpIcon sx={{ color: 'info.main' }} />}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <SummaryCard
                  title="ข้อมูลทั้งหมด"
                  value={`${list.length} ปี`}
                  subtitle={list.length > 1 ? `ปี ${first.Year + 543} – ${latest.Year + 543}` : ''}
                  color="warning.main"
                />
              </Grid>
            </Grid>
          )}

          {/* BarChart — แสดงเมื่อมีข้อมูล ≥ 2 ปี */}
          {list.length >= 2 && (
            <Card sx={{ mb: 3 }}>
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="subtitle1" fontWeight={600} mb={2}>
                  พัฒนาการเงินเดือน
                </Typography>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 13, fontFamily: 'Sarabun' }} />
                    <YAxis
                      tickFormatter={formatCurrencyShort}
                      tick={{ fontSize: 12 }}
                      width={65}
                    />
                    <ChartTooltip content={<CustomTooltip />} />
                    <Bar dataKey="เงินเดือน" radius={[6, 6, 0, 0]} maxBarSize={80}>
                      {chartData.map((entry, index) => (
                        <Cell
                          key={index}
                          fill={BAR_COLORS[Math.min(index, BAR_COLORS.length - 1)]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* ตารางรายการ */}
          <Card>
            <CardContent sx={{ p: 0 }}>
              {list.length === 0 ? (
                <Box py={8} textAlign="center">
                  <Typography color="text.secondary" mb={2}>
                    ยังไม่มีข้อมูลเงินเดือน
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={() => { setEditTarget(null); setDialogOpen(true); }}
                  >
                    เพิ่มข้อมูลปีแรก
                  </Button>
                </Box>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: '#F5F5F5' } }}>
                        <TableCell>ปี (พ.ศ.)</TableCell>
                        <TableCell align="right">เงินเดือน</TableCell>
                        <TableCell align="right">เพิ่มขึ้น (บาท)</TableCell>
                        <TableCell align="center">% เพิ่มขึ้น</TableCell>
                        <TableCell>หมายเหตุ</TableCell>
                        <TableCell align="center">ดำเนินการ</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {/* แสดงจากใหม่ไปเก่า (reverse) เพื่อให้ปีล่าสุดอยู่บนสุด */}
                      {[...enriched].reverse().map((row, idx) => {
                        const isLatest = row.Id === latest?.Id;
                        return (
                          <TableRow
                            key={row.Id}
                            hover
                            sx={{ bgcolor: isLatest ? 'rgba(33,150,243,0.05)' : 'inherit' }}
                          >
                            {/* ปี พ.ศ. + badge "ปัจจุบัน" */}
                            <TableCell>
                              <Box display="flex" alignItems="center" gap={1}>
                                <Typography fontWeight={isLatest ? 700 : 400}>
                                  {row.Year + 543}
                                </Typography>
                                {isLatest && (
                                  <Chip label="ปัจจุบัน" color="primary" size="small" />
                                )}
                              </Box>
                            </TableCell>

                            {/* เงินเดือน */}
                            <TableCell align="right" sx={{ fontWeight: 600 }}>
                              ฿{formatCurrency(row.Salary)}
                            </TableCell>

                            {/* เพิ่มขึ้น (บาท) */}
                            <TableCell align="right">
                              {row.changeAmount != null ? (
                                <Typography
                                  variant="body2"
                                  fontWeight={600}
                                  color={row.changeAmount > 0 ? 'success.main' : row.changeAmount < 0 ? 'error.main' : 'text.secondary'}
                                >
                                  {row.changeAmount > 0 ? '+' : ''}฿{formatCurrency(row.changeAmount)}
                                </Typography>
                              ) : (
                                <Typography variant="body2" color="text.disabled">—</Typography>
                              )}
                            </TableCell>

                            {/* % เพิ่มขึ้น พร้อม Chip + icon */}
                            <TableCell align="center">
                              {row.changePercent != null ? (
                                <Chip
                                  size="small"
                                  icon={
                                    row.changePercent > 0
                                      ? <TrendingUpIcon fontSize="small" />
                                      : row.changePercent < 0
                                        ? <TrendingDownIcon fontSize="small" />
                                        : <TrendingFlatIcon fontSize="small" />
                                  }
                                  label={`${row.changePercent > 0 ? '+' : ''}${row.changePercent}%`}
                                  color={
                                    row.changePercent > 5 ? 'success'
                                    : row.changePercent > 0 ? 'primary'
                                    : row.changePercent < 0 ? 'error'
                                    : 'default'
                                  }
                                  variant={row.changePercent === 0 ? 'outlined' : 'filled'}
                                />
                              ) : (
                                <Typography variant="body2" color="text.disabled">—</Typography>
                              )}
                            </TableCell>

                            {/* หมายเหตุ */}
                            <TableCell>
                              <Typography variant="body2" color="text.secondary">
                                {row.Note || '—'}
                              </Typography>
                            </TableCell>

                            {/* ปุ่มดำเนินการ */}
                            <TableCell align="center">
                              <Tooltip title="แก้ไข">
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() => { setEditTarget(row); setDialogOpen(true); }}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="ลบ">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => setDeleteId(row.Id)}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>

          {/* หมายเหตุ auto-sync */}
          {list.length > 0 && (
            <Box display="flex" alignItems="center" gap={0.5} mt={1.5}>
              <SyncIcon fontSize="small" sx={{ color: 'text.disabled' }} />
              <Typography variant="caption" color="text.secondary">
                เมื่อเพิ่มหรือแก้ไขข้อมูลปีล่าสุด เงินเดือนจะถูกอัปเดตในหน้า "ตั้งค่างบประมาณ" อัตโนมัติ
              </Typography>
            </Box>
          )}
        </>
      )}

      {/* Dialog เพิ่ม/แก้ไข */}
      <SalaryDialog
        open={dialogOpen}
        record={editTarget}
        onClose={() => { setDialogOpen(false); setEditTarget(null); }}
        onSaved={handleSaved}
      />

      {/* Dialog ยืนยันลบ */}
      <ConfirmDialog
        open={!!deleteId}
        message="คุณต้องการลบข้อมูลเงินเดือนปีนี้ใช่หรือไม่?"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />

      {/* Snackbar แจ้งผล */}
      <Snackbar
        open={snack.open}
        autoHideDuration={5000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snack.severity}
          sx={{ width: '100%' }}
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
        >
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
