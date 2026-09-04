import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: { main: '#1565C0' },
    secondary: { main: '#2E7D32' },
    error: { main: '#C62828' },
    warning: { main: '#E65100' },
    background: { default: '#F0F4F8', paper: '#FFFFFF' },
  },
  typography: {
    fontFamily: '"Sarabun", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: { fontWeight: 700 },
    // ลดขนาดหัวข้อบนจอเล็ก ไม่ให้ตกบรรทัด
    h5: { fontWeight: 700, fontSize: '1.35rem', '@media (min-width:900px)': { fontSize: '1.5rem' } },
    h6: { fontWeight: 600 },
  },
  shape: { borderRadius: 10 },
  components: {
    MuiCard: {
      styleOverrides: {
        root: { borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.07)' },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
          // 44px = ขนาดเป้าสัมผัสขั้นต่ำที่ Apple/Google แนะนำ
          minHeight: 44,
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        // ปุ่มไอคอนในการ์ด/ตารางเดิมเล็กเกินกดพลาดบนมือถือ
        root: { minWidth: 44, minHeight: 44 },
        // ยกเว้นตัวที่ระบุ size="small" ไว้ชัดเจน (เช่นในตาราง desktop)
        sizeSmall: { minWidth: 34, minHeight: 34 },
      },
    },
    MuiChip: {
      styleOverrides: { root: { fontWeight: 600 } },
    },
    MuiInputBase: {
      styleOverrides: {
        // iOS Safari จะ zoom หน้าจอเข้าอัตโนมัติถ้า input มี font-size < 16px
        input: { fontSize: 16 },
      },
    },
    MuiListItemButton: {
      styleOverrides: { root: { minHeight: 48 } },
    },
  },
});

export default theme;
