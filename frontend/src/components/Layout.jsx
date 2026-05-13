// ========================================================
// Layout.jsx — กรอบหน้าจอหลักของแอป
// ประกอบด้วย:
//   - AppBar (แถบด้านบน) — แสดงชื่อแอปและปุ่ม hamburger บน mobile
//   - Drawer (Sidebar) — เมนูนำทาง ซ้ายมือ
//     - "permanent" บน desktop (md ขึ้นไป) → แสดงตลอด
//     - "temporary" บน mobile → ซ่อน/แสดงด้วยปุ่ม hamburger
//   - children — เนื้อหาหน้าหลัก (แต่ละ page component ถูก render ที่นี่)
// ========================================================

import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar, Box, CssBaseline, Drawer, IconButton,
  List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Toolbar, Typography, useTheme, useMediaQuery, Divider, Avatar,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import TuneIcon from '@mui/icons-material/Tune';
import SavingsIcon from '@mui/icons-material/Savings';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

// ความกว้างของ Sidebar (px)
const DRAWER_WIDTH = 248;

// navItems — รายการเมนูนำทางทั้งหมด
// label: ชื่อที่แสดง, path: URL, icon: ไอคอน MUI
const navItems = [
  { label: 'แดชบอร์ด',        path: '/',              icon: <DashboardIcon /> },
  { label: 'รายจ่ายรายเดือน', path: '/expenses',      icon: <ReceiptLongIcon /> },
  { label: 'ผ่อนชำระ',        path: '/installments',  icon: <CreditCardIcon /> },
  { label: 'ตั้งค่างบประมาณ', path: '/budget',          icon: <TuneIcon /> },
  { label: 'ประวัติเงินเดือน', path: '/salary-history', icon: <TrendingUpIcon /> },
];

// Layout รับ children prop — เนื้อหาแต่ละหน้าจะถูกวางใน Box component="main"
export default function Layout({ children }) {
  // mobileOpen — state ควบคุมการเปิด/ปิด Drawer บน mobile
  const [mobileOpen, setMobileOpen] = useState(false);

  const navigate = useNavigate();    // ใช้เปลี่ยนหน้า
  const location = useLocation();    // ใช้รู้ว่าอยู่หน้าไหน (เพื่อ highlight เมนู active)
  const theme = useTheme();
  // isMobile — true ถ้าหน้าจอเล็กกว่า md (960px)
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // drawerContent — JSX ของ Sidebar (ใช้ร่วมกันทั้ง permanent และ temporary Drawer)
  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Logo / ชื่อแอป */}
      <Toolbar sx={{ px: 2, py: 1.5 }}>
        <Avatar sx={{ bgcolor: 'primary.main', mr: 1.5, width: 36, height: 36 }}>
          <SavingsIcon fontSize="small" />
        </Avatar>
        <Box>
          <Typography variant="subtitle1" fontWeight={700} lineHeight={1.2}>
            บริหารการเงิน
          </Typography>
          <Typography variant="caption" color="text.secondary">
            ส่วนตัว
          </Typography>
        </Box>
      </Toolbar>
      <Divider />

      {/* รายการเมนู */}
      <List sx={{ pt: 1, flexGrow: 1 }}>
        {navItems.map((item) => {
          // active — true ถ้า URL ปัจจุบันตรงกับเมนูนี้
          const active = location.pathname === item.path;
          return (
            <ListItem key={item.path} disablePadding sx={{ px: 1, mb: 0.5 }}>
              <ListItemButton
                selected={active}
                onClick={() => {
                  navigate(item.path);
                  // ถ้าเป็น mobile ให้ปิด Drawer หลังเลือกเมนู
                  if (isMobile) setMobileOpen(false);
                }}
                sx={{
                  borderRadius: 2,
                  // สไตล์เมนู active — พื้นน้ำเงิน ตัวอักษรขาว
                  '&.Mui-selected': {
                    bgcolor: 'primary.main',
                    color: 'white',
                    '&:hover': { bgcolor: 'primary.dark' },
                    '& .MuiListItemIcon-root': { color: 'white' },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: 15 }} />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />

      {/* AppBar — แถบด้านบนสีน้ำเงิน */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          // zIndex สูงกว่า Drawer เพื่อให้ AppBar อยู่ด้านบนสุด
          zIndex: (t) => t.zIndex.drawer + 1,
          bgcolor: 'primary.main',
          borderBottom: '1px solid rgba(255,255,255,0.12)',
        }}
      >
        <Toolbar>
          {/* ปุ่ม hamburger — แสดงเฉพาะ mobile */}
          {isMobile && (
            <IconButton color="inherit" edge="start" onClick={() => setMobileOpen(true)} sx={{ mr: 1 }}>
              <MenuIcon />
            </IconButton>
          )}
          <Typography variant="h6" noWrap sx={{ fontWeight: 700 }}>
            โปรแกรมบริหารการเงินส่วนตัว
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Sidebar Navigation */}
      <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>

        {/* Temporary Drawer — สำหรับ mobile (เปิด/ปิดได้) */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }} // keepMounted → ไม่ unmount เมื่อปิด (เพื่อ performance)
          sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { width: DRAWER_WIDTH } }}
        >
          {drawerContent}
        </Drawer>

        {/* Permanent Drawer — สำหรับ desktop (แสดงตลอด) */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box', borderRight: '1px solid #e0e0e0' },
          }}
          open
        >
          {drawerContent}
        </Drawer>
      </Box>

      {/* เนื้อหาหลัก — children จาก App.jsx */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, md: 3 },
          // หักความกว้าง Sidebar ออก เพื่อไม่ให้เนื้อหาทับกัน
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          minHeight: '100vh',
          bgcolor: 'background.default',
        }}
      >
        {/* Toolbar placeholder — ดันเนื้อหาลงมาให้ไม่ถูก AppBar บัง */}
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
}
