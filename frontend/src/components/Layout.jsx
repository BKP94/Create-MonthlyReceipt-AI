// ========================================================
// Layout.jsx — กรอบหน้าจอหลักของแอป
// Hallmark · genre: editorial · nav: N3 side-rail · design-system: design.md · designed-as-app
//
//   - desktop (md ขึ้นไป): side-rail ถาวรด้านซ้าย ไม่มี AppBar
//   - mobile: แถบบนบางๆ + ปุ่ม hamburger เปิด Drawer ชั่วคราว
//   - children — เนื้อหาหน้าหลัก (แต่ละ page component ถูก render ที่นี่)
// ========================================================

import { useState } from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import {
  AppBar, Box, Drawer, IconButton,
  List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Toolbar, Typography, useTheme, useMediaQuery,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import CreditCardOutlinedIcon from '@mui/icons-material/CreditCardOutlined';
import TuneOutlinedIcon from '@mui/icons-material/TuneOutlined';
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import SettingsEthernetIcon from '@mui/icons-material/SettingsEthernet';
import ApiSettingsDialog from './ApiSettingsDialog';

// ความกว้างของ side-rail (px)
const DRAWER_WIDTH = 240;

// navItems — รายการเมนูนำทางทั้งหมด
const navItems = [
  { label: 'แดชบอร์ด',          path: '/',                icon: <DashboardOutlinedIcon /> },
  { label: 'รายจ่ายรายเดือน',   path: '/expenses',        icon: <ReceiptLongOutlinedIcon /> },
  { label: 'สรุปรายเดือน',      path: '/monthly-summary', icon: <CalendarMonthOutlinedIcon /> },
  { label: 'ผ่อนชำระ',          path: '/installments',    icon: <CreditCardOutlinedIcon /> },
  { label: 'ตั้งค่างบประมาณ',   path: '/budget',          icon: <TuneOutlinedIcon /> },
  { label: 'ประวัติเงินเดือน',  path: '/salary-history',  icon: <TrendingUpOutlinedIcon /> },
];

// Wordmark — ชื่อแอปแบบตัวพิมพ์ ไม่มีโลโก้วงกลม
function Wordmark() {
  return (
    <Box>
      <Typography
        component="span"
        sx={{ display: 'block', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 20, lineHeight: 1.2 }}
      >
        สมุดบัญชี
      </Typography>
      <Typography variant="caption" color="text.secondary">
        บริหารการเงินส่วนตัว
      </Typography>
    </Box>
  );
}

// Layout รับ children prop — เนื้อหาแต่ละหน้าจะถูกวางใน Box component="main"
export default function Layout({ children }) {
  // mobileOpen — state ควบคุมการเปิด/ปิด Drawer บน mobile
  const [mobileOpen, setMobileOpen] = useState(false);
  // apiSettingsOpen — dialog ตั้งค่า URL ของ backend
  const [apiSettingsOpen, setApiSettingsOpen] = useState(false);

  const location = useLocation();    // ใช้รู้ว่าอยู่หน้าไหน (เพื่อ highlight เมนู active)
  const theme = useTheme();
  // isMobile — true ถ้าหน้าจอเล็กกว่า md (900px)
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // drawerContent — JSX ของ side-rail (ใช้ร่วมกันทั้ง permanent และ temporary Drawer)
  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'ledger.paper2' }}>
      <Box sx={{ px: 2.5, pt: 'calc(24px + env(safe-area-inset-top, 0px))', pb: 2.5, borderBottom: 1, borderColor: 'divider' }}>
        <Wordmark />
      </Box>

      {/* รายการเมนู — เป็น <a> จริง เปิดแท็บใหม่ได้ และมี aria-current */}
      <List component="div" sx={{ pt: 1.5, flexGrow: 1 }}>
        {navItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <ListItem key={item.path} disablePadding sx={{ px: 1.5, mb: 0.25 }}>
              <ListItemButton
                component={RouterLink}
                to={item.path}
                selected={active}
                aria-current={active ? 'page' : undefined}
                onClick={() => { if (isMobile) setMobileOpen(false); }}
                sx={{
                  borderRadius: 1,
                  color: 'ledger.ink2',
                  borderLeft: '3px solid transparent',
                  transition: 'background-color var(--motion-fast)',
                  '& .MuiListItemIcon-root': { color: 'ledger.muted', minWidth: 36 },
                  '&:hover': { bgcolor: 'ledger.paper3' },
                  // active — แถบหมึกน้ำเงินด้านซ้าย ไม่เทพื้นทั้งแถบ
                  '&.Mui-selected': {
                    bgcolor: 'ledger.accentSoft',
                    color: 'ledger.accent',
                    borderLeftColor: 'ledger.accent',
                    '& .MuiListItemIcon-root': { color: 'ledger.accent' },
                    '&:hover': { bgcolor: 'ledger.accentSoft' },
                  },
                  '&.Mui-focusVisible': { outline: '2px solid', outlineColor: 'ledger.accent', outlineOffset: -2, bgcolor: 'ledger.paper3' },
                }}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{ fontSize: 15, fontWeight: active ? 600 : 500 }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      {/* ตั้งค่าการเชื่อมต่อ — อยู่ท้าย rail บน desktop */}
      <Box sx={{ px: 1.5, pb: 'calc(16px + env(safe-area-inset-bottom, 0px))', pt: 1, borderTop: 1, borderColor: 'divider' }}>
        <ListItemButton
          onClick={() => { setApiSettingsOpen(true); setMobileOpen(false); }}
          sx={{ borderRadius: 1, color: 'ledger.muted', '&:hover': { bgcolor: 'ledger.paper3' } }}
        >
          <ListItemIcon sx={{ minWidth: 36, color: 'inherit' }}><SettingsEthernetIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="ตั้งค่าการเชื่อมต่อ" primaryTypographyProps={{ fontSize: 14 }} />
        </ListItemButton>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      {/* แถบบน — เฉพาะมือถือ: พื้นกระดาษ เส้น hairline ด้านล่าง */}
      {isMobile && (
        <AppBar
          position="fixed"
          elevation={0}
          sx={{
            bgcolor: 'ledger.paper',
            color: 'ledger.ink',
            borderBottom: 1,
            borderColor: 'divider',
            // เว้นพื้นที่ notch เมื่อรันเป็น PWA เต็มจอบน iPhone
            pt: 'env(safe-area-inset-top, 0px)',
          }}
        >
          <Toolbar sx={{ minHeight: 56, px: 1 }}>
            <IconButton
              color="inherit"
              onClick={() => setMobileOpen(true)}
              aria-label="เปิดเมนู"
              aria-controls="app-nav"
              aria-expanded={mobileOpen}
              sx={{ mr: 0.5 }}
            >
              <MenuIcon />
            </IconButton>
            <Typography
              component="span"
              noWrap
              sx={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 18, flexGrow: 1 }}
            >
              สมุดบัญชี
            </Typography>
          </Toolbar>
        </AppBar>
      )}

      {/* Side-rail Navigation */}
      <Box component="nav" id="app-nav" aria-label="เมนูหลัก" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
        {isMobile ? (
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={() => setMobileOpen(false)}
            ModalProps={{ keepMounted: true }} // keepMounted → ไม่ unmount เมื่อปิด (เพื่อ performance)
            sx={{ '& .MuiDrawer-paper': { width: DRAWER_WIDTH, border: 0 } }}
          >
            {drawerContent}
          </Drawer>
        ) : (
          <Drawer
            variant="permanent"
            open
            sx={{
              '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box', borderRight: 1, borderColor: 'divider' },
            }}
          >
            {drawerContent}
          </Drawer>
        )}
      </Box>

      {/* เนื้อหาหลัก — children จาก App.jsx */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minWidth: 0,
          px: { xs: 2, md: 4 },
          pt: { xs: 'calc(56px + 20px + env(safe-area-inset-top, 0px))', md: 5 },
          // เว้นที่ท้ายหน้าบนมือถือ ไม่ให้ปุ่มลอย (AddFab) ทับรายการสุดท้าย
          pb: { xs: 'calc(96px + env(safe-area-inset-bottom, 0px))', md: 6 },
          // หักความกว้าง side-rail ออก เพื่อไม่ให้เนื้อหาทับกัน
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          // ใช้ 100dvh แทน 100vh — บนมือถือ vh ไม่หักแถบ URL ของเบราว์เซอร์
          minHeight: '100dvh',
          bgcolor: 'background.default',
          // กันเนื้อหาที่กว้างเกิน (เช่น ตาราง) ดันหน้าจอให้เลื่อนแนวนอนได้ทั้งหน้า
          overflowX: 'clip',
        }}
      >
        {/* key ตาม path → เล่น fade สั้นๆ ทุกครั้งที่เปลี่ยนหน้า */}
        <Box key={location.pathname} className="page-enter" sx={{ maxWidth: 1120, mx: 'auto' }}>
          {children}
        </Box>
      </Box>

      <ApiSettingsDialog open={apiSettingsOpen} onClose={() => setApiSettingsOpen(false)} />
    </Box>
  );
}
