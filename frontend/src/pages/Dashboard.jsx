// ========================================================
// Dashboard.jsx — หน้าแดชบอร์ดสรุปภาพรวมการเงิน
// โหลดข้อมูลจาก GET /api/dashboard?year=...&month=...
// แสดง:
//   - StatCard 4 ใบ (เงินเดือนสุทธิ, งบหนี้, งบประจำวัน, งบเก็บ)
//   - สรุปรายจ่าย + Progress Bar การใช้งบ
//   - เงินคงเหลือ
//   - ยอดผ่อนชำระ
//   - BarChart แนวโน้ม 6 เดือน
//   - ตารางรายการผ่อนที่ยังค้างอยู่
// ========================================================

import { useState, useEffect, useCallback } from 'react';
import {
  Alert, Box, Card, CardContent, Chip, CircularProgress,
  Grid, LinearProgress, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Typography,
} from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import SavingsIcon from '@mui/icons-material/Savings';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { dashboardApi } from '../api/financeApi';
import MonthSelector from '../components/MonthSelector';
import MobileDataCard from '../components/MobileDataCard';
import useIsMobile from '../hooks/useIsMobile';
import { formatCurrency, formatCurrencyShort, thaiShortMonths } from '../utils/formatters';

// =====================================================
// StatCard — Component การ์ดแสดงตัวเลขสรุป (ใช้ 4 ใบด้านบน)
// Props: title, amount, subtitle, icon, color, bgColor
// =====================================================
const StatCard = ({ title, amount, subtitle, icon, color = 'primary.main', bgColor }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent sx={{ p: 2.5 }}>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
        <Box flex={1}>
          {/* ชื่อหัวการ์ด */}
          <Typography variant="body2" color="text.secondary" mb={0.5}>{title}</Typography>
          {/* ตัวเลขหลัก */}
          <Typography variant="h5" fontWeight={700} color={color} noWrap>
            ฿{formatCurrency(amount)}
          </Typography>
          {/* คำอธิบายเพิ่มเติม */}
          {subtitle && (
            <Typography variant="caption" color="text.secondary">{subtitle}</Typography>
          )}
        </Box>
        {/* ไอคอนด้านขวา — มีพื้นสีอ่อนๆ */}
        <Box
          sx={{
            bgcolor: bgColor || `${color}22`, // 22 = opacity 13% ใน hex
            borderRadius: 2,
            p: 1,
            display: 'flex',
            alignItems: 'center',
            ml: 1,
          }}
        >
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

// =====================================================
// BudgetProgress — Component แสดง Progress Bar การใช้งบ
// Props: label, used (ใช้ไปแล้ว), budget (งบที่ตั้งไว้), color
// =====================================================
const BudgetProgress = ({ label, used, budget, color }) => {
  // คำนวณ % การใช้งบ — Math.min ป้องกันเกิน 100%
  const pct = budget > 0 ? Math.min((used / budget) * 100, 100) : 0;
  const over = used > budget; // เกินงบหรือเปล่า
  return (
    <Box mb={1.5}>
      <Box display="flex" justifyContent="space-between" mb={0.5}>
        <Typography variant="body2">{label}</Typography>
        {/* ตัวเลขใช้ไป/งบรวม — สีแดงถ้าเกิน */}
        <Typography variant="body2" fontWeight={600} color={over ? 'error.main' : 'text.primary'}>
          ฿{formatCurrency(used)} / ฿{formatCurrency(budget)}
        </Typography>
      </Box>
      {/* Progress Bar — เปลี่ยนเป็น error (แดง) เมื่อเกินงบ */}
      <LinearProgress
        variant="determinate"
        value={pct}
        color={over ? 'error' : color}
        sx={{ height: 8, borderRadius: 4 }}
      />
      {/* ข้อความใต้ bar */}
      <Typography variant="caption" color={over ? 'error.main' : 'text.secondary'}>
        {over ? `เกินงบ ฿${formatCurrency(used - budget)}` : `คงเหลือ ฿${formatCurrency(budget - used)}`}
        {' '}({pct.toFixed(1)}%)
      </Typography>
    </Box>
  );
};

// =====================================================
// CustomTooltip — Tooltip แบบกำหนดเองสำหรับ BarChart
// recharts จะส่ง active, payload, label มาให้อัตโนมัติ
// =====================================================
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <Paper sx={{ p: 1.5 }}>
      <Typography variant="body2" fontWeight={600}>{label}</Typography>
      <Typography variant="body2" color="primary.main">
        ฿{formatCurrency(payload[0].value)}
      </Typography>
    </Paper>
  );
};

// สีแท่ง BarChart — ไล่จากอ่อนไปเข้ม (เดือนเก่า → ปัจจุบัน)
const CHART_COLORS = ['#90CAF9', '#64B5F6', '#42A5F5', '#2196F3', '#1E88E5', '#1565C0'];

// =====================================================
// Dashboard — Component หลักของหน้าแดชบอร์ด
// =====================================================
export default function Dashboard() {
  const isMobile = useIsMobile();
  const now = new Date();
  // state ปี/เดือนที่กำลังดูอยู่ — เริ่มต้นที่เดือนปัจจุบัน
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1); // getMonth() = 0-11 จึงต้อง +1
  const [data, setData] = useState(null);       // ข้อมูล DashboardSummary จาก API
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // fetchData — ดึงข้อมูลจาก API ใหม่เมื่อ year/month เปลี่ยน
  // useCallback → memorize function ไม่ให้สร้างใหม่ทุก render (เพิ่ม performance)
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await dashboardApi.get(year, month);
      setData(res.data);
    } catch {
      setError('ไม่สามารถโหลดข้อมูลได้ กรุณาตรวจสอบว่า Backend รันอยู่ที่ port 5000');
    } finally {
      setLoading(false);
    }
  }, [year, month]); // dependency array → รัน fetchData ใหม่เมื่อ year หรือ month เปลี่ยน

  // useEffect → เรียก fetchData ครั้งแรก และทุกครั้งที่ fetchData เปลี่ยน
  useEffect(() => { fetchData(); }, [fetchData]);

  const handleMonthChange = (y, m) => { setYear(y); setMonth(m); };

  // แปลงข้อมูล MonthlyTrend เป็นรูปแบบที่ recharts ต้องการ
  // name: ชื่อเดือนย่อ เช่น "พ.ค. 69"  |  รายจ่าย: ยอดรวม  |  fill: สีแท่ง
  const chartData = data?.MonthlyTrend?.map((t, i) => ({
    name: `${thaiShortMonths[t.MonthNumber]} ${String(t.Year + 543).slice(-2)}`,
    รายจ่าย: t.TotalExpenses,
    fill: CHART_COLORS[i] ?? '#1565C0',
  })) ?? [];

  const remaining = data ? data.Remaining : 0;

  return (
    <Box>
      {/* Header — ชื่อหน้า + ตัวเลือกเดือน */}
      <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2} mb={3}>
        <Typography variant="h5">แดชบอร์ด</Typography>
        <MonthSelector year={year} month={month} onChange={handleMonthChange} />
      </Box>

      {/* แสดง error ถ้า backend ไม่ตอบ */}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        // Loading spinner
        <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>
      ) : !data ? null : (
        <Grid container spacing={2.5}>

          {/* แถวที่ 1 — StatCard 4 ใบ */}
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="เงินเดือนสุทธิ"
              amount={data.Salary}
              subtitle="หลังหักประกันสังคม/กยศ."
              icon={<AccountBalanceWalletIcon sx={{ color: 'primary.main' }} />}
              color="primary.main"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="งบหนี้/ผ่อน (50%)"
              amount={data.DebtBudget}
              subtitle={`ใช้ไป ฿${formatCurrency(data.TotalDebtExpenses)}`}
              icon={<CreditCardIcon sx={{ color: 'error.main' }} />}
              color="error.main"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="งบประจำวัน (30%)"
              amount={data.DailyBudget}
              subtitle={`ใช้ไป ฿${formatCurrency(data.TotalDailyExpenses)}`}
              icon={<ShoppingCartIcon sx={{ color: 'warning.main' }} />}
              color="warning.main"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="เป้าเงินเก็บ (20%)"
              amount={data.SavingsBudget}
              subtitle="เป้าหมายต่อเดือน"
              icon={<SavingsIcon sx={{ color: 'success.main' }} />}
              color="success.main"
            />
          </Grid>

          {/* แถวที่ 2 — สรุปรายจ่าย, เงินคงเหลือ, ยอดผ่อน */}
          <Grid item xs={12} sm={6} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="subtitle1" fontWeight={600} mb={1.5}>
                  สรุปรายจ่ายเดือนนี้
                </Typography>
                <Typography variant="h4" fontWeight={700} color="error.main" mb={0.5}>
                  ฿{formatCurrency(data.TotalExpenses)}
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={2}>
                  รวมทั้งสิ้น {data.CurrentMonthExpenses?.length ?? 0} รายการ
                </Typography>
                {/* Progress Bar ของแต่ละหมวด */}
                <BudgetProgress
                  label="หนี้/ผ่อน"
                  used={data.TotalDebtExpenses}
                  budget={data.DebtBudget}
                  color="error"
                />
                <BudgetProgress
                  label="ประจำวัน"
                  used={data.TotalDailyExpenses}
                  budget={data.DailyBudget}
                  color="warning"
                />
              </CardContent>
            </Card>
          </Grid>

          {/* เงินคงเหลือ */}
          <Grid item xs={12} sm={6} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="subtitle1" fontWeight={600} mb={1.5}>
                  เงินคงเหลือ
                </Typography>
                {/* สีเขียวถ้าเหลือ, แดงถ้าขาด */}
                <Typography
                  variant="h4"
                  fontWeight={700}
                  color={remaining >= 0 ? 'success.main' : 'error.main'}
                  mb={0.5}
                >
                  {remaining < 0 ? '-' : ''}฿{formatCurrency(Math.abs(remaining))}
                </Typography>
                <Chip
                  label={remaining >= 0 ? 'เงินพอใช้' : 'เงินไม่พอ!'}
                  color={remaining >= 0 ? 'success' : 'error'}
                  size="small"
                  sx={{ mb: 2 }}
                />
                {/* ตาราง รายได้ - รายจ่าย = คงเหลือ */}
                <Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">รายได้</Typography>
                    <Typography variant="body2" fontWeight={600}>฿{formatCurrency(data.Salary)}</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">รายจ่ายรวม</Typography>
                    <Typography variant="body2" fontWeight={600} color="error.main">
                      -฿{formatCurrency(data.TotalExpenses)}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" mt={0.5} pt={0.5} borderTop="1px solid #eee">
                    <Typography variant="body2" fontWeight={600}>คงเหลือ</Typography>
                    <Typography variant="body2" fontWeight={700} color={remaining >= 0 ? 'success.main' : 'error.main'}>
                      ฿{formatCurrency(remaining)}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* ยอดผ่อนชำระเดือนนี้ */}
          <Grid item xs={12} sm={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="subtitle1" fontWeight={600} mb={1.5}>
                  ยอดผ่อนชำระเดือนนี้
                </Typography>
                <Typography variant="h4" fontWeight={700} color="primary.main" mb={0.5}>
                  ฿{formatCurrency(data.TotalInstallmentsMonthly)}
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={1.5}>
                  {data.ActiveInstallments?.length ?? 0} รายการที่ยังผ่อนอยู่
                </Typography>
                {/* แสดงรายการผ่อน 3 รายการแรก */}
                {data.ActiveInstallments?.slice(0, 3).map((inst) => (
                  <Box key={inst.Id} display="flex" justifyContent="space-between" mb={0.5}>
                    <Typography variant="body2" noWrap sx={{ maxWidth: '65%' }}>{inst.Name}</Typography>
                    <Typography variant="body2" fontWeight={600}>฿{formatCurrency(inst.MonthlyAmount)}</Typography>
                  </Box>
                ))}
                {/* ถ้ามีมากกว่า 3 รายการ แสดงข้อความ "+N รายการอื่น" */}
                {(data.ActiveInstallments?.length ?? 0) > 3 && (
                  <Typography variant="caption" color="text.secondary">
                    +{data.ActiveInstallments.length - 3} รายการอื่น
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* แถวที่ 3 — BarChart แนวโน้ม 6 เดือน */}
          <Grid item xs={12}>
            <Card>
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="subtitle1" fontWeight={600} mb={2}>
                  แนวโน้มรายจ่าย 6 เดือนล่าสุด
                </Typography>
                {/* ถ้าทุกเดือนเป็น 0 แสดงข้อความแทน chart */}
                {chartData.every((d) => d.รายจ่าย === 0) ? (
                  <Box py={4} textAlign="center">
                    <Typography color="text.secondary">ยังไม่มีข้อมูลรายจ่าย</Typography>
                  </Box>
                ) : (
                  // ResponsiveContainer → ปรับขนาด chart ตามขนาด container อัตโนมัติ
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      {/* XAxis → แกนนอน (ชื่อเดือน) */}
                      <XAxis dataKey="name" tick={{ fontSize: 13, fontFamily: 'Sarabun' }} />
                      {/* YAxis → แกนตั้ง (ยอดเงิน) ใช้ formatCurrencyShort ย่อตัวเลข */}
                      <YAxis
                        tickFormatter={formatCurrencyShort}
                        tick={{ fontSize: 12 }}
                        width={60}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      {/* Bar → แท่งกราฟ radius=[6,6,0,0] = มุมบนโค้ง */}
                      <Bar dataKey="รายจ่าย" radius={[6, 6, 0, 0]} maxBarSize={60}>
                        {/* Cell → กำหนดสีแต่ละแท่งแยกกัน */}
                        {chartData.map((entry, index) => (
                          <Cell key={index} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* แถวที่ 4 — ตารางรายการผ่อนที่ยังค้างอยู่ (แสดงเมื่อมีข้อมูล) */}
          {(data.ActiveInstallments?.length ?? 0) > 0 && (
            <Grid item xs={12}>
              <Card>
                <CardContent sx={{ p: 2.5 }}>
                  <Typography variant="subtitle1" fontWeight={600} mb={2}>
                    รายการผ่อนที่ยังค้างอยู่
                  </Typography>
                  {isMobile ? (
                    // ─── มุมมองมือถือ: การ์ดแทนตาราง ───
                    <Box>
                      {data.ActiveInstallments.map((inst) => {
                        const pct = inst.TotalInstallments > 0
                          ? (inst.PaidInstallments / inst.TotalInstallments) * 100 : 0;
                        return (
                          <MobileDataCard
                            key={inst.Id}
                            title={inst.Name}
                            amount={`฿${formatCurrency(inst.MonthlyAmount)}`}
                            rows={[
                              {
                                label: 'งวด (ชำระ/รวม)',
                                value: `${inst.PaidInstallments}/${inst.TotalInstallments}`,
                              },
                              {
                                label: 'คงเหลือ',
                                value: `฿${formatCurrency(inst.RemainingAmount)}`,
                                color: 'error.main',
                              },
                            ]}
                            footer={
                              <Box display="flex" alignItems="center" gap={1}>
                                <LinearProgress
                                  variant="determinate"
                                  value={pct}
                                  sx={{ flexGrow: 1, height: 6, borderRadius: 3 }}
                                  color="primary"
                                />
                                <Typography variant="caption">{pct.toFixed(0)}%</Typography>
                              </Box>
                            }
                          />
                        );
                      })}
                    </Box>
                  ) : (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: '#F5F5F5' } }}>
                          <TableCell>ชื่อรายการ</TableCell>
                          <TableCell align="center">งวด (ชำระ/รวม)</TableCell>
                          <TableCell align="right">ต่องวด</TableCell>
                          <TableCell align="right">คงเหลือ</TableCell>
                          <TableCell>ความคืบหน้า</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {data.ActiveInstallments.map((inst) => {
                          // คำนวณ % ความคืบหน้า
                          const pct = inst.TotalInstallments > 0
                            ? (inst.PaidInstallments / inst.TotalInstallments) * 100 : 0;
                          return (
                            <TableRow key={inst.Id} hover>
                              <TableCell>{inst.Name}</TableCell>
                              <TableCell align="center">
                                {inst.PaidInstallments}/{inst.TotalInstallments}
                              </TableCell>
                              <TableCell align="right">฿{formatCurrency(inst.MonthlyAmount)}</TableCell>
                              <TableCell align="right">฿{formatCurrency(inst.RemainingAmount)}</TableCell>
                              <TableCell sx={{ minWidth: 120 }}>
                                <Box display="flex" alignItems="center" gap={1}>
                                  <LinearProgress
                                    variant="determinate"
                                    value={pct}
                                    sx={{ flexGrow: 1, height: 6, borderRadius: 3 }}
                                    color="primary"
                                  />
                                  <Typography variant="caption">{pct.toFixed(0)}%</Typography>
                                </Box>
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
            </Grid>
          )}

        </Grid>
      )}
    </Box>
  );
}
