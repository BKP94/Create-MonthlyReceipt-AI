// ========================================================
// Budget.jsx — หน้าตั้งค่างบประมาณ
// Hallmark · genre: editorial · macrostructure: long-document · design-system: design.md · designed-as-app
// ฟีเจอร์:
//   - แสดงงบประมาณปัจจุบัน (Gross → หัก → สุทธิ → แบ่งหมวด)
//   - ฟอร์มแก้ไข พร้อม live calculation (คำนวณทันทีที่พิมพ์)
//   - Validate ก่อนบันทึก (สัดส่วนต้องรวม 100%, ไม่ติดลบ ฯลฯ)
//   - บันทึกผ่าน PUT /api/budget
// ========================================================

import { useState, useEffect } from 'react';
import {
  Alert, Box, Button, CircularProgress,
  InputAdornment, Snackbar, TextField, Typography,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import { budgetApi } from '../api/financeApi';
import PageHeader from '../components/PageHeader';
import Section from '../components/Section';
import { num } from '../theme';
import { formatCurrency, formatDateTime } from '../utils/formatters';

// SectionTitle — หัวข้อมีเลขลำดับแบบเอกสาร (01, 02, …)
const SectionTitle = ({ n, children }) => (
  <>
    <Box component="span" sx={{ ...num, color: 'text.secondary', fontWeight: 400, mr: 1.5 }}>{n}</Box>
    {children}
  </>
);

// LedgerLine — หนึ่งบรรทัดในงบ: label ซ้าย / จำนวนเงินขวา
const LedgerLine = ({ label, value, note, color = 'text.primary', strong, rule }) => (
  <Box
    display="flex" justifyContent="space-between" alignItems="baseline" gap={2}
    sx={{
      py: 1.25,
      borderBottom: 1, borderColor: 'divider',
      // rule — เส้นคู่ใต้ยอดรวม แบบสมุดบัญชี
      ...(rule && { borderBottom: '3px double', borderBottomColor: 'ledger.ruleStrong' }),
    }}
  >
    <Box minWidth={0}>
      <Typography variant="body2" fontWeight={strong ? 600 : 400}>{label}</Typography>
      {note && <Typography variant="caption" color="text.secondary">{note}</Typography>}
    </Box>
    <Typography sx={{ ...num, fontSize: strong ? 18 : 15, fontWeight: strong ? 600 : 400, whiteSpace: 'nowrap' }} color={color}>
      {value}
    </Typography>
  </Box>
);

// money adornment / input props ที่ใช้ซ้ำในฟอร์ม
const baht = { startAdornment: <InputAdornment position="start">฿</InputAdornment> };
const pct = { endAdornment: <InputAdornment position="end">%</InputAdornment> };
const moneyInput = { min: 0, step: '0.01', inputMode: 'decimal' };
const pctInput = { min: 0, max: 100, step: '0.5', inputMode: 'decimal' };

// =====================================================
// Budget — Component หลักของหน้าตั้งค่างบประมาณ
// =====================================================
export default function Budget() {
  const [budget, setBudget] = useState(null);    // ข้อมูลงบปัจจุบันจาก API
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' });

  // form — state ของฟอร์มแก้ไข (ทุก field เป็น string เพราะ <input> ต้องการ string)
  const [form, setForm] = useState({
    Salary: '', SocialSecurity: '0', StudentLoan: '0', OtherDeductions: '0',
    DebtPercent: '50', DailyExpensePercent: '30', SavingsPercent: '20',
  });
  const [errors, setErrors] = useState({});

  // โหลดข้อมูลงบปัจจุบันครั้งแรก
  useEffect(() => {
    const fetchBudget = async () => {
      try {
        const res = await budgetApi.get();
        setBudget(res.data);
        // เติมค่าลงฟอร์ม — แปลง number เป็น string ด้วย toString()
        setForm({
          Salary:              res.data.Salary?.toString(),
          SocialSecurity:      res.data.SocialSecurity?.toString() ?? '0',
          StudentLoan:         res.data.StudentLoan?.toString() ?? '0',
          OtherDeductions:     res.data.OtherDeductions?.toString() ?? '0',
          DebtPercent:         res.data.DebtPercent?.toString(),
          DailyExpensePercent: res.data.DailyExpensePercent?.toString(),
          SavingsPercent:      res.data.SavingsPercent?.toString(),
        });
      } catch {
        showSnack('โหลดข้อมูลไม่สำเร็จ', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchBudget();
  }, []);

  const showSnack = (msg, severity = 'success') => setSnack({ open: true, msg, severity });

  // =====================================================
  // Live Calculation — คำนวณทันทีขณะพิมพ์
  // parseFloat(form.X) || 0 → ถ้ายังพิมพ์ไม่ครบหรือเป็น NaN ใช้ 0 แทน
  // =====================================================
  const salary        = parseFloat(form.Salary) || 0;
  const socialSec     = parseFloat(form.SocialSecurity) || 0;
  const studentLoan   = parseFloat(form.StudentLoan) || 0;
  const otherDed      = parseFloat(form.OtherDeductions) || 0;
  const totalDed      = socialSec + studentLoan + otherDed;
  const netSalary     = salary - totalDed;      // เงินเดือนสุทธิ (live)
  const debtPct       = parseFloat(form.DebtPercent) || 0;
  const dailyPct      = parseFloat(form.DailyExpensePercent) || 0;
  const savingsPct    = parseFloat(form.SavingsPercent) || 0;
  const totalPct      = debtPct + dailyPct + savingsPct;  // รวมสัดส่วน (ต้องได้ 100)

  // validate — ตรวจสอบข้อมูลก่อนบันทึก
  const validate = () => {
    const e = {};
    if (!form.Salary || salary <= 0) e.Salary = 'กรุณาระบุเงินเดือนที่ถูกต้อง';
    if (socialSec < 0) e.SocialSecurity = 'ต้องไม่ติดลบ';
    if (studentLoan < 0) e.StudentLoan = 'ต้องไม่ติดลบ';
    if (otherDed < 0) e.OtherDeductions = 'ต้องไม่ติดลบ';
    if (totalDed >= salary) e._deduction = 'รายการหักรวมต้องน้อยกว่าเงินเดือน';
    // Math.abs(totalPct - 100) > 0.01 → ป้องกัน floating point error เล็กน้อย
    if (Math.abs(totalPct - 100) > 0.01) e._total = `สัดส่วนรวมต้องเท่ากับ 100% (ปัจจุบัน: ${totalPct.toFixed(2)}%)`;
    return e;
  };

  const handleSave = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    try {
      const res = await budgetApi.update({
        Salary: salary, SocialSecurity: socialSec,
        StudentLoan: studentLoan, OtherDeductions: otherDed,
        DebtPercent: debtPct, DailyExpensePercent: dailyPct, SavingsPercent: savingsPct,
      });
      setBudget(res.data); // อัปเดต budget ที่แสดง
      showSnack('บันทึกงบประมาณเรียบร้อยแล้ว');
      setErrors({});
    } catch (err) {
      // แสดง error message จาก backend ถ้ามี
      showSnack(err.response?.data?.message ?? 'เกิดข้อผิดพลาด', 'error');
    } finally {
      setSaving(false);
    }
  };

  // set — helper สร้าง onChange handler
  // เมื่อพิมพ์ก็ clear error ของ field นั้นด้วย
  const set = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setErrors((prev) => ({ ...prev, [k]: undefined, _total: undefined, _deduction: undefined }));
  };

  const pctOk = Math.abs(totalPct - 100) < 0.01;

  return (
    <Box maxWidth={760}>
      <PageHeader
        title="ตั้งค่างบประมาณ"
        description="เงินเดือนหักรายการคงที่ แล้วแบ่งเงินสุทธิเป็นสามหมวด"
      />

      {loading ? (
        <Box display="flex" justifyContent="center" py={8}><CircularProgress aria-label="กำลังโหลด" /></Box>
      ) : (
        <>
          {/* 01 — งบประมาณปัจจุบัน (ข้อมูลที่บันทึกล่าสุด) */}
          {budget && (
            <Section
              title={<SectionTitle n="01">งบประมาณปัจจุบัน</SectionTitle>}
              aside={budget.UpdatedAt ? `อัปเดตล่าสุด ${formatDateTime(budget.UpdatedAt)}` : undefined}
              sx={{ mb: 6 }}
            >
              <Box sx={{ borderTop: 1, borderColor: 'ledger.ruleStrong' }}>
                <LedgerLine label="เงินเดือน (ก่อนหัก)" value={`฿${formatCurrency(budget.Salary)}`} />
                <LedgerLine label="ประกันสังคม" value={budget.SocialSecurity > 0 ? `−฿${formatCurrency(budget.SocialSecurity)}` : '—'}
                  color={budget.SocialSecurity > 0 ? 'error.main' : 'text.secondary'} />
                <LedgerLine label="กยศ." value={budget.StudentLoan > 0 ? `−฿${formatCurrency(budget.StudentLoan)}` : '—'}
                  color={budget.StudentLoan > 0 ? 'error.main' : 'text.secondary'} />
                <LedgerLine label="อื่นๆ" value={budget.OtherDeductions > 0 ? `−฿${formatCurrency(budget.OtherDeductions)}` : '—'}
                  color={budget.OtherDeductions > 0 ? 'error.main' : 'text.secondary'} />
                <LedgerLine label="เงินเดือนสุทธิ" note="ใช้เป็นฐานแบ่งงบ"
                  value={`฿${formatCurrency(budget.NetSalary)}`} strong rule />
              </Box>

              {/* แบ่งเงินสุทธิเป็นสามหมวด */}
              <Box
                component="dl"
                sx={{
                  m: 0, mt: 3,
                  display: 'grid',
                  gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: 'repeat(3, minmax(0, 1fr))' },
                  borderTop: 1, borderBottom: 1, borderColor: 'divider',
                  '& > div:not(:first-of-type)': { borderTop: { xs: 1, sm: 0 }, borderLeft: { sm: 1 }, borderColor: 'divider' },
                }}
              >
                {[
                  { label: 'หนี้/ผ่อน', amount: budget.DebtBudget, pct: budget.DebtPercent },
                  { label: 'ประจำวัน', amount: budget.DailyBudget, pct: budget.DailyExpensePercent },
                  { label: 'เงินเก็บ', amount: budget.SavingsBudget, pct: budget.SavingsPercent },
                ].map((c) => (
                  <Box key={c.label} sx={{
                    py: { xs: 1.25, sm: 2 }, px: { xs: 0, sm: 2.5 }, minWidth: 0,
                    display: { xs: 'flex', sm: 'block' }, justifyContent: 'space-between', alignItems: 'baseline', gap: 1,
                  }}>
                    <Typography component="dt" variant="body2" color="text.secondary">
                      {c.label} <Box component="span" sx={num}>· {c.pct}%</Box>
                    </Typography>
                    <Typography component="dd" sx={{ ...num, m: 0, mt: { sm: 0.5 }, fontSize: { xs: 17, sm: 22 }, fontWeight: 500, whiteSpace: 'nowrap' }}>
                      ฿{formatCurrency(c.amount)}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Section>
          )}

          {/* 02 — เงินเดือนและรายการหัก */}
          <Section title={<SectionTitle n="02">เงินเดือนและรายการหัก</SectionTitle>} aside="หักก่อนคำนวณสัดส่วน" sx={{ mb: 6 }}>
            <Box display="grid" gap={2.5} sx={{ gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: 'repeat(3, minmax(0, 1fr))' } }}>
              <TextField
                label="เงินเดือน (บาท)" fullWidth type="number"
                value={form.Salary} onChange={set('Salary')}
                error={!!errors.Salary} helperText={errors.Salary}
                InputProps={baht} inputProps={moneyInput}
                sx={{ gridColumn: '1 / -1' }}
              />
              <TextField
                label="ประกันสังคม (บาท)" fullWidth type="number"
                value={form.SocialSecurity} onChange={set('SocialSecurity')}
                error={!!errors.SocialSecurity} helperText={errors.SocialSecurity}
                InputProps={baht} inputProps={moneyInput}
              />
              <TextField
                label="กยศ. (บาท)" fullWidth type="number"
                value={form.StudentLoan} onChange={set('StudentLoan')}
                error={!!errors.StudentLoan} helperText={errors.StudentLoan}
                InputProps={baht} inputProps={moneyInput}
              />
              <TextField
                label="อื่นๆ (บาท)" fullWidth type="number"
                value={form.OtherDeductions} onChange={set('OtherDeductions')}
                error={!!errors.OtherDeductions} helperText={errors.OtherDeductions}
                InputProps={baht} inputProps={moneyInput}
              />
            </Box>

            {/* ผลคำนวณสด — เงินเดือนสุทธิ */}
            <Box mt={3} sx={{ borderTop: 1, borderColor: 'ledger.ruleStrong' }} aria-live="polite">
              <LedgerLine label="เงินเดือน" value={`฿${formatCurrency(salary)}`} />
              <LedgerLine label="หักรวม" value={totalDed > 0 ? `−฿${formatCurrency(totalDed)}` : '—'}
                color={totalDed > 0 ? 'error.main' : 'text.secondary'} />
              <LedgerLine label="เงินเดือนสุทธิ" value={`฿${formatCurrency(netSalary)}`}
                color={netSalary > 0 ? 'text.primary' : 'error.main'} strong rule />
            </Box>
            {errors._deduction && <Alert severity="error" sx={{ mt: 1.5 }}>{errors._deduction}</Alert>}
          </Section>

          {/* 03 — สัดส่วนงบประมาณ */}
          <Section title={<SectionTitle n="03">สัดส่วนจากเงินเดือนสุทธิ</SectionTitle>} aside="รวมต้องได้ 100%" sx={{ mb: 4 }}>
            <Box display="grid" gap={2.5} sx={{ gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: 'repeat(3, minmax(0, 1fr))' } }}>
              <TextField
                label="หนี้/ผ่อน (%)" fullWidth type="number"
                value={form.DebtPercent} onChange={set('DebtPercent')}
                error={!!errors.DebtPercent}
                helperText={netSalary > 0 ? `฿${formatCurrency(netSalary * debtPct / 100)}` : ' '}
                InputProps={pct} inputProps={pctInput}
              />
              <TextField
                label="ประจำวัน (%)" fullWidth type="number"
                value={form.DailyExpensePercent} onChange={set('DailyExpensePercent')}
                error={!!errors.DailyExpensePercent}
                helperText={netSalary > 0 ? `฿${formatCurrency(netSalary * dailyPct / 100)}` : ' '}
                InputProps={pct} inputProps={pctInput}
              />
              <TextField
                label="เงินเก็บ (%)" fullWidth type="number"
                value={form.SavingsPercent} onChange={set('SavingsPercent')}
                error={!!errors.SavingsPercent}
                helperText={netSalary > 0 ? `฿${formatCurrency(netSalary * savingsPct / 100)}` : ' '}
                InputProps={pct} inputProps={pctInput}
              />
            </Box>

            {/* ผลรวมสัดส่วน — ข้อความ + สี ไม่ใช้สีอย่างเดียว */}
            <Box
              mt={2} py={1.25}
              display="flex" justifyContent="space-between" alignItems="baseline" gap={2} flexWrap="wrap"
              sx={{ borderTop: 1, borderBottom: '3px double', borderColor: 'ledger.ruleStrong' }}
              aria-live="polite"
            >
              <Typography variant="body2" fontWeight={600} color={pctOk ? 'success.main' : 'error.main'}>
                {pctOk ? 'สัดส่วนรวมครบ 100%' : 'สัดส่วนรวมยังไม่ครบ'}{' '}
                <Box component="span" sx={num}>({totalPct.toFixed(2)}%)</Box>
              </Typography>
              {netSalary > 0 && (
                <Typography variant="body2" sx={num} color="text.secondary">
                  ฿{formatCurrency(netSalary * totalPct / 100)} / ฿{formatCurrency(netSalary)}
                </Typography>
              )}
            </Box>
            {errors._total && <Alert severity="error" sx={{ mt: 1.5 }}>{errors._total}</Alert>}
          </Section>

          <Button
            variant="contained" size="large"
            sx={{ width: { xs: '100%', sm: 'auto' } }}
            startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
            onClick={handleSave} disabled={saving}
          >
            บันทึกงบประมาณ
          </Button>
        </>
      )}

      {/* Snackbar แจ้งผลการบันทึก */}
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
