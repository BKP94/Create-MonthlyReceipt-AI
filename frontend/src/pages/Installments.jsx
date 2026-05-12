import { useState, useEffect, useCallback } from 'react';
import {
  Alert, Box, Button, Card, CardContent, Chip, CircularProgress,
  Dialog, DialogActions, DialogContent, DialogTitle,
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
import { formatCurrency } from '../utils/formatters';

const emptyForm = {
  Name: '', TotalInstallments: '', PaidInstallments: '0',
  MonthlyAmount: '', StartDate: '', Note: '',
};

function InstallmentDialog({ open, installment, onClose, onSaved }) {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

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
      if (installment?.Id) await installmentApi.update(installment.Id, payload);
      else await installmentApi.create(payload);
      onSaved('บันทึกรายการเรียบร้อยแล้ว');
    } catch {
      onSaved('เกิดข้อผิดพลาด กรุณาลองใหม่', 'error');
    } finally {
      setSaving(false);
    }
  };

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const totalAmt = Number(form.TotalInstallments) * parseFloat(form.MonthlyAmount || 0);
  const remaining = (Number(form.TotalInstallments) - Number(form.PaidInstallments || 0)) * parseFloat(form.MonthlyAmount || 0);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{installment ? 'แก้ไขรายการผ่อน' : 'เพิ่มรายการผ่อน'}</DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <Grid container spacing={2} sx={{ mt: 0 }}>
          <Grid item xs={12}>
            <TextField label="ชื่อรายการผ่อน *" fullWidth value={form.Name}
              onChange={set('Name')} error={!!errors.Name} helperText={errors.Name} />
          </Grid>
          <Grid item xs={6}>
            <TextField label="จำนวนงวดทั้งหมด *" fullWidth type="number"
              value={form.TotalInstallments} onChange={set('TotalInstallments')}
              error={!!errors.TotalInstallments} helperText={errors.TotalInstallments}
              inputProps={{ min: 1 }} />
          </Grid>
          <Grid item xs={6}>
            <TextField label="งวดที่ชำระแล้ว" fullWidth type="number"
              value={form.PaidInstallments} onChange={set('PaidInstallments')}
              error={!!errors.PaidInstallments} helperText={errors.PaidInstallments}
              inputProps={{ min: 0 }} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="จำนวนเงินต่องวด (บาท) *" fullWidth type="number"
              value={form.MonthlyAmount} onChange={set('MonthlyAmount')}
              error={!!errors.MonthlyAmount} helperText={errors.MonthlyAmount}
              inputProps={{ min: 0, step: '0.01' }} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="วันที่เริ่มต้น" fullWidth type="date"
              value={form.StartDate} onChange={set('StartDate')}
              InputLabelProps={{ shrink: true }} />
          </Grid>
          <Grid item xs={12}>
            <TextField label="หมายเหตุ" fullWidth value={form.Note} onChange={set('Note')} />
          </Grid>

          {/* Preview */}
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
      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        <Button variant="outlined" onClick={onClose} fullWidth disabled={saving}>ยกเลิก</Button>
        <Button variant="contained" onClick={handleSave} fullWidth disabled={saving}>
          {saving ? <CircularProgress size={22} /> : 'บันทึก'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function Installments() {
  const [filter, setFilter] = useState('active');
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' });

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
  const activeList = list.filter((i) => !i.IsCompleted);
  const totalMonthly = activeList.reduce((s, i) => s + i.MonthlyAmount, 0);
  const totalRemaining = activeList.reduce((s, i) => s + i.RemainingAmount, 0);

  const isThisMonth = (inst) => {
    if (inst.IsCompleted || !inst.StartDate) return false;
    const start = new Date(inst.StartDate);
    const monthsElapsed =
      (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
    return monthsElapsed >= 0 && inst.PaidInstallments <= monthsElapsed;
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2} mb={3}>
        <Typography variant="h5">รายการผ่อนชำระ</Typography>
        <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
          <ToggleButtonGroup
            value={filter} exclusive
            onChange={(_, v) => { if (v) setFilter(v); }}
            size="small"
          >
            <ToggleButton value="active">กำลังผ่อน</ToggleButton>
            <ToggleButton value="all">ทั้งหมด</ToggleButton>
          </ToggleButtonGroup>
          <Button variant="contained" startIcon={<AddIcon />}
            onClick={() => { setEditTarget(null); setDialogOpen(true); }}>
            เพิ่มรายการผ่อน
          </Button>
        </Box>
      </Box>

      {/* Summary cards */}
      {!loading && activeList.length > 0 && (
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={4}>
            <Card sx={{ bgcolor: 'primary.main', color: 'white' }}>
              <CardContent sx={{ py: 2 }}>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>ยอดผ่อนรวมต่อเดือน</Typography>
                <Typography variant="h5" fontWeight={700}>฿{formatCurrency(totalMonthly)}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card sx={{ bgcolor: 'error.main', color: 'white' }}>
              <CardContent sx={{ py: 2 }}>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>ยอดผ่อนที่เหลือทั้งหมด</Typography>
                <Typography variant="h5" fontWeight={700}>฿{formatCurrency(totalRemaining)}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card sx={{ bgcolor: 'success.main', color: 'white' }}>
              <CardContent sx={{ py: 2 }}>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>รายการที่กำลังผ่อน</Typography>
                <Typography variant="h5" fontWeight={700}>{activeList.length} รายการ</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      <Card>
        <CardContent sx={{ p: 0 }}>
          {loading ? (
            <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>
          ) : list.length === 0 ? (
            <Box py={6} textAlign="center">
              <Typography color="text.secondary" mb={2}>ยังไม่มีรายการผ่อนชำระ</Typography>
              <Button variant="outlined" startIcon={<AddIcon />}
                onClick={() => { setEditTarget(null); setDialogOpen(true); }}>
                เพิ่มรายการผ่อนแรก
              </Button>
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
                    const pct = inst.TotalInstallments > 0
                      ? (inst.PaidInstallments / inst.TotalInstallments) * 100 : 0;
                    const dueThisMonth = isThisMonth(inst);
                    return (
                      <TableRow
                        key={inst.Id}
                        hover
                        sx={{
                          opacity: inst.IsCompleted ? 0.55 : 1,
                          bgcolor: dueThisMonth ? 'rgba(255, 167, 38, 0.08)' : 'inherit',
                        }}
                      >
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            {inst.Name}
                            {dueThisMonth && (
                              <Chip label="ครบกำหนดเดือนนี้" color="warning" size="small" />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2">
                            {inst.PaidInstallments}/{inst.TotalInstallments}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            เหลือ {inst.RemainingInstallments} งวด
                          </Typography>
                        </TableCell>
                        <TableCell align="right">฿{formatCurrency(inst.MonthlyAmount)}</TableCell>
                        <TableCell align="right" sx={{ color: 'success.main' }}>
                          ฿{formatCurrency(inst.PaidAmount)}
                        </TableCell>
                        <TableCell align="right" sx={{ color: inst.IsCompleted ? 'text.disabled' : 'error.main' }}>
                          ฿{formatCurrency(inst.RemainingAmount)}
                        </TableCell>
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
                        <TableCell align="center">
                          {inst.IsCompleted ? (
                            <Chip icon={<CheckCircleIcon />} label="ชำระครบ" color="success" size="small" />
                          ) : (
                            <Chip icon={<PendingIcon />} label="กำลังผ่อน" color="primary" size="small" variant="outlined" />
                          )}
                        </TableCell>
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

      <InstallmentDialog
        open={dialogOpen}
        installment={editTarget}
        onClose={() => { setDialogOpen(false); setEditTarget(null); }}
        onSaved={handleSaved}
      />

      <ConfirmDialog
        open={!!deleteId}
        message="คุณต้องการลบรายการผ่อนนี้ใช่หรือไม่?"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />

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
