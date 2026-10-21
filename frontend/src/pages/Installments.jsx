// ========================================================
// Installments.jsx — หน้ารายการผ่อนชำระ
// ฟีเจอร์:
//   - ดูรายการผ่อนทั้งหมด หรือกรองเฉพาะที่กำลังผ่อนอยู่
//   - เพิ่ม/แก้ไข/ลบรายการผ่อน (Dialog + ConfirmDialog)
//   - Progress Bar แสดงความคืบหน้าการผ่อน
//   - Chip "ครบกำหนดเดือนนี้" — คำนวณจาก StartDate + PaidInstallments
//   - แถบตัวเลขสรุป (ยอดรวมต่อเดือน, ยอดคงเหลือ, จำนวนรายการ)
// Hallmark · genre: editorial · macrostructure: ledger-table · design-system: design.md · designed-as-app
// ========================================================

import { useState, useEffect, useCallback } from 'react';
import {
  Alert, Box, Button, Chip, CircularProgress,
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
import MobileDataCard, { MobileDataList } from '../components/MobileDataCard';
import AddFab from '../components/AddFab';
import PageHeader from '../components/PageHeader';
import useIsMobile from '../hooks/useIsMobile';
import { num } from '../theme';
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
              inputProps={{ min: 0, step: '0.01', inputMode: 'decimal' }} />
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
              <Box sx={{ bgcolor: 'ledger.paper2', borderTop: 1, borderBottom: 1, borderColor: 'divider', p: 1.5 }}>
                <Grid container spacing={1}>
                  <Grid item xs={4} textAlign="center">
                    <Typography variant="caption" color="text.secondary">ยอดรวมทั้งหมด</Typography>
                    <Typography variant="body2" fontWeight={600} sx={num}>฿{formatCurrency(totalAmt)}</Typography>
                  </Grid>
                  <Grid item xs={4} textAlign="center">
                    <Typography variant="caption" color="text.secondary">ชำระแล้ว</Typography>
                    <Typography variant="body2" fontWeight={600} sx={num} color="success.main">
                      ฿{formatCurrency(totalAmt - remaining)}
                    </Typography>
                  </Grid>
                  <Grid item xs={4} textAlign="center">
                    <Typography variant="caption" color="text.secondary">คงเหลือ</Typography>
                    <Typography variant="body2" fontWeight={600} sx={num} color="error.main">
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

  // ProgressCell — แถบความคืบหน้า + % (ใช้ทั้งตารางและมือถือ)
  const ProgressCell = ({ inst, pct }) => (
    <Box display="flex" alignItems="center" gap={1}>
      <LinearProgress
        variant="determinate"
        value={pct}
        aria-label={`ความคืบหน้า ${inst.Name}`}
        sx={{ flexGrow: 1 }}
        color={inst.IsCompleted ? 'success' : 'primary'}
      />
      <Typography variant="caption" sx={{ ...num, minWidth: 36, textAlign: 'right' }}>
        {pct.toFixed(0)}%
      </Typography>
    </Box>
  );

  // StatusLabel — ข้อความสถานะ (ชำระครบ = หมึกจาง + ไอคอน ไม่ใช้ opacity ทั้งแถว)
  const StatusLabel = ({ inst }) => inst.IsCompleted ? (
    <Box component="span" display="inline-flex" alignItems="center" gap={0.5} sx={{ color: 'success.main', fontSize: 13, fontWeight: 500 }}>
      <CheckCircleIcon sx={{ fontSize: 16 }} /> ชำระครบ
    </Box>
  ) : (
    <Box component="span" display="inline-flex" alignItems="center" gap={0.5} sx={{ color: 'primary.main', fontSize: 13, fontWeight: 500 }}>
      <PendingIcon sx={{ fontSize: 16 }} /> กำลังผ่อน
    </Box>
  );

  const openAdd = () => { setEditTarget(null); setDialogOpen(true); };

  return (
    <Box>
      <PageHeader
        title="รายการผ่อนชำระ"
        description="งวดที่จ่ายแล้ว ยอดคงเหลือ และรายการที่ถึงกำหนดเดือนนี้"
        actions={
          <>
            {/* ToggleButtonGroup — เลือก filter exclusive=เลือกได้ทีละอัน */}
            <ToggleButtonGroup
              value={filter} exclusive
              onChange={(_, v) => { if (v) setFilter(v); }} // ป้องกัน v=null เมื่อกดซ้ำ
              size="small"
              aria-label="กรองรายการผ่อน"
            >
              <ToggleButton value="active">กำลังผ่อน</ToggleButton>
              <ToggleButton value="all">ทั้งหมด</ToggleButton>
            </ToggleButtonGroup>
            {/* บนมือถือใช้ปุ่มลอย (AddFab) ด้านล่างแทน */}
            {!isMobile && (
              <Button variant="contained" startIcon={<AddIcon />} onClick={openAdd}>
                เพิ่มรายการผ่อน
              </Button>
            )}
          </>
        }
      />

      {/* แถบตัวเลขสรุป — แสดงเมื่อมีรายการที่กำลังผ่อนอยู่ */}
      {!loading && activeList.length > 0 && (
        <Box
          component="dl"
          sx={{
            m: 0, mb: 4,
            display: 'grid',
            gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: 'repeat(3, minmax(0, 1fr))' },
            borderTop: 1, borderBottom: 1, borderColor: 'divider',
            '& > div:not(:first-of-type)': {
              borderTop: { xs: 1, sm: 0 }, borderLeft: { sm: 1 }, borderColor: 'divider',
            },
          }}
        >
          {[
            { label: 'ยอดผ่อนรวมต่อเดือน', value: `฿${formatCurrency(totalMonthly)}` },
            { label: 'ยอดผ่อนที่เหลือทั้งหมด', value: `฿${formatCurrency(totalRemaining)}`, color: 'error.main' },
            { label: 'รายการที่กำลังผ่อน', value: `${activeList.length} รายการ` },
          ].map((s) => (
            <Box key={s.label} sx={{
              py: { xs: 1.25, sm: 2 }, px: { xs: 0, sm: 2.5 }, minWidth: 0,
              // มือถือ: label ซ้าย / ค่าขวา ในบรรทัดเดียว ไม่ดันรายการตกไปไกล
              display: { xs: 'flex', sm: 'block' }, justifyContent: 'space-between', alignItems: 'baseline', gap: 1,
            }}>
              <Typography component="dt" variant="body2" color="text.secondary">{s.label}</Typography>
              <Typography component="dd" sx={{ ...num, m: 0, mt: { sm: 0.5 }, fontSize: { xs: 17, sm: 22 }, fontWeight: 500, whiteSpace: 'nowrap' }}
                color={s.color ?? 'text.primary'}>
                {s.value}
              </Typography>
            </Box>
          ))}
        </Box>
      )}

      <Box component="section" aria-label="รายการผ่อน">
          {loading ? (
            <Box display="flex" justifyContent="center" py={6}><CircularProgress aria-label="กำลังโหลด" /></Box>
          ) : list.length === 0 ? (
            // Empty state
            <Box py={6} textAlign="center" sx={{ borderTop: 1, borderBottom: 1, borderColor: 'divider' }}>
              <Typography color="text.secondary" mb={2}>ยังไม่มีรายการผ่อนชำระ</Typography>
              <Button variant="outlined" startIcon={<AddIcon />} onClick={openAdd}>
                เพิ่มรายการผ่อนแรก
              </Button>
            </Box>
          ) : isMobile ? (
            // ─── มุมมองมือถือ: หนึ่งบรรทัดต่อหนึ่งรายการผ่อน ───
            <MobileDataList>
              {list.map((inst) => {
                const pct = inst.TotalInstallments > 0
                  ? (inst.PaidInstallments / inst.TotalInstallments) * 100 : 0;
                const dueThisMonth = isThisMonth(inst);

                return (
                  <MobileDataCard
                    key={inst.Id}
                    sx={{ bgcolor: dueThisMonth ? 'ledger.warningSoft' : 'transparent' }}
                    title={inst.Name}
                    titleChips={
                      <>
                        <StatusLabel inst={inst} />
                        {dueThisMonth && (
                          <Chip label="ครบกำหนดเดือนนี้" color="warning" size="small" />
                        )}
                      </>
                    }
                    amount={`฿${formatCurrency(inst.MonthlyAmount)}`}
                    amountColor={inst.IsCompleted ? 'text.secondary' : 'text.primary'}
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
                        color: inst.IsCompleted ? 'text.secondary' : 'error.main',
                      },
                    ]}
                    footer={<ProgressCell inst={inst} pct={pct} />}
                    actions={
                      <>
                        <IconButton color="primary" aria-label={`แก้ไข ${inst.Name}`}
                          onClick={() => { setEditTarget(inst); setDialogOpen(true); }}>
                          <EditIcon />
                        </IconButton>
                        <IconButton color="error" aria-label={`ลบ ${inst.Name}`} onClick={() => setDeleteId(inst.Id)}>
                          <DeleteIcon />
                        </IconButton>
                      </>
                    }
                  />
                );
              })}
            </MobileDataList>
          ) : (
            <TableContainer sx={{ borderTop: 1, borderColor: 'ledger.ruleStrong' }}>
              <Table>
                <TableHead>
                  <TableRow>
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
                    // ชำระครบ → หมึกจาง (สี muted ที่ผ่าน contrast) แทน opacity ทั้งแถว
                    const ink = inst.IsCompleted ? 'text.secondary' : 'text.primary';

                    return (
                      <TableRow
                        key={inst.Id}
                        hover
                        sx={{ bgcolor: dueThisMonth ? 'ledger.warningSoft' : 'inherit', '& td': { color: ink } }}
                      >
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                            {inst.Name}
                            {/* Chip เตือนเมื่อถึงกำหนดเดือนนี้ */}
                            {dueThisMonth && (
                              <Chip label="ครบกำหนดเดือนนี้" color="warning" size="small" />
                            )}
                          </Box>
                        </TableCell>
                        {/* งวด ชำระ/รวม และงวดที่เหลือ */}
                        <TableCell align="center">
                          <Typography variant="body2" sx={num}>
                            {inst.PaidInstallments}/{inst.TotalInstallments}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            เหลือ {inst.RemainingInstallments} งวด
                          </Typography>
                        </TableCell>
                        <TableCell align="right" sx={num}>฿{formatCurrency(inst.MonthlyAmount)}</TableCell>
                        {/* ยอดชำระแล้ว (PaidAmount จาก computed property) */}
                        <TableCell align="right" sx={{ ...num, '&&': { color: 'success.main' } }}>
                          ฿{formatCurrency(inst.PaidAmount)}
                        </TableCell>
                        {/* ยอดคงเหลือ (RemainingAmount จาก computed property) */}
                        <TableCell align="right" sx={{ ...num, '&&': { color: inst.IsCompleted ? 'text.secondary' : 'error.main' } }}>
                          ฿{formatCurrency(inst.RemainingAmount)}
                        </TableCell>
                        <TableCell><ProgressCell inst={inst} pct={pct} /></TableCell>
                        <TableCell align="center"><StatusLabel inst={inst} /></TableCell>
                        {/* ปุ่ม แก้ไข / ลบ */}
                        <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
                          <Tooltip title="แก้ไข">
                            <IconButton size="small" color="primary" aria-label={`แก้ไข ${inst.Name}`}
                              onClick={() => { setEditTarget(inst); setDialogOpen(true); }}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="ลบ">
                            <IconButton size="small" color="error" aria-label={`ลบ ${inst.Name}`}
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
      </Box>

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
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity={snack.severity} sx={{ width: '100%' }}
          onClose={() => setSnack((s) => ({ ...s, open: false }))}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
