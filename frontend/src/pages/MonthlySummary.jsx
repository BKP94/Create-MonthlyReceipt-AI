import { useState, useEffect, useCallback } from 'react';
import {
  Alert, Box, Card, CardActionArea, CardContent, Chip,
  CircularProgress, FormControl, Grid, InputLabel,
  MenuItem, Select, Typography,
} from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import { dashboardApi } from '../api/financeApi';
import { formatCurrency, thaiFullMonths, YEARS } from '../utils/formatters';

export default function MonthlySummary() {
  const [year, setYear] = useState(new Date().getFullYear());
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
      setError('ไม่สามารถโหลดข้อมูลได้ กรุณาตรวจสอบว่า Backend รันอยู่ที่ port 5000');
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalYearExpenses = data?.Months?.reduce((s, m) => s + m.TotalExpenses, 0) ?? 0;
  const activeMonths = data?.Months?.filter((m) => m.ExpenseCount > 0).length ?? 0;

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2} mb={3}>
        <Typography variant="h5">สรุปรายจ่ายรายเดือน</Typography>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>ปี</InputLabel>
          <Select
            value={year}
            label="ปี"
            onChange={(e) => setYear(e.target.value)}
          >
            {YEARS.map((y) => (
              <MenuItem key={y} value={y}>{y + 543}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>
      ) : !data ? null : (
        <>
          {/* Summary row */}
          <Grid container spacing={2} mb={3}>
            <Grid item xs={12} sm={4}>
              <Card>
                <CardContent sx={{ p: 2 }}>
                  <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                    <AccountBalanceWalletIcon fontSize="small" color="primary" />
                    <Typography variant="body2" color="text.secondary">เงินเดือนสุทธิ/เดือน</Typography>
                  </Box>
                  <Typography variant="h6" fontWeight={700} color="primary.main">
                    ฿{formatCurrency(data.Salary)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card>
                <CardContent sx={{ p: 2 }}>
                  <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                    <TrendingDownIcon fontSize="small" color="error" />
                    <Typography variant="body2" color="text.secondary">รายจ่ายรวมทั้งปี</Typography>
                  </Box>
                  <Typography variant="h6" fontWeight={700} color="error.main">
                    ฿{formatCurrency(totalYearExpenses)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card>
                <CardContent sx={{ p: 2 }}>
                  <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                    <CalendarMonthIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">เดือนที่มีข้อมูล</Typography>
                  </Box>
                  <Typography variant="h6" fontWeight={700}>
                    {activeMonths} / 12 เดือน
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* 12 month cards */}
          <Grid container spacing={2}>
            {data.Months.map((m) => {
              const hasData = m.ExpenseCount > 0;
              const isNegative = m.Remaining < 0;

              return (
                <Grid item xs={12} sm={6} md={4} lg={3} key={m.Month}>
                  <Card
                    variant="outlined"
                    sx={{
                      height: '100%',
                      borderColor: hasData
                        ? (isNegative ? 'error.main' : 'success.main')
                        : 'divider',
                      opacity: hasData ? 1 : 0.55,
                    }}
                  >
                    <CardContent sx={{ p: 2.5 }}>
                      {/* Month header */}
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                        <Typography variant="subtitle1" fontWeight={700}>
                          {thaiFullMonths[m.Month]}
                        </Typography>
                        {hasData ? (
                          <Chip
                            label={isNegative ? 'เกิน' : 'ปกติ'}
                            color={isNegative ? 'error' : 'success'}
                            size="small"
                          />
                        ) : (
                          <Chip label="ไม่มีข้อมูล" size="small" />
                        )}
                      </Box>

                      {/* Expenses */}
                      <Box display="flex" justifyContent="space-between" alignItems="baseline" mb={0.5}>
                        <Typography variant="body2" color="text.secondary">รายจ่าย</Typography>
                        <Typography variant="body1" fontWeight={600} color={hasData ? 'error.main' : 'text.disabled'}>
                          {hasData ? `฿${formatCurrency(m.TotalExpenses)}` : '—'}
                        </Typography>
                      </Box>

                      {/* Item count */}
                      {hasData && (
                        <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                          {m.ExpenseCount} รายการ
                        </Typography>
                      )}

                      {/* Divider */}
                      <Box borderTop="1px solid #eee" my={1} />

                      {/* Remaining */}
                      <Box display="flex" justifyContent="space-between" alignItems="baseline">
                        <Typography variant="body2" color="text.secondary">คงเหลือ</Typography>
                        <Typography
                          variant="body1"
                          fontWeight={700}
                          color={hasData ? (isNegative ? 'error.main' : 'success.main') : 'text.disabled'}
                        >
                          {hasData
                            ? `${isNegative ? '-' : ''}฿${formatCurrency(Math.abs(m.Remaining))}`
                            : '—'}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </>
      )}
    </Box>
  );
}
