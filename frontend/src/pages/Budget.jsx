// ========================================================
// Budget.jsx — หน้าตั้งค่างบประมาณ
// ฟีเจอร์:
//   - แสดงงบประมาณปัจจุบัน (Gross → หัก → สุทธิ → แบ่งหมวด)
//   - ฟอร์มแก้ไข พร้อม live calculation (คำนวณทันทีที่พิมพ์)
//   - Validate ก่อนบันทึก (สัดส่วนต้องรวม 100%, ไม่ติดลบ ฯลฯ)
//   - บันทึกผ่าน PUT /api/budget
// ========================================================

import { useState, useEffect } from 'react';
import {
  Alert, Box, Button, Card, CardContent, CircularProgress,
  Divider, Grid, InputAdornment, Snackbar, TextField, Typography,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import SavingsIcon from '@mui/icons-material/Savings';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import { budgetApi } from '../api/financeApi';
import { formatCurrency } from '../utils/formatters';

// =====================================================
// BudgetResultCard — การ์ดแสดงงบแต่ละหมวด (หนี้/ผ่อน, ประจำวัน, เก็บออม)
// มีเส้นซ้ายสีตาม color prop
// =====================================================
const BudgetResultCard = ({ title, amount, percent, icon, color }) => (
  <Card sx={{ borderLeft: '4px solid', borderColor: color }}>
    <CardContent sx={{ p: 2 }}>
      <Box display="flex" alignItems="center" gap={1.5}>
        <Box sx={{ color }}>{icon}</Box>
        <Box flex={1}>
          <Typography variant="body2" color="text.secondary">{title}</Typography>
          <Typography variant="h6" fontWeight={700} sx={{ color }}>
            ฿{formatCurrency(amount)}
          </Typography>
          <Typography variant="caption" color="text.secondary">{percent}% ของเงินเดือนสุทธิ</Typography>
        </Box>
      </Box>
    </CardContent>
  </Card>
);

// =====================================================
// DeductionRow — แถวแสดงรายการหักเงินเดือน
// มีไอคอน "-" และแสดงจำนวนเงินสีแดง
// =====================================================
const DeductionRow = ({ label, amount }) => (
  <Box display="flex" justifyContent="space-between" alignItems="center" py={0.5}>
    <Box display="flex" alignItems="center" gap={0.5}>
      <RemoveCircleOutlineIcon sx={{ fontSize: 14, color: 'error.light' }} />
      <Typography variant="body2" color="text.secondary">{label}</Typography>
    </Box>
    <Typography variant="body2" color="error.main" fontWeight={500}>
      -{amount > 0 ? `฿${formatCurrency(amount)}` : '-'}
    </Typography>
  </Box>
);

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

  // แสดง loading spinner ขณะโหลดข้อมูลครั้งแรก
  if (loading) return <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>;

  return (
    <Box maxWidth={760} mx="auto">
      <Typography variant="h5" mb={3}>ตั้งค่างบประมาณ</Typography>

      {/* ส่วนที่ 1 — แสดงงบประมาณปัจจุบัน (ข้อมูลที่บันทึกล่าสุด) */}
      {budget && (
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ p: 2.5 }}>
            <Box display="flex" alignItems="center" gap={1.5} mb={2}>
              <AccountBalanceIcon color="primary" />
              <Typography variant="subtitle1" fontWeight={600}>งบประมาณปัจจุบัน</Typography>
              <Typography variant="caption" color="text.secondary" ml="auto">
                อัปเดตล่าสุด: {budget.UpdatedAt}
              </Typography>
            </Box>

            {/* กล่อง 3 ช่อง: เงินเดือน → รายการหัก → เงินเดือนสุทธิ */}
            <Grid container spacing={1.5} mb={2}>
              <Grid item xs={12} sm={4}>
                {/* กล่องน้ำเงิน — เงินเดือนก่อนหัก */}
                <Box sx={{ bgcolor: 'primary.main', color: 'white', borderRadius: 2, p: 2, textAlign: 'center', height: '100%' }}>
                  <Typography variant="caption" sx={{ opacity: 0.85 }}>เงินเดือน (Gross)</Typography>
                  <Typography variant="h5" fontWeight={700}>฿{formatCurrency(budget.Salary)}</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                {/* กล่องส้มอ่อน — รายการหักทั้งหมด */}
                <Box sx={{ bgcolor: '#FFF3E0', borderRadius: 2, p: 2, height: '100%' }}>
                  <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>รายการหัก</Typography>
                  <DeductionRow label="ประกันสังคม" amount={budget.SocialSecurity} />
                  <DeductionRow label="กยศ." amount={budget.StudentLoan} />
                  <DeductionRow label="อื่นๆ" amount={budget.OtherDeductions} />
                  <Divider sx={{ my: 0.5 }} />
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="caption" fontWeight={600}>รวมหัก</Typography>
                    <Typography variant="caption" fontWeight={700} color="error.main">
                      ฿{formatCurrency(budget.TotalDeductions)}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                {/* กล่องเขียว — เงินเดือนสุทธิ (ใช้คำนวณ 50/30/20) */}
                <Box sx={{ bgcolor: 'success.main', color: 'white', borderRadius: 2, p: 2, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <Typography variant="caption" sx={{ opacity: 0.85 }}>เงินเดือนสุทธิ</Typography>
                  <Typography variant="h5" fontWeight={700}>฿{formatCurrency(budget.NetSalary)}</Typography>
                  <Typography variant="caption" sx={{ opacity: 0.75 }}>
                    ใช้คำนวณ 50/30/20
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            {/* การ์ดงบแต่ละหมวด */}
            <Grid container spacing={1.5}>
              <Grid item xs={12} sm={4}>
                <BudgetResultCard title="หนี้/ผ่อน" amount={budget.DebtBudget}
                  percent={budget.DebtPercent} icon={<CreditCardIcon />} color="#C62828" />
              </Grid>
              <Grid item xs={12} sm={4}>
                <BudgetResultCard title="ประจำวัน" amount={budget.DailyBudget}
                  percent={budget.DailyExpensePercent} icon={<ShoppingCartIcon />} color="#E65100" />
              </Grid>
              <Grid item xs={12} sm={4}>
                <BudgetResultCard title="เงินเก็บ" amount={budget.SavingsBudget}
                  percent={budget.SavingsPercent} icon={<SavingsIcon />} color="#2E7D32" />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* ส่วนที่ 2 — ฟอร์มแก้ไขงบประมาณ */}
      <Card>
        <CardContent sx={{ p: 2.5 }}>
          <Typography variant="subtitle1" fontWeight={600} mb={2}>แก้ไขงบประมาณ</Typography>
          <Divider sx={{ mb: 2.5 }} />

          <Grid container spacing={2.5}>

            {/* เงินเดือน (Gross) */}
            <Grid item xs={12}>
              <TextField
                label="เงินเดือน (บาท)" fullWidth type="number"
                value={form.Salary} onChange={set('Salary')}
                error={!!errors.Salary} helperText={errors.Salary}
                // InputProps → เพิ่ม ฿ ด้านหน้า input
                InputProps={{ startAdornment: <InputAdornment position="start">฿</InputAdornment> }}
                inputProps={{ min: 0, step: '0.01' }}
              />
            </Grid>

            {/* หัวข้อ รายการหัก */}
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary" mb={1}>
                รายการหัก (หักก่อนคำนวณ 50/30/20)
              </Typography>
            </Grid>

            {/* ประกันสังคม */}
            <Grid item xs={12} sm={4}>
              <TextField
                label="ประกันสังคม (บาท)" fullWidth type="number"
                value={form.SocialSecurity} onChange={set('SocialSecurity')}
                error={!!errors.SocialSecurity} helperText={errors.SocialSecurity}
                InputProps={{ startAdornment: <InputAdornment position="start">฿</InputAdornment> }}
                inputProps={{ min: 0, step: '0.01' }}
              />
            </Grid>
            {/* กยศ. */}
            <Grid item xs={12} sm={4}>
              <TextField
                label="กยศ. (บาท)" fullWidth type="number"
                value={form.StudentLoan} onChange={set('StudentLoan')}
                error={!!errors.StudentLoan} helperText={errors.StudentLoan}
                InputProps={{ startAdornment: <InputAdornment position="start">฿</InputAdornment> }}
                inputProps={{ min: 0, step: '0.01' }}
              />
            </Grid>
            {/* อื่นๆ */}
            <Grid item xs={12} sm={4}>
              <TextField
                label="อื่นๆ (บาท)" fullWidth type="number"
                value={form.OtherDeductions} onChange={set('OtherDeductions')}
                error={!!errors.OtherDeductions} helperText={errors.OtherDeductions}
                InputProps={{ startAdornment: <InputAdornment position="start">฿</InputAdornment> }}
                inputProps={{ min: 0, step: '0.01' }}
              />
            </Grid>

            {/* กล่องแสดงเงินเดือนสุทธิ Live */}
            <Grid item xs={12}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  // เขียวเมื่อ netSalary > 0, แดงเมื่อ ≤ 0 (หักเกินเงินเดือน)
                  bgcolor: netSalary > 0 ? '#E8F5E9' : '#FFEBEE',
                  border: '1px solid',
                  borderColor: netSalary > 0 ? 'success.light' : 'error.light',
                }}
              >
                <Grid container alignItems="center" spacing={1}>
                  <Grid item xs={12} sm={6}>
                    <Box display="flex" gap={2} flexWrap="wrap">
                      <Box>
                        <Typography variant="caption" color="text.secondary">เงินเดือน</Typography>
                        <Typography variant="body2" fontWeight={600}>฿{formatCurrency(salary)}</Typography>
                      </Box>
                      {totalDed > 0 && (
                        <Box>
                          <Typography variant="caption" color="text.secondary">หักรวม</Typography>
                          <Typography variant="body2" fontWeight={600} color="error.main">
                            -฿{formatCurrency(totalDed)}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} textAlign={{ sm: 'right' }}>
                    <Typography variant="caption" color="text.secondary">เงินเดือนสุทธิ</Typography>
                    <Typography variant="h6" fontWeight={700} color={netSalary > 0 ? 'success.main' : 'error.main'}>
                      ฿{formatCurrency(netSalary)}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
              {/* Error ถ้าหักเกินเงินเดือน */}
              {errors._deduction && <Alert severity="error" sx={{ mt: 1 }}>{errors._deduction}</Alert>}
            </Grid>

            {/* หัวข้อ สัดส่วน */}
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary" mb={1}>
                สัดส่วนงบประมาณจากเงินเดือนสุทธิ (รวมต้องได้ 100%)
              </Typography>
            </Grid>

            {/* หนี้/ผ่อน % — helperText แสดงยอดเงินตามสัดส่วน (live) */}
            <Grid item xs={12} sm={4}>
              <TextField
                label="หนี้/ผ่อน (%)" fullWidth type="number"
                value={form.DebtPercent} onChange={set('DebtPercent')}
                error={!!errors.DebtPercent}
                helperText={netSalary > 0 ? `฿${formatCurrency(netSalary * debtPct / 100)}` : ''}
                InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                inputProps={{ min: 0, max: 100, step: '0.5' }}
              />
            </Grid>
            {/* ประจำวัน % */}
            <Grid item xs={12} sm={4}>
              <TextField
                label="ประจำวัน (%)" fullWidth type="number"
                value={form.DailyExpensePercent} onChange={set('DailyExpensePercent')}
                error={!!errors.DailyExpensePercent}
                helperText={netSalary > 0 ? `฿${formatCurrency(netSalary * dailyPct / 100)}` : ''}
                InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                inputProps={{ min: 0, max: 100, step: '0.5' }}
              />
            </Grid>
            {/* เงินเก็บ % */}
            <Grid item xs={12} sm={4}>
              <TextField
                label="เงินเก็บ (%)" fullWidth type="number"
                value={form.SavingsPercent} onChange={set('SavingsPercent')}
                error={!!errors.SavingsPercent}
                helperText={netSalary > 0 ? `฿${formatCurrency(netSalary * savingsPct / 100)}` : ''}
                InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                inputProps={{ min: 0, max: 100, step: '0.5' }}
              />
            </Grid>

            {/* ตัวบอกผลรวมสัดส่วน — เขียวถ้า =100%, แดงถ้าไม่ใช่ */}
            <Grid item xs={12}>
              <Box
                sx={{
                  p: 1.5, borderRadius: 2,
                  bgcolor: Math.abs(totalPct - 100) < 0.01 ? 'success.light' : 'error.light',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}
              >
                <Typography variant="body2" fontWeight={600}>
                  {Math.abs(totalPct - 100) < 0.01
                    ? `✓ สัดส่วนรวม 100%`
                    : `⚠ สัดส่วนรวม ${totalPct.toFixed(2)}%`}
                </Typography>
                {netSalary > 0 && (
                  <Typography variant="body2">
                    รวม ฿{formatCurrency(netSalary * totalPct / 100)} / ฿{formatCurrency(netSalary)}
                  </Typography>
                )}
              </Box>
              {errors._total && <Alert severity="error" sx={{ mt: 1 }}>{errors._total}</Alert>}
            </Grid>

            {/* ปุ่มบันทึก */}
            <Grid item xs={12}>
              <Button
                variant="contained" size="large" fullWidth
                startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                onClick={handleSave} disabled={saving}
              >
                บันทึกงบประมาณ
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Snackbar แจ้งผลการบันทึก */}
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
