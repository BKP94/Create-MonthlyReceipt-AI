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

const DRAWER_WIDTH = 248;

const navItems = [
  { label: 'แดชบอร์ด',        path: '/',              icon: <DashboardIcon /> },
  { label: 'รายจ่ายรายเดือน', path: '/expenses',      icon: <ReceiptLongIcon /> },
  { label: 'ผ่อนชำระ',        path: '/installments',  icon: <CreditCardIcon /> },
  { label: 'ตั้งค่างบประมาณ', path: '/budget',        icon: <TuneIcon /> },
];

export default function Layout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
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
      <List sx={{ pt: 1, flexGrow: 1 }}>
        {navItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <ListItem key={item.path} disablePadding sx={{ px: 1, mb: 0.5 }}>
              <ListItemButton
                selected={active}
                onClick={() => { navigate(item.path); if (isMobile) setMobileOpen(false); }}
                sx={{
                  borderRadius: 2,
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

      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          zIndex: (t) => t.zIndex.drawer + 1,
          bgcolor: 'primary.main',
          borderBottom: '1px solid rgba(255,255,255,0.12)',
        }}
      >
        <Toolbar>
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

      <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { width: DRAWER_WIDTH } }}
        >
          {drawerContent}
        </Drawer>
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

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, md: 3 },
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          minHeight: '100vh',
          bgcolor: 'background.default',
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
}
