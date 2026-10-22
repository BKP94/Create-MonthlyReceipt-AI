// ========================================================
// Dashboard.jsx — หน้าแดชบอร์ดสรุปภาพรวมการเงิน
// Hallmark · genre: editorial · macrostructure: stat-led · design-system: design.md · designed-as-app
// โหลดข้อมูลจาก GET /api/dashboard?year=...&month=...
// แสดง:
//   - ตัวเลขใหญ่ "คงเหลือเดือนนี้" + สมการ รายได้ − รายจ่าย = คงเหลือ
//   - แถวตัวเลขรอง (งบหนี้, งบประจำวัน, เป้าเงินเก็บ, ยอดผ่อน)
//   - การใช้งบแต่ละหมวด
//   - BarChart แนวโน้ม 6 เดือน
//   - ตารางรายการผ่อนที่ยังค้างอยู่
// ========================================================

import { useState, useEffect, useCallback } from 'react';
import {
  Alert, Box, CircularProgress, LinearProgress, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Typography,
} from '@mui/material';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { dashboardApi } from '../api/financeApi';
import MonthSelector from '../components/MonthSelector';
import MobileDataCard, { MobileDataList } from '../components/MobileDataCard';
import PageHeader from '../components/PageHeader';
import Section from '../components/Section';
import useIsMobile from '../hooks/useIsMobile';
import { useTheme } from '@mui/material/styles';
import { fonts, num } from '../theme';
import { formatCurrency, formatCurrencyShort, thaiShortMonths, thaiFullMonths } from '../utils/formatters';

// =====================================================
// Figure — ตัวเลขรองหนึ่งช่องในแถบตัวเลข (label / ยอด / คำอธิบาย)
// =====================================================
const Figure = ({ label, amount, note, color = 'text.primary' }) => (
  <Box sx={{ py: 2, px: { xs: 0, md: 2.5 }, minWidth: 0 }}>
    <Typography variant="body2" color="text.secondary">{label}</Typography>
    <Typography sx={{ ...num, fontSize: { xs: 20, md: 22 }, fontWeight: 500, mt: 0.5 }} color={color} noWrap>
      ฿{formatCurrency(amount)}
    </Typography>
    {note && <Typography variant="caption" color="text.secondary">{note}</Typography>}
  </Box>
);

// =====================================================
// EquationRow — หนึ่งบรรทัดของสมการ รายได้ − รายจ่าย = คงเหลือ
// =====================================================
const EquationRow = ({ label, value, color = 'text.primary', strong, total }) => (
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'space-between',
      gap: 2,
      py: 1,
      // บรรทัดยอดรวม — เส้นคู่ใต้ตัวเลข แบบสมุดบัญชี
      ...(total && { borderTop: 1, borderColor: 'ledger.ruleStrong', mt: 0.5 }),
    }}
  >
    <Typography variant="body2" color={strong ? 'text.primary' : 'text.secondary'} fontWeight={strong ? 600 : 400}>
      {label}
    </Typography>
    <Typography
      sx={{
        ...num,
        fontSize: 15,
        fontWeight: strong ? 600 : 400,
        ...(total && { borderBottom: '3px double', borderColor: 'ledger.ink', pb: 0.25 }),
      }}
      color={color}
    >
      {value}
    </Typography>
  </Box>
);

// =====================================================
// BudgetProgress — แถบการใช้งบของหนึ่งหมวด
// Props: label, used (ใช้ไปแล้ว), budget (งบที่ตั้งไว้)
// =====================================================
const BudgetProgress = ({ label, used, budget }) => {
  // คำนวณ % การใช้งบ — Math.min ป้องกันเกิน 100%
  const pct = budget > 0 ? Math.min((used / budget) * 100, 100) : 0;
  const over = used > budget; // เกินงบหรือเปล่า
  const near = !over && pct >= 85;
  const tone = over ? 'error' : near ? 'warning' : 'primary';
  return (
    <Box sx={{ py: 2, borderBottom: 1, borderColor: 'divider' }}>
      <Box display="flex" justifyContent="space-between" alignItems="baseline" gap={2} mb={1} flexWrap="wrap">
        <Typography variant="body1" fontWeight={500}>{label}</Typography>
        <Typography sx={{ ...num, fontSize: 15 }}>
          ฿{formatCurrency(used)} <Box component="span" color="text.secondary">/ ฿{formatCurrency(budget)}</Box>
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={pct}
        color={tone}
        aria-label={`${label} ใช้ไป ${pct.toFixed(0)}%`}
        sx={{ height: 4 }}
      />
      <Typography variant="caption" color={over ? 'error.main' : near ? 'warning.main' : 'text.secondary'} sx={{ display: 'block', mt: 0.75 }}>
        {over ? `เกินงบ ฿${formatCurrency(used - budget)}` : `คงเหลือ ฿${formatCurrency(budget - used)}`}
        {' · '}{pct.toFixed(1)}%
      </Typography>
    </Box>
  );
};

// =====================================================
// CustomTooltip — Tooltip แบบกำหนดเองสำหรับ BarChart
// =====================================================
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <Paper sx={{ p: 1.5, border: 1, borderColor: 'divider' }}>
      <Typography variant="body2" fontWeight={600}>{label}</Typography>
      <Typography sx={{ ...num, fontSize: 14 }}>฿{formatCurrency(payload[0].value)}</Typography>
    </Paper>
  );
};

// ProgressCell — แถบความคืบหน้าการผ่อน + %
const ProgressCell = ({ pct }) => (
  <Box display="flex" alignItems="center" gap={1}>
    <LinearProgress variant="determinate" value={pct} sx={{ flexGrow: 1, height: 4 }} aria-label={`ชำระแล้ว ${pct.toFixed(0)}%`} />
    <Typography variant="caption" sx={{ ...num, minWidth: 36, textAlign: 'right' }}>{pct.toFixed(0)}%</Typography>
  </Box>
);

// =====================================================
// Dashboard — Component หลักของหน้าแดชบอร์ด
// =====================================================
export default function Dashboard() {
  const isMobile = useIsMobile();
  // ค่าสีจริงของโหมดปัจจุบัน — recharts รับ path แบบ 'ledger.x' ไม่ได้
  const { ledger } = useTheme().palette;
  const now = new Date();
  // state ปี/เดือนที่กำลังดูอยู่ — เริ่มต้นที่เดือนปัจจุบัน
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1); // getMonth() = 0-11 จึงต้อง +1
  const [data, setData] = useState(null);       // ข้อมูล DashboardSummary จาก API
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // fetchData — ดึงข้อมูลจาก API ใหม่เมื่อ year/month เปลี่ยน
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await dashboardApi.get(year, month);
      setData(res.data);
    } catch {
      setError('โหลดข้อมูลไม่ได้ — ตรวจว่า service FinanceApi ทำงานอยู่ และเครื่องนี้ต่อ Tailscale แล้ว');
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleMonthChange = (y, m) => { setYear(y); setMonth(m); };

  // แปลงข้อมูล MonthlyTrend เป็นรูปแบบที่ recharts ต้องการ
  // แท่งของเดือนที่กำลังดูเป็นสี accent ที่เหลือเป็นสีเส้นเข้ม
  const chartData = data?.MonthlyTrend?.map((t) => ({
    name: `${thaiShortMonths[t.MonthNumber]} ${String(t.Year + 543).slice(-2)}`,
    รายจ่าย: t.TotalExpenses,
    fill: t.MonthNumber === month && t.Year === year ? ledger.accent : ledger.ruleStrong,
  })) ?? [];

  const remaining = data ? data.Remaining : 0;
  const positive = remaining >= 0;

  return (
    <Box>
      <PageHeader
        title="แดชบอร์ด"
        description={`ภาพรวมเดือน${thaiFullMonths[month]} ${year + 543}`}
        actions={<MonthSelector year={year} month={month} onChange={handleMonthChange} />}
      />

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {loading ? (
        <Box display="flex" justifyContent="center" py={8}>
          <CircularProgress aria-label="กำลังโหลด" />
        </Box>
      ) : !data ? null : (
        <>
          {/* ── ตัวเลขหลัก: คงเหลือเดือนนี้ ── */}
          <Box
            component="section"
            aria-labelledby="remaining-label"
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'minmax(0, 1.3fr) minmax(0, 1fr)' },
              gap: { xs: 3, md: 6 },
              alignItems: 'end',
              mb: 4,
            }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography id="remaining-label" variant="body1" color="text.secondary">
                คงเหลือเดือนนี้
              </Typography>
              <Typography
                sx={{
                  ...num,
                  fontSize: { xs: 40, sm: 52, md: 60 },
                  fontWeight: 500,
                  lineHeight: 1.1,
                  letterSpacing: '-0.02em',
                  mt: 0.5,
                  overflowWrap: 'anywhere',
                }}
                color={positive ? 'text.primary' : 'error.main'}
              >
                {positive ? '' : '−'}฿{formatCurrency(Math.abs(remaining))}
              </Typography>
              <Typography variant="body2" color={positive ? 'success.main' : 'error.main'} sx={{ mt: 1, fontWeight: 500 }}>
                {positive ? 'รายได้พอกับรายจ่ายเดือนนี้' : 'รายจ่ายเกินรายได้เดือนนี้'}
              </Typography>
            </Box>

            {/* สมการ รายได้ − รายจ่าย = คงเหลือ */}
            <Box sx={{ minWidth: 0 }}>
              <EquationRow label="เงินเดือนสุทธิ" value={`฿${formatCurrency(data.Salary)}`} />
              <EquationRow
                label={`รายจ่ายรวม · ${data.CurrentMonthExpenses?.length ?? 0} รายการ`}
                value={`−฿${formatCurrency(data.TotalExpenses)}`}
              />
              <EquationRow
                label="คงเหลือ"
                value={`${positive ? '' : '−'}฿${formatCurrency(Math.abs(remaining))}`}
                color={positive ? 'text.primary' : 'error.main'}
                strong
                total
              />
            </Box>
          </Box>

          {/* ── แถวตัวเลขรอง — คั่นด้วยเส้นแนวตั้งบน desktop ── */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', md: 'repeat(4, minmax(0, 1fr))' },
              columnGap: { xs: 2, md: 0 },
              borderTop: 1,
              borderBottom: 1,
              borderColor: 'divider',
              mb: 5,
              '& > *:not(:first-of-type)': { borderLeft: { md: 1 }, borderColor: { md: 'divider' } },
            }}
          >
            <Figure label="งบหนี้/ผ่อน · 50%" amount={data.DebtBudget} note={`ใช้ไป ฿${formatCurrency(data.TotalDebtExpenses)}`} />
            <Figure label="งบประจำวัน · 30%" amount={data.DailyBudget} note={`ใช้ไป ฿${formatCurrency(data.TotalDailyExpenses)}`} />
            <Figure label="เป้าเงินเก็บ · 20%" amount={data.SavingsBudget} note="เป้าหมายต่อเดือน" color="success.main" />
            <Figure
              label="ผ่อนชำระเดือนนี้"
              amount={data.TotalInstallmentsMonthly}
              note={`${data.ActiveInstallments?.length ?? 0} รายการที่ยังผ่อนอยู่`}
            />
          </Box>

          {/* ── การใช้งบ + แนวโน้ม ── */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'minmax(0, 1fr) minmax(0, 1.4fr)' },
              gap: { xs: 0, md: 6 },
            }}
          >
            <Section title="การใช้งบเดือนนี้">
              <Box sx={{ borderTop: 1, borderColor: 'ledger.ruleStrong' }}>
                <BudgetProgress label="หนี้/ผ่อน" used={data.TotalDebtExpenses} budget={data.DebtBudget} />
                <BudgetProgress label="ประจำวัน" used={data.TotalDailyExpenses} budget={data.DailyBudget} />
              </Box>
            </Section>

            <Section title="แนวโน้มรายจ่าย 6 เดือน">
              {chartData.every((d) => d.รายจ่าย === 0) ? (
                <Box py={4} sx={{ borderTop: 1, borderColor: 'ledger.ruleStrong' }}>
                  <Typography color="text.secondary">ยังไม่มีข้อมูลรายจ่ายในช่วงนี้</Typography>
                </Box>
              ) : (
                <Box sx={{ borderTop: 1, borderColor: 'ledger.ruleStrong', pt: 2 }}>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={chartData} margin={{ top: 5, right: 4, left: 0, bottom: 0 }}>
                      <CartesianGrid vertical={false} stroke={ledger.rule} />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 12, fontFamily: fonts.body, fill: ledger.muted }}
                        axisLine={{ stroke: ledger.ruleStrong }}
                        tickLine={false}
                      />
                      <YAxis
                        tickFormatter={formatCurrencyShort}
                        tick={{ fontSize: 12, fontFamily: fonts.mono, fill: ledger.muted }}
                        axisLine={false}
                        tickLine={false}
                        width={52}
                      />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: ledger.paper2 }} />
                      <Bar dataKey="รายจ่าย" radius={[2, 2, 0, 0]} maxBarSize={44}>
                        {chartData.map((entry, index) => (
                          <Cell key={index} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              )}
            </Section>
          </Box>

          {/* ── ตารางรายการผ่อนที่ยังค้างอยู่ (แสดงเมื่อมีข้อมูล) ── */}
          {(data.ActiveInstallments?.length ?? 0) > 0 && (
            <Section title="รายการผ่อนที่ยังค้างอยู่" aside={`${data.ActiveInstallments.length} รายการ`} sx={{ mb: 0 }}>
              {isMobile ? (
                <MobileDataList>
                  {data.ActiveInstallments.map((inst) => {
                    const pct = inst.TotalInstallments > 0
                      ? (inst.PaidInstallments / inst.TotalInstallments) * 100 : 0;
                    return (
                      <MobileDataCard
                        key={inst.Id}
                        title={inst.Name}
                        amount={`฿${formatCurrency(inst.MonthlyAmount)}`}
                        rows={[
                          { label: 'งวด (ชำระ/รวม)', value: `${inst.PaidInstallments}/${inst.TotalInstallments}` },
                          { label: 'ยอดคงเหลือ', value: `฿${formatCurrency(inst.RemainingAmount)}` },
                        ]}
                        footer={<ProgressCell pct={pct} />}
                      />
                    );
                  })}
                </MobileDataList>
              ) : (
                <TableContainer sx={{ borderTop: 1, borderColor: 'ledger.ruleStrong' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>ชื่อรายการ</TableCell>
                        <TableCell align="center">งวด (ชำระ/รวม)</TableCell>
                        <TableCell align="right">ต่องวด</TableCell>
                        <TableCell align="right">ยอดคงเหลือ</TableCell>
                        <TableCell sx={{ width: 200 }}>ความคืบหน้า</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data.ActiveInstallments.map((inst) => {
                        const pct = inst.TotalInstallments > 0
                          ? (inst.PaidInstallments / inst.TotalInstallments) * 100 : 0;
                        return (
                          <TableRow key={inst.Id} hover>
                            <TableCell>{inst.Name}</TableCell>
                            <TableCell align="center" sx={num}>
                              {inst.PaidInstallments}/{inst.TotalInstallments}
                            </TableCell>
                            <TableCell align="right" sx={num}>฿{formatCurrency(inst.MonthlyAmount)}</TableCell>
                            <TableCell align="right" sx={num}>฿{formatCurrency(inst.RemainingAmount)}</TableCell>
                            <TableCell><ProgressCell pct={pct} /></TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Section>
          )}
        </>
      )}
    </Box>
  );
}
