// ========================================================
// MonthlySummary.jsx — สรุปรายจ่าย 12 เดือนของปีที่เลือก
// Hallmark · genre: editorial · macrostructure: catalogue · design-system: design.md · designed-as-app
// โหลดข้อมูลจาก GET /api/dashboard/yearly?year=...
// ========================================================

import { useState, useEffect, useCallback } from 'react';
import {
  Alert, Box, CircularProgress, FormControl, InputLabel,
  MenuItem, Select, Typography,
} from '@mui/material';
import { dashboardApi } from '../api/financeApi';
import PageHeader from '../components/PageHeader';
import { num } from '../theme';
import { formatCurrency, thaiFullMonths, YEARS } from '../utils/formatters';

// SummaryFigure — ตัวเลขสรุปหนึ่งช่องในแถบด้านบน
const SummaryFigure = ({ label, children }) => (
  <Box sx={{ py: 2, px: { xs: 0, sm: 2.5 }, minWidth: 0 }}>
    <Typography variant="body2" color="text.secondary">{label}</Typography>
    <Typography sx={{ ...num, fontSize: 22, fontWeight: 500, mt: 0.5 }} noWrap>{children}</Typography>
  </Box>
);

// MonthRow — หนึ่งบรรทัด label / ค่า ในช่องของเดือน
const MonthRow = ({ label, value, color = 'text.primary', strong }) => (
  <Box display="flex" justifyContent="space-between" alignItems="baseline" gap={1}>
    <Typography variant="body2" color="text.secondary">{label}</Typography>
    <Typography sx={{ ...num, fontSize: 15, fontWeight: strong ? 600 : 400 }} color={color}>{value}</Typography>
  </Box>
);

export default function MonthlySummary() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await dashboardApi.getYearly(year);
      setData(res.data);
    } catch {
      setError('โหลดข้อมูลไม่ได้ — ตรวจว่า service FinanceApi ทำงานอยู่ และเครื่องนี้ต่อ Tailscale แล้ว');
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalYearExpenses = data?.Months?.reduce((s, m) => s + m.TotalExpenses, 0) ?? 0;
  const activeMonths = data?.Months?.filter((m) => m.ExpenseCount > 0).length ?? 0;
  const isCurrent = (m) => year === now.getFullYear() && m === now.getMonth() + 1;

  return (
    <Box>
      <PageHeader
        title="สรุปรายเดือน"
        description={`รายจ่ายและเงินคงเหลือทั้ง 12 เดือนของปี ${year + 543}`}
        actions={
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel id="summary-year-label">ปี</InputLabel>
            <Select
              labelId="summary-year-label"
              value={year}
              label="ปี"
              onChange={(e) => setYear(e.target.value)}
            >
              {YEARS.map((y) => (
                <MenuItem key={y} value={y}>{y + 543}</MenuItem>
              ))}
            </Select>
          </FormControl>
        }
      />

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {loading ? (
        <Box display="flex" justifyContent="center" py={8}><CircularProgress aria-label="กำลังโหลด" /></Box>
      ) : !data ? null : (
        <>
          {/* ── แถบตัวเลขสรุปทั้งปี ── */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: 'repeat(3, minmax(0, 1fr))' },
              borderTop: 1,
              borderBottom: 1,
              borderColor: 'divider',
              mb: 5,
              '& > *:not(:first-of-type)': {
                borderTop: { xs: 1, sm: 0 },
                borderLeft: { sm: 1 },
                borderColor: 'divider',
              },
            }}
          >
            <SummaryFigure label="เงินเดือนสุทธิต่อเดือน">฿{formatCurrency(data.Salary)}</SummaryFigure>
            <SummaryFigure label="รายจ่ายรวมทั้งปี">฿{formatCurrency(totalYearExpenses)}</SummaryFigure>
            <SummaryFigure label="เดือนที่มีข้อมูล">{activeMonths} / 12</SummaryFigure>
          </Box>

          {/* ── 12 เดือน: ตารางช่องเท่ากัน เส้นแบ่งแบบสมุด ── */}
          <Box
            component="ol"
            aria-label={`รายเดือนของปี ${year + 543}`}
            sx={{
              m: 0,
              p: 0,
              listStyle: 'none',
              display: 'grid',
              gridTemplateColumns: {
                xs: 'minmax(0, 1fr)',
                sm: 'repeat(2, minmax(0, 1fr))',
                md: 'repeat(3, minmax(0, 1fr))',
                lg: 'repeat(4, minmax(0, 1fr))',
              },
              borderTop: 1,
              borderLeft: 1,
              borderColor: 'divider',
            }}
          >
            {data.Months.map((m) => {
              const hasData = m.ExpenseCount > 0;
              const isNegative = m.Remaining < 0;
              const current = isCurrent(m.Month);

              return (
                <Box
                  component="li"
                  key={m.Month}
                  aria-current={current ? 'date' : undefined}
                  sx={{
                    p: 2.5,
                    borderRight: 1,
                    borderBottom: 1,
                    borderColor: 'divider',
                    bgcolor: hasData ? 'background.paper' : 'ledger.paper2',
                    // เดือนปัจจุบัน — เส้นหมึกน้ำเงินด้านบน
                    boxShadow: current ? (t) => `inset 0 3px 0 ${t.palette.ledger.accent}` : 'none',
                  }}
                >
                  <Box display="flex" justifyContent="space-between" alignItems="baseline" mb={1.5} gap={1}>
                    <Typography variant="h6" component="h2" sx={{ fontSize: '1.05rem' }}>
                      {thaiFullMonths[m.Month]}
                    </Typography>
                    <Typography variant="caption" color={current ? 'primary.main' : 'text.secondary'} fontWeight={current ? 600 : 400}>
                      {current ? 'เดือนนี้' : hasData ? `${m.ExpenseCount} รายการ` : ''}
                    </Typography>
                  </Box>

                  {hasData ? (
                    <>
                      <MonthRow label="รายจ่าย" value={`฿${formatCurrency(m.TotalExpenses)}`} />
                      <Box sx={{ borderTop: 1, borderColor: 'divider', my: 1 }} />
                      <MonthRow
                        label="คงเหลือ"
                        value={`${isNegative ? '−' : ''}฿${formatCurrency(Math.abs(m.Remaining))}`}
                        color={isNegative ? 'error.main' : 'success.main'}
                        strong
                      />
                      {isNegative && (
                        <Typography variant="caption" color="error.main" display="block" mt={0.5}>
                          รายจ่ายเกินรายได้
                        </Typography>
                      )}
                    </>
                  ) : (
                    <Typography variant="body2" color="text.secondary">ยังไม่มีข้อมูล</Typography>
                  )}
                </Box>
              );
            })}
          </Box>
        </>
      )}
    </Box>
  );
}
