// ========================================================
// useIsMobile — hook เช็คว่าหน้าจอปัจจุบันเป็นขนาดมือถือหรือไม่
// ใช้ breakpoint 'md' (< 900px) ให้ตรงกับ Layout.jsx ที่สลับ Drawer
// ที่ breakpoint เดียวกัน เพื่อให้ทั้งแอปเปลี่ยนโหมดพร้อมกัน
// ========================================================
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

export default function useIsMobile() {
  const theme = useTheme();
  // noSsr — อ่านค่าจริงตั้งแต่ render แรก ไม่ render แบบ desktop ก่อนแล้วค่อยสลับ
  return useMediaQuery(theme.breakpoints.down('md'), { noSsr: true });
}
