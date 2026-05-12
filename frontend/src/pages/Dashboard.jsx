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
import { formatCurrency, formatCurrencyShort, thaiShortMonths } from '../utils/formatters';

const StatCard = ({ title, amount, subtitle, icon, color = 'primary.main', bgColor }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent sx={{ p: 2.5 }}>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
        <Box flex={1}>
          <Typography variant="body2" color="text.secondary" mb={0.5}>{title}</Typography>
          <Typography variant="h5" fontWeight={700} color={color} noWrap>
            ฿{formatCurrency(amount)}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color="text.secondary">{subtitle}</Typography>
          )}
        </Box>
        <Box
          sx={{
            bgcolor: bgColor || `${color}22`,
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

const BudgetProgress = ({ label, used, budget, color }) => {
  const pct = budget > 0 ? Math.min((used / budget) * 100, 100) : 0;
  const over = used > budget;
  return (
    <Box mb={1.5}>
      <Box display="flex" justifyContent="space-between" mb={0.5}>
        <Typography variant="body2">{label}</Typography>
        <Typography variant="body2" fontWeight={600} color={over ? 'error.main' : 'text.primary'}>
          ฿{formatCurrency(used)} / ฿{formatCurrency(budget)}
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={pct}
        color={over ? 'error' : color}
        sx={{ height: 8, borderRadius: 4 }}
      />
      <Typography variant="caption" color={over ? 'error.main' : 'text.secondary'}>
        {over ? `เกินงบ ฿${formatCurrency(used - budget)}` : `คงเหลือ ฿${formatCurrency(budget - used)}`}
        {' '}({pct.toFixed(1)}%)
      </Typography>
    </Box>
  );
};

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

const CHART_COLORS = ['#90CAF9', '#64B5F6', '#42A5F5', '#2196F3', '#1E88E5', '#1565C0'];

export default function Dashboard() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
  }, [year, month]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleMonthChange = (y, m) => { setYear(y); setMonth(m); };

  const chartData = data?.MonthlyTrend?.map((t, i) => ({
    name: `${thaiShortMonths[t.MonthNumber]} ${String(t.Year + 543).slice(-2)}`,
    รายจ่าย: t.TotalExpenses,
    fill: CHART_COLORS[i] ?? '#1565C0',
  })) ?? [];

  const remaining = data ? data.Remaining : 0;

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2} mb={3}>
        <Typography variant="h5">แดชบอร์ด</Typography>
        <MonthSelector year={year} month={month} onChange={handleMonthChange} />
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>
      ) : !data ? null : (
        <Grid container spacing={2.5}>

          {/* Row 1 – Budget overview */}
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

          {/* Row 2 – Month summary */}
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

          <Grid item xs={12} sm={6} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="subtitle1" fontWeight={600} mb={1.5}>
                  เงินคงเหลือ
                </Typography>
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
                {data.ActiveInstallments?.slice(0, 3).map((inst) => (
                  <Box key={inst.Id} display="flex" justifyContent="space-between" mb={0.5}>
                    <Typography variant="body2" noWrap sx={{ maxWidth: '65%' }}>{inst.Name}</Typography>
                    <Typography variant="body2" fontWeight={600}>฿{formatCurrency(inst.MonthlyAmount)}</Typography>
                  </Box>
                ))}
                {(data.ActiveInstallments?.length ?? 0) > 3 && (
                  <Typography variant="caption" color="text.secondary">
                    +{data.ActiveInstallments.length - 3} รายการอื่น
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Row 3 – Chart */}
          <Grid item xs={12}>
            <Card>
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="subtitle1" fontWeight={600} mb={2}>
                  แนวโน้มรายจ่าย 6 เดือนล่าสุด
                </Typography>
                {chartData.every((d) => d.รายจ่าย === 0) ? (
                  <Box py={4} textAlign="center">
                    <Typography color="text.secondary">ยังไม่มีข้อมูลรายจ่าย</Typography>
                  </Box>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 13, fontFamily: 'Sarabun' }} />
                      <YAxis
                        tickFormatter={formatCurrencyShort}
                        tick={{ fontSize: 12 }}
                        width={60}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="รายจ่าย" radius={[6, 6, 0, 0]} maxBarSize={60}>
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

          {/* Row 4 – Active Installments */}
          {(data.ActiveInstallments?.length ?? 0) > 0 && (
            <Grid item xs={12}>
              <Card>
                <CardContent sx={{ p: 2.5 }}>
                  <Typography variant="subtitle1" fontWeight={600} mb={2}>
                    รายการผ่อนที่ยังค้างอยู่
                  </Typography>
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
                </CardContent>
              </Card>
            </Grid>
          )}

        </Grid>
      )}
    </Box>
  );
}
