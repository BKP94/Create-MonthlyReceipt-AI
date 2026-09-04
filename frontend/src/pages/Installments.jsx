// ========================================================
// Installments.jsx — หน้ารายการผ่อนชำระ
// ฟีเจอร์:
//   - ดูรายการผ่อนทั้งหมด หรือกรองเฉพาะที่กำลังผ่อนอยู่
//   - เพิ่ม/แก้ไข/ลบรายการผ่อน (Dialog + ConfirmDialog)
//   - Progress Bar แสดงความคืบหน้าการผ่อน
//   - Chip "ครบกำหนดเดือนนี้" — คำนวณจาก StartDate + PaidInstallments
//   - Summary cards (ยอดรวมต่อเดือน, ยอดคงเหลือ, จำนวนรายการ)
// ========================================================

import { useState, useEffect, useCallback } from 'react';
import {
  Alert, Box, Button, Card, CardContent, Chip, CircularProgress,
  DialogActions, DialogContent,
  Grid, IconButton, LinearProgress, Snackbar, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, TextField,
  ToggleButton, ToggleButtonGroup, Tooltip, Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import { installmentApi } from '../api/financeApi';
import ConfirmDialog from '../components/ConfirmDialog';
import ResponsiveDialog from '../components/ResponsiveDialog';
import MobileDataCard from '../components/MobileDataCard';
import AddFab from '../components/AddFab';
import useIsMobile from '../hooks/useIsMobile';
import { formatCurrency } from '../utils/formatters';

// ค่าเริ่มต้นของฟอร์ม dialog
const emptyForm = {
  Name: '', TotalInstallments: '', PaidInstallments: '0',
  MonthlyAmount: '', StartDate: '', Note: '',
};

// =====================================================
// InstallmentDialog — Dialog เพิ่ม/แก้ไขรายการผ่อน
// Props: open, installment (null=ใหม่), onClose, onSaved
// =====================================================
function InstallmentDialog({ open, installment, onClose, onSaved }) {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  // เติมข้อมูลเดิมเมื่อเปิดแก้ไข หรือ reset เมื่อเพิ่มใหม่
  useEffect(() => {
    if (open) {
      setForm(installment
        ? {
            Name: installment.Name,
            TotalInstallments: installment.TotalInstallments?.toString(),
            PaidInstallments: installment.PaidInstallments?.toString(),
            MonthlyAmount: installment.MonthlyAmount?.toString(),
            StartDate: installment.StartDate ?? '',
            Note: installment.Note ?? '',
          }
        : emptyForm
      );
      setErrors({});
    }
  }, [open, installment]);

  const validate = () => {
    const e = {};
    if (!form.Name.trim()) e.Name = 'กรุณาระบุชื่อรายการ';
    if (!form.TotalInstallments || Number(form.TotalInstallments) <= 0)
      e.TotalInstallments = 'จำนวนงวดต้องมากกว่า 0';
    if (form.PaidInstallments === '' || Number(form.PaidInstallments) < 0)
      e.PaidInstallments = 'งวดที่ชำระต้องไม่ติดลบ';
    if (Number(form.PaidInstallments) > Number(form.TotalInstallments))
      e.PaidInstallments = 'งวดที่ชำระแล้วเกินจำนวนงวดทั้งหมด';
    if (!form.MonthlyAmount || Number(form.MonthlyAmount) <= 0)
      e.MonthlyAmount = 'จำนวนเงินต่องวดต้องมากกว่า 0';
    return e;
  };

  const handleSave = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        TotalInstallments: Number(form.TotalInstallments),
        PaidInstallments: Number(form.PaidInstallments),
        MonthlyAmount: parseFloat(form.MonthlyAmount),
      };
      if (installment?.Id) await installmentApi.update(installment.Id, payload); // PUT
      else await installmentApi.create(payload);                                  // POST
      onSaved('บันทึกรายการเรียบร้อยแล้ว');
    } catch {
      onSaved('เกิดข้อผิดพลาด กรุณาลองใหม่', 'error');
    } finally {
      setSaving(false);
    }
  };

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  // คำนวณยอดเงินรวมและคงเหลือสำหรับ Preview box ใน Dialog
  const totalAmt = Number(form.TotalInstallments) * parseFloat(form.MonthlyAmount || 0);
  const remaining = (Number(form.TotalInstallments) - Number(form.PaidInstallments || 0)) * parseFloat(form.MonthlyAmount || 0);

  return (
    <ResponsiveDialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      title={installment ? 'แก้ไขรายการผ่อน' : 'เพิ่มรายการผ่อน'}
    >
      <DialogContent sx={{ pt: 2 }}>
        <Grid container spacing={2} sx={{ mt: 0 }}>
          {/* ชื่อรายการ */}
          <Grid item xs={12}>
            <TextField label="ชื่อรายการผ่อน *" fullWidth value={form.Name}
              onChange={set('Name')} error={!!errors.Name} helperText={errors.Name} />
          </Grid>
          {/* จำนวนงวดทั้งหมด */}
          <Grid item xs={6}>
            <TextField label="จำนวนงวดทั้งหมด *" fullWidth type="number"
              value={form.TotalInstallments} onChange={set('TotalInstallments')}
              error={!!errors.TotalInstallments} helperText={errors.TotalInstallments}
              inputProps={{ min: 1 }} />
          </Grid>
          {/* งวดที่ชำระแล้ว */}
          <Grid item xs={6}>
            <TextField label="งวดที่ชำระแล้ว" fullWidth type="number"
              value={form.PaidInstallments} onChange={set('PaidInstallments')}
              error={!!errors.PaidInstallments} helperText={errors.PaidInstallments}
              inputProps={{ min: 0 }} />
          </Grid>
          {/* จำนวนเงินต่องวด */}
          <Grid item xs={12} sm={6}>
            <TextField label="จำนวนเงินต่องวด (บาท) *" fullWidth type="number"
              value={form.MonthlyAmount} onChange={set('MonthlyAmount')}
              error={!!errors.MonthlyAmount} helperText={errors.MonthlyAmount}
              inputProps={{ min: 0, step: '0.01' }} />
          </Grid>
          {/* วันที่เริ่ม (ใช้คำนวณ isThisMonth) */}
          <Grid item xs={12} sm={6}>
            <TextField label="วันที่เริ่มต้น" fullWidth type="date"
              value={form.StartDate} onChange={set('StartDate')}
              InputLabelProps={{ shrink: true }} />
          </Grid>
          <Grid item xs={12}>
            <TextField label="หมายเหตุ" fullWidth value={form.Note} onChange={set('Note')} />
          </Grid>

          {/* Preview box — แสดงยอดรวม/ชำระแล้ว/คงเหลือ (แสดงเมื่อกรอกข้อมูลครบ) */}
          {totalAmt > 0 && (
            <Grid item xs={12}>
              <Box sx={{ bgcolor: '#F0F4FF', borderRadius: 2, p: 1.5 }}>
                <Grid container spacing={1}>
                  <Grid item xs={4} textAlign="center">
                    <Typography variant="caption" color="text.secondary">ยอดรวมทั้งหมด</Typography>
                    <Typography variant="body2" fontWeight={700}>฿{formatCurrency(totalAmt)}</Typography>
                  </Grid>
                  <Grid item xs={4} textAlign="center">
                    <Typography variant="caption" color="text.secondary">ชำระแล้ว</Typography>
                    <Typography variant="body2" fontWeight={700} color="success.main">
                      ฿{formatCurrency(totalAmt - remaining)}
                    </Typography>
                  </Grid>
                  <Grid item xs={4} textAlign="center">
                    <Typography variant="caption" color="text.secondary">คงเหลือ</Typography>
                    <Typography variant="body2" fontWeight={700} color="error.main">
                      ฿{formatCurrency(remaining)}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            </Grid>
          )}
        </Grid>
      </DialogContent>
      {/* mt: auto — ดันปุ่มลงล่างสุดเมื่อ dialog เต็มจอบนมือถือ */}
      <DialogActions sx={{ px: 3, pb: 2, gap: 1, mt: 'auto' }}>
        <Button variant="outlined" onClick={onClose} fullWidth disabled={saving}>ยกเลิก</Button>
        <Button variant="contained" onClick={handleSave} fullWidth disabled={saving}>
          {saving ? <CircularProgress size={22} /> : 'บันทึก'}
        </Button>
      </DialogActions>
    </ResponsiveDialog>
  );
}

// =====================================================
// Installments — Component หลักของหน้าผ่อนชำระ
// =====================================================
export default function Installments() {
  const isMobile = useIsMobile();
  // filter — "active"=กำลังผ่อน, "all"=ทั้งหมด
  const [filter, setFilter] = useState('active');
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' });

  // fetchData — โหลดรายการผ่อน ถ้า filter=active จะส่ง activeOnly=true
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await installmentApi.getAll(filter === 'active');
      setList(res.data);
    } catch {
      showSnack('โหลดข้อมูลไม่สำเร็จ', 'error');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const showSnack = (msg, severity = 'success') =>
    setSnack({ open: true, msg, severity });

  const handleSaved = (msg, severity = 'success') => {
    setDialogOpen(false);
    setEditTarget(null);
    showSnack(msg, severity);
    if (severity !== 'error') fetchData();
  };

  const handleDelete = async () => {
    try {
      await installmentApi.remove(deleteId);
      showSnack('ลบรายการเรียบร้อยแล้ว');
      fetchData();
    } catch {
      showSnack('ลบไม่สำเร็จ', 'error');
    } finally {
      setDeleteId(null);
    }
  };

  const now = new Date();

  // กรองเฉพาะรายการที่ยังไม่หมด สำหรับ summary cards
  const activeList = list.filter((i) => !i.IsCompleted);
  const totalMonthly = activeList.reduce((s, i) => s + i.MonthlyAmount, 0);
  const totalRemaining = activeList.reduce((s, i) => s + i.RemainingAmount, 0);

  // isThisMonth — ตรวจว่ารายการนี้ถึงกำหนดชำระเดือนนี้หรือไม่
  // คำนวณจาก: StartDate + จำนวนเดือนที่ผ่านมา vs PaidInstallments
  const isThisMonth = (inst) => {
    if (inst.IsCompleted || !inst.StartDate) return false;
    const start = new Date(inst.StartDate);
    // monthsElapsed = จำนวนเดือนตั้งแต่เริ่มต้นถึงตอนนี้
    const monthsElapsed =
      (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
    // ถ้าผ่านมาแล้ว ≥ 0 เดือน และจำนวนงวดที่จ่ายยังน้อยกว่าเดือนที่ผ่านมา
    return monthsElapsed >= 0 && inst.PaidInstallments <= monthsElapsed;
  };

  return (
    <Box>
      {/* Header — ชื่อหน้า + Toggle กรอง + ปุ่มเพิ่ม */}
      <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2} mb={3}>
        <Typography variant="h5">รายการผ่อนชำระ</Typography>
        <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
          {/* ToggleButtonGroup — เลือก filter exclusive=เลือกได้ทีละอัน */}
          <ToggleButtonGroup
            value={filter} exclusive
            onChange={(_, v) => { if (v) setFilter(v); }} // ป้องกัน v=null เมื่อกดซ้ำ
            size="small"
          >
            <ToggleButton value="active">กำลังผ่อน</ToggleButton>
            <ToggleButton value="all">ทั้งหมด</ToggleButton>
          </ToggleButtonGroup>
          {/* บนมือถือใช้ปุ่มลอย (AddFab) ด้านล่างแทน */}
          {!isMobile && (
            <Button variant="contained" startIcon={<AddIcon />}
              onClick={() => { setEditTarget(null); setDialogOpen(true); }}>
              เพิ่มรายการผ่อน
            </Button>
          )}
        </Box>
      </Box>

      {/* Summary cards — แสดงเมื่อมีรายการที่กำลังผ่อนอยู่ */}
      {!loading && activeList.length > 0 && (
        // บนมือถือ การ์ดสรุป 3 ใบเต็มความกว้างจะดันรายการผ่อนตกไปไกล
        // จึงย่อ padding/ขนาดตัวเลข และวางเป็นแถวเดียว (label อยู่ในบรรทัดเดียวกับค่า)
        <Grid container spacing={{ xs: 1, sm: 2 }} sx={{ mb: 2 }}>
          {[
            { label: 'ยอดผ่อนรวมต่อเดือน', value: `฿${formatCurrency(totalMonthly)}`, bg: 'primary.main' },
            { label: 'ยอดผ่อนที่เหลือทั้งหมด', value: `฿${formatCurrency(totalRemaining)}`, bg: 'error.main' },
            { label: 'รายการที่กำลังผ่อน', value: `${activeList.length} รายการ`, bg: 'success.main' },
          ].map((s) => (
            <Grid item xs={12} sm={4} key={s.label}>
              <Card sx={{ bgcolor: s.bg, color: 'white' }}>
                <CardContent
                  sx={{
                    py: { xs: 1.25, sm: 2 },
                    '&:last-child': { pb: { xs: 1.25, sm: 2 } },
                    // มือถือ: label ซ้าย / ค่าขวา ในบรรทัดเดียว
                    display: { xs: 'flex', sm: 'block' },
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 1,
                  }}
                >
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>{s.label}</Typography>
                  <Typography fontWeight={700} sx={{ fontSize: { xs: '1.1rem', sm: '1.5rem' }, whiteSpace: 'nowrap' }}>
                    {s.value}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* ตารางรายการผ่อน */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          {loading ? (
            <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>
          ) : list.length === 0 ? (
            // Empty state
            <Box py={6} textAlign="center">
              <Typography color="text.secondary" mb={2}>ยังไม่มีรายการผ่อนชำระ</Typography>
              <Button variant="outlined" startIcon={<AddIcon />}
                onClick={() => { setEditTarget(null); setDialogOpen(true); }}>
                เพิ่มรายการผ่อนแรก
              </Button>
            </Box>
          ) : isMobile ? (
            // ─── มุมมองมือถือ: การ์ดหนึ่งใบต่อหนึ่งรายการผ่อน ───
            <Box sx={{ p: 1.5 }}>
              {list.map((inst) => {
                const pct = inst.TotalInstallments > 0
                  ? (inst.PaidInstallments / inst.TotalInstallments) * 100 : 0;
                const dueThisMonth = isThisMonth(inst);

                return (
                  <MobileDataCard
                    key={inst.Id}
                    sx={{
                      opacity: inst.IsCompleted ? 0.55 : 1,
                      bgcolor: dueThisMonth ? 'rgba(255, 167, 38, 0.08)' : 'inherit',
                    }}
                    title={inst.Name}
                    titleChips={
                      <>
                        {inst.IsCompleted
                          ? <Chip icon={<CheckCircleIcon />} label="ชำระครบ" color="success" size="small" />
                          : <Chip icon={<PendingIcon />} label="กำลังผ่อน" color="primary" size="small" variant="outlined" />}
                        {dueThisMonth && (
                          <Chip label="ครบกำหนดเดือนนี้" color="warning" size="small" />
                        )}
                      </>
                    }
                    amount={`฿${formatCurrency(inst.MonthlyAmount)}`}
                    amountColor="text.primary"
                    rows={[
                      {
                        label: 'งวด',
                        value: `${inst.PaidInstallments}/${inst.TotalInstallments} (เหลือ ${inst.RemainingInstallments} งวด)`,
                      },
                      {
                        label: 'ชำระแล้ว',
                        value: `฿${formatCurrency(inst.PaidAmount)}`,
                        color: 'success.main',
                      },
                      {
                        label: 'คงเหลือ',
                        value: `฿${formatCurrency(inst.RemainingAmount)}`,
                        color: inst.IsCompleted ? 'text.disabled' : 'error.main',
                      },
                    ]}
                    footer={
                      <Box display="flex" alignItems="center" gap={1}>
                        <LinearProgress
                          variant="determinate"
                          value={pct}
                          sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
                          color={inst.IsCompleted || pct > 75 ? 'success' : 'primary'}
                        />
                        <Typography variant="caption" sx={{ minWidth: 34 }}>
                          {pct.toFixed(0)}%
                        </Typography>
                      </Box>
                    }
                    actions={
                      <>
                        <IconButton color="primary"
                          onClick={() => { setEditTarget(inst); setDialogOpen(true); }}>
                          <EditIcon />
                        </IconButton>
                        <IconButton color="error" onClick={() => setDeleteId(inst.Id)}>
                          <DeleteIcon />
                        </IconButton>
                      </>
                    }
                  />
                );
              })}
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: '#F5F5F5' } }}>
                    <TableCell>ชื่อรายการ</TableCell>
                    <TableCell align="center">งวด</TableCell>
                    <TableCell align="right">ต่องวด</TableCell>
                    <TableCell align="right">ชำระแล้ว</TableCell>
                    <TableCell align="right">คงเหลือ</TableCell>
                    <TableCell sx={{ minWidth: 140 }}>ความคืบหน้า</TableCell>
                    <TableCell align="center">สถานะ</TableCell>
                    <TableCell align="center">ดำเนินการ</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {list.map((inst) => {
                    // คำนวณ % ความคืบหน้า
                    const pct = inst.TotalInstallments > 0
                      ? (inst.PaidInstallments / inst.TotalInstallments) * 100 : 0;
                    const dueThisMonth = isThisMonth(inst); // ครบกำหนดเดือนนี้?

                    return (
                      <TableRow
                        key={inst.Id}
                        hover
                        sx={{
                          // รายการชำระครบแล้ว → โปร่งใส 55%
                          opacity: inst.IsCompleted ? 0.55 : 1,
                          // ครบกำหนดเดือนนี้ → พื้นส้มอ่อน
                          bgcolor: dueThisMonth ? 'rgba(255, 167, 38, 0.08)' : 'inherit',
                        }}
                      >
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            {inst.Name}
                            {/* Chip เตือนเมื่อถึงกำหนดเดือนนี้ */}
                            {dueThisMonth && (
                              <Chip label="ครบกำหนดเดือนนี้" color="warning" size="small" />
                            )}
                          </Box>
                        </TableCell>
                        {/* งวด ชำระ/รวม และงวดที่เหลือ */}
                        <TableCell align="center">
                          <Typography variant="body2">
                            {inst.PaidInstallments}/{inst.TotalInstallments}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            เหลือ {inst.RemainingInstallments} งวด
                          </Typography>
                        </TableCell>
                        <TableCell align="right">฿{formatCurrency(inst.MonthlyAmount)}</TableCell>
                        {/* ยอดชำระแล้ว (PaidAmount จาก computed property) */}
                        <TableCell align="right" sx={{ color: 'success.main' }}>
                          ฿{formatCurrency(inst.PaidAmount)}
                        </TableCell>
                        {/* ยอดคงเหลือ (RemainingAmount จาก computed property) */}
                        <TableCell align="right" sx={{ color: inst.IsCompleted ? 'text.disabled' : 'error.main' }}>
                          ฿{formatCurrency(inst.RemainingAmount)}
                        </TableCell>
                        {/* Progress Bar — เปลี่ยนสีเป็น success เมื่อ >75% หรือชำระครบ */}
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <LinearProgress
                              variant="determinate"
                              value={pct}
                              sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
                              color={inst.IsCompleted ? 'success' : pct > 75 ? 'success' : 'primary'}
                            />
                            <Typography variant="caption" sx={{ minWidth: 34 }}>
                              {pct.toFixed(0)}%
                            </Typography>
                          </Box>
                        </TableCell>
                        {/* Chip สถานะ */}
                        <TableCell align="center">
                          {inst.IsCompleted ? (
                            <Chip icon={<CheckCircleIcon />} label="ชำระครบ" color="success" size="small" />
                          ) : (
                            <Chip icon={<PendingIcon />} label="กำลังผ่อน" color="primary" size="small" variant="outlined" />
                          )}
                        </TableCell>
                        {/* ปุ่ม แก้ไข / ลบ */}
                        <TableCell align="center">
                          <Tooltip title="แก้ไข">
                            <IconButton size="small" color="primary"
                              onClick={() => { setEditTarget(inst); setDialogOpen(true); }}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="ลบ">
                            <IconButton size="small" color="error"
                              onClick={() => setDeleteId(inst.Id)}>
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

      {/* ปุ่มลอยเพิ่มรายการผ่อน — เฉพาะมือถือ */}
      {isMobile && (
        <AddFab label="เพิ่มรายการผ่อน"
          onClick={() => { setEditTarget(null); setDialogOpen(true); }} />
      )}

      {/* Dialog เพิ่ม/แก้ไข */}
      <InstallmentDialog
        open={dialogOpen}
        installment={editTarget}
        onClose={() => { setDialogOpen(false); setEditTarget(null); }}
        onSaved={handleSaved}
      />

      {/* Dialog ยืนยันการลบ */}
      <ConfirmDialog
        open={!!deleteId}
        message="คุณต้องการลบรายการผ่อนนี้ใช่หรือไม่?"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />

      {/* Snackbar แจ้งผลการทำงาน */}
      <Snackbar
        open={snack.open} autoHideDuration={3000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snack.severity} sx={{ width: '100%' }}
          onClose={() => setSnack((s) => ({ ...s, open: false }))}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
