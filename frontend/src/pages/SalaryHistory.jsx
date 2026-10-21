// ========================================================
// SalaryHistory.jsx — หน้าประวัติเงินเดือนรายปี
// Hallmark · genre: editorial · macrostructure: ledger-table · design-system: design.md · designed-as-app
// ฟีเจอร์:
//   - บันทึกเงินเดือนแต่ละปี พร้อมหมายเหตุ
//   - คำนวณ % ขึ้นเงินเดือนเทียบปีก่อนหน้าอัตโนมัติ
//   - BarChart แสดงพัฒนาการเงินเดือน
//   - เมื่อเพิ่ม/แก้ไขปีล่าสุด → Budget settings อัปเดตอัตโนมัติ
// ========================================================

import { useState, useEffect, useCallback } from 'react';
import {
  Alert, Box, Button, CircularProgress,
  DialogActions, DialogContent,
  IconButton, Paper, Snackbar, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TextField, Tooltip, Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SyncIcon from '@mui/icons-material/Sync';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as ChartTooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { salaryHistoryApi } from '../api/financeApi';
import ConfirmDialog from '../components/ConfirmDialog';
import ResponsiveDialog from '../components/ResponsiveDialog';
import MobileDataCard, { MobileDataList } from '../components/MobileDataCard';
import AddFab from '../components/AddFab';
import PageHeader from '../components/PageHeader';
import Section from '../components/Section';
import useIsMobile from '../hooks/useIsMobile';
import { ledger, num } from '../theme';
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

// signed — ใส่เครื่องหมาย + / − หน้าตัวเลข (ใช้ minus จริง ไม่ใช่ hyphen)
const signed = (n, text) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${text}`;
const changeColor = (n) => (n > 0 ? 'success.main' : n < 0 ? 'error.main' : 'text.secondary');

// Figure — ตัวเลขสรุปหนึ่งช่องในแถบด้านบน
const Figure = ({ label, value, note, color = 'text.primary' }) => (
  <Box sx={{
    py: { xs: 1.25, sm: 2 }, px: { xs: 0, sm: 2.5 }, minWidth: 0,
    // มือถือ: label ซ้าย / ค่าขวา ในบรรทัดเดียว (note ซ่อน เพื่อไม่ให้แถบยาวเกิน)
    display: { xs: 'flex', sm: 'block' }, justifyContent: 'space-between', alignItems: 'baseline', gap: 1,
  }}>
    <Typography component="dt" variant="body2" color="text.secondary">{label}</Typography>
    <Typography component="dd" sx={{ ...num, m: 0, mt: { sm: 0.5 }, fontSize: { xs: 17, sm: 22 }, fontWeight: 500, whiteSpace: 'nowrap' }} color={color}>
      {value}
    </Typography>
    {note && <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>{note}</Typography>}
  </Box>
);

// =====================================================
// CustomTooltip — Tooltip กำหนดเองสำหรับ BarChart
// =====================================================
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const pct = payload[0].payload.changePercent;
  return (
    <Paper sx={{ p: 1.5, minWidth: 160 }}>
      <Typography variant="body2" fontWeight={600} mb={0.5}>ปี {label}</Typography>
      <Typography variant="body2" sx={num}>฿{formatCurrency(payload[0].value)}</Typography>
      {pct != null && (
        <Typography variant="caption" sx={num} color={changeColor(pct)}>
          {signed(pct, `${Math.abs(pct)}%`)}
        </Typography>
      )}
    </Paper>
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
    <ResponsiveDialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      title={record ? 'แก้ไขข้อมูลเงินเดือน' : 'เพิ่มข้อมูลเงินเดือน'}
    >
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
            inputProps={{ min: 2000, max: 2100, inputMode: 'numeric' }}
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
            inputProps={{ min: 1, step: '0.01', inputMode: 'decimal' }}
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
// SalaryHistory — Component หลักของหน้าประวัติเงินเดือน
// =====================================================
export default function SalaryHistory() {
  const isMobile = useIsMobile();
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

  const openAdd = () => { setEditTarget(null); setDialogOpen(true); };
  const rowsNewestFirst = [...enriched].reverse();  // ปีล่าสุดอยู่บนสุด

  return (
    <Box>
      <PageHeader
        title="ประวัติเงินเดือน"
        description="บันทึกการปรับเงินเดือนรายปี — ปีล่าสุดจะ sync ไปที่ตั้งค่างบประมาณอัตโนมัติ"
        actions={!isMobile && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={openAdd}>
            เพิ่มข้อมูลเงินเดือน
          </Button>
        )}
      />

      {loading ? (
        <Box display="flex" justifyContent="center" py={8}><CircularProgress aria-label="กำลังโหลด" /></Box>
      ) : (
        <>
          {/* แถบตัวเลขสรุป — แสดงเมื่อมีข้อมูล ≥ 1 รายการ */}
          {list.length > 0 && (
            <Box
              component="dl"
              sx={{
                m: 0, mb: 5,
                display: 'grid',
                gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: 'repeat(2, minmax(0, 1fr))', md: 'repeat(4, minmax(0, 1fr))' },
                borderTop: 1, borderBottom: 1, borderColor: 'divider',
                '& > div': { borderColor: 'divider' },
                '& > div:not(:first-of-type)': { borderTop: { xs: 1, sm: 0 } },
                '& > div:nth-of-type(even)': { borderLeft: { sm: 1 } },
                '& > div:nth-of-type(3)': { borderLeft: { md: 1 }, borderTop: { sm: 1, md: 0 } },
                '& > div:nth-of-type(4)': { borderTop: { sm: 1, md: 0 } },
              }}
            >
              <Figure
                label="เงินเดือนล่าสุด"
                value={`฿${formatCurrency(latest?.Salary)}`}
                note={`ปี พ.ศ. ${latest ? latest.Year + 543 : '-'}`}
              />
              <Figure
                label="เปลี่ยนแปลงรวม"
                value={totalGrowthPct != null ? signed(Number(totalGrowthPct), `${Math.abs(totalGrowthPct)}%`) : '—'}
                note={list.length > 1 ? `จาก ฿${formatCurrency(first?.Salary)}` : 'ต้องมีข้อมูลอย่างน้อย 2 ปี'}
                color={totalGrowthPct != null ? changeColor(Number(totalGrowthPct)) : 'text.secondary'}
              />
              <Figure
                label="เฉลี่ยต่อปี"
                value={avgGrowthPct != null ? signed(Number(avgGrowthPct), `${Math.abs(avgGrowthPct)}%`) : '—'}
                note="เฉลี่ยจากปีที่มีข้อมูลก่อนหน้า"
                color={avgGrowthPct != null ? changeColor(Number(avgGrowthPct)) : 'text.secondary'}
              />
              <Figure
                label="ข้อมูลทั้งหมด"
                value={`${list.length} ปี`}
                note={list.length > 1 ? `${first.Year + 543} – ${latest.Year + 543}` : ''}
              />
            </Box>
          )}

          {/* BarChart — แสดงเมื่อมีข้อมูล ≥ 2 ปี; ปีล่าสุดเป็นหมึกน้ำเงิน ปีอื่นเป็นเส้นเทา */}
          {list.length >= 2 && (
            <Section title="พัฒนาการเงินเดือน" aside="ปีล่าสุดแสดงเป็นสีน้ำเงิน">
              <Box sx={{ borderTop: 1, borderColor: 'divider', pt: 2 }}>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={chartData} margin={{ top: 10, right: 8, left: 0, bottom: 5 }}>
                    <CartesianGrid vertical={false} stroke={ledger.rule} />
                    <XAxis dataKey="name" tickLine={false} axisLine={{ stroke: ledger.ruleStrong }}
                      tick={{ fontSize: 12, fill: ledger.muted, fontFamily: num.fontFamily }} />
                    <YAxis
                      tickFormatter={formatCurrencyShort}
                      tickLine={false} axisLine={false}
                      tick={{ fontSize: 12, fill: ledger.muted, fontFamily: num.fontFamily }}
                      width={56}
                    />
                    <ChartTooltip content={<CustomTooltip />} cursor={{ fill: ledger.paper3 }} />
                    <Bar dataKey="เงินเดือน" radius={[2, 2, 0, 0]} maxBarSize={64}>
                      {chartData.map((entry, index) => (
                        <Cell
                          key={entry.name}
                          fill={index === chartData.length - 1 ? ledger.accent : ledger.ruleStrong}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Section>
          )}

          {/* ตารางรายการ */}
          <Section title="รายปี" sx={{ mb: 2 }}>
              {list.length === 0 ? (
                <Box py={8} textAlign="center" sx={{ borderTop: 1, borderBottom: 1, borderColor: 'divider' }}>
                  <Typography color="text.secondary" mb={2}>
                    ยังไม่มีข้อมูลเงินเดือน
                  </Typography>
                  <Button variant="outlined" startIcon={<AddIcon />} onClick={openAdd}>
                    เพิ่มข้อมูลปีแรก
                  </Button>
                </Box>
              ) : isMobile ? (
                // ─── มุมมองมือถือ: หนึ่งบรรทัดต่อหนึ่งปี ───
                <MobileDataList>
                  {rowsNewestFirst.map((row) => {
                    const isLatest = row.Id === latest?.Id;
                    return (
                      <MobileDataCard
                        key={row.Id}
                        // ปีล่าสุด — เส้นหมึกน้ำเงินด้านซ้าย
                        sx={isLatest ? { borderLeft: 3, borderLeftColor: 'primary.main', pl: 1.5 } : undefined}
                        title={`ปี ${row.Year + 543}${isLatest ? ' · ปัจจุบัน' : ''}`}
                        amount={`฿${formatCurrency(row.Salary)}`}
                        rows={[
                          {
                            label: 'เปลี่ยนแปลง',
                            value: row.changeAmount != null
                              ? `${signed(row.changeAmount, `฿${formatCurrency(Math.abs(row.changeAmount))}`)} (${signed(row.changePercent, `${Math.abs(row.changePercent)}%`)})`
                              : '—',
                            color: row.changeAmount != null ? changeColor(row.changeAmount) : 'text.secondary',
                          },
                          // แสดงหมายเหตุเฉพาะเมื่อมีข้อความจริง
                          ...(row.Note ? [{ label: 'หมายเหตุ', value: row.Note }] : []),
                        ]}
                        actions={
                          <>
                            <IconButton color="primary" aria-label={`แก้ไขปี ${row.Year + 543}`}
                              onClick={() => { setEditTarget(row); setDialogOpen(true); }}>
                              <EditIcon />
                            </IconButton>
                            <IconButton color="error" aria-label={`ลบปี ${row.Year + 543}`} onClick={() => setDeleteId(row.Id)}>
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
                        <TableCell>ปี (พ.ศ.)</TableCell>
                        <TableCell align="right">เงินเดือน</TableCell>
                        <TableCell align="right">เปลี่ยนแปลง (บาท)</TableCell>
                        <TableCell align="right">%</TableCell>
                        <TableCell>หมายเหตุ</TableCell>
                        <TableCell align="center">ดำเนินการ</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {rowsNewestFirst.map((row) => {
                        const isLatest = row.Id === latest?.Id;
                        return (
                          <TableRow
                            key={row.Id}
                            hover
                            // ปีล่าสุด — เส้นหมึกน้ำเงินด้านซ้าย
                            sx={isLatest ? { '& td:first-of-type': { boxShadow: `inset 3px 0 0 ${ledger.accent}` } } : undefined}
                          >
                            <TableCell>
                              <Typography sx={{ ...num, fontWeight: isLatest ? 600 : 400 }} component="span">
                                {row.Year + 543}
                              </Typography>
                              {isLatest && (
                                <Typography component="span" variant="caption" color="primary.main" fontWeight={600} ml={1}>
                                  ปัจจุบัน
                                </Typography>
                              )}
                            </TableCell>

                            <TableCell align="right" sx={{ ...num, fontWeight: 500 }}>
                              ฿{formatCurrency(row.Salary)}
                            </TableCell>

                            <TableCell align="right" sx={{ ...num, color: row.changeAmount != null ? changeColor(row.changeAmount) : 'text.secondary' }}>
                              {row.changeAmount != null
                                ? signed(row.changeAmount, `฿${formatCurrency(Math.abs(row.changeAmount))}`)
                                : '—'}
                            </TableCell>

                            <TableCell align="right" sx={{ ...num, color: row.changePercent != null ? changeColor(row.changePercent) : 'text.secondary' }}>
                              {row.changePercent != null ? signed(row.changePercent, `${Math.abs(row.changePercent)}%`) : '—'}
                            </TableCell>

                            <TableCell>
                              <Typography variant="body2" color="text.secondary">
                                {row.Note || '—'}
                              </Typography>
                            </TableCell>

                            <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
                              <Tooltip title="แก้ไข">
                                <IconButton size="small" color="primary" aria-label={`แก้ไขปี ${row.Year + 543}`}
                                  onClick={() => { setEditTarget(row); setDialogOpen(true); }}>
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="ลบ">
                                <IconButton size="small" color="error" aria-label={`ลบปี ${row.Year + 543}`}
                                  onClick={() => setDeleteId(row.Id)}>
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
          </Section>

          {/* หมายเหตุ auto-sync */}
          {list.length > 0 && (
            <Box display="flex" alignItems="center" gap={0.75}>
              <SyncIcon fontSize="small" sx={{ color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary">
                เมื่อเพิ่มหรือแก้ไขข้อมูลปีล่าสุด เงินเดือนจะถูกอัปเดตในหน้า "ตั้งค่างบประมาณ" อัตโนมัติ
              </Typography>
            </Box>
          )}
        </>
      )}

      {/* ปุ่มลอยเพิ่มข้อมูลเงินเดือน — เฉพาะมือถือ */}
      {isMobile && (
        <AddFab label="เพิ่มข้อมูลเงินเดือน"
          onClick={() => { setEditTarget(null); setDialogOpen(true); }} />
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
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
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
