// ========================================================
// useIsMobile — hook เช็คว่าหน้าจอปัจจุบันเป็นขนาดมือถือหรือไม่
// ใช้ breakpoint 'md' (< 900px) ให้ตรงกับ Layout.jsx ที่สลับ Drawer
// ที่ breakpoint เดียวกัน เพื่อให้ทั้งแอปเปลี่ยนโหมดพร้อมกัน
// ========================================================
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

export default function useIsMobile() {
  const theme = useTheme();
  return useMediaQuery(theme.breakpoints.down('md'));
}
