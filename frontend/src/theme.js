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
    h5: { fontWeight: 700 },
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
        root: { borderRadius: 8, textTransform: 'none', fontWeight: 600 },
      },
    },
    MuiChip: {
      styleOverrides: { root: { fontWeight: 600 } },
    },
  },
});

export default theme;
