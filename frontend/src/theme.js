// Hallmark · design-system: design.md · theme.js = hex mirror ของ src/styles/tokens.css
// MUI alpha()/darken() อ่าน oklch() ไม่ได้ จึงต้องเก็บค่า hex คู่กัน — แก้สีต้องแก้ทั้งสองไฟล์
import { createTheme } from '@mui/material/styles';

// ledger — สีทั้งหมดของระบบ ใช้ใน sx ได้ด้วย path เช่น bgcolor: 'ledger.paper2'
// (path นี้สลับตามโหมดสว่าง/มืดให้เอง — ห้าม import ค่า hex ไปใช้ตรงๆ ในหน้า
//  ถ้าต้องการค่าจริง เช่นใส่ให้ recharts ใช้ useTheme().palette.ledger)
export const ledgerLight = {
  paper: '#F9F5EC',
  paper2: '#F2ECE3',
  paper3: '#E7E0D6',
  ink: '#1A1511',
  ink2: '#47413C',
  muted: '#68625C',
  rule: '#CECAC3',
  ruleStrong: '#A39D96',
  accent: '#1F5596',
  accentSoft: '#E0ECFC',
  positive: '#1D6835',
  positiveSoft: '#E1F5E4',
  negative: '#AC312A',
  negativeSoft: '#FFE7E3',
  warning: '#905211',
  warningSoft: '#FEEBD6',
};

// โหมดมืด — ค่าจาก design.md § Dark mode, contrast เทียบกับ paper (#15110D)
export const ledgerDark = {
  paper: '#15110D',
  paper2: '#1E1A16',
  paper3: '#28231E',
  ink: '#EBE7E0',       // 15.3:1
  ink2: '#C7C3BD',      // 10.8:1
  muted: '#A8A49E',     // 7.6:1
  rule: '#36322D',
  ruleStrong: '#6A655F', // 3.3:1 (เส้นขอบ non-text)
  accent: '#74A7E8',    // 7.6:1
  accentSoft: '#1C2F46',
  positive: '#69BA7C',
  positiveSoft: '#172C1C',
  negative: '#E8796C',
  negativeSoft: '#3E1F1B',
  warning: '#DEA45F',
  warningSoft: '#3A2710',
};

export const fonts = {
  display: '"Noto Serif Thai", "Noto Serif", Georgia, serif',
  body: '"IBM Plex Sans Thai", "IBM Plex Sans", system-ui, sans-serif',
  mono: '"IBM Plex Mono", ui-monospace, "Cascadia Mono", monospace',
};

// num — สไตล์ตัวเลขเงิน ใช้ซ้ำทุกหน้า: <Typography sx={num}>
export const num = { fontFamily: fonts.mono, fontVariantNumeric: 'tabular-nums' };

// createLedgerTheme — สร้าง theme ตามโหมด (App.jsx เลือกจาก prefers-color-scheme)
export function createLedgerTheme(mode = 'light') {
  const ledger = mode === 'dark' ? ledgerDark : ledgerLight;
  return createTheme({
    palette: {
      mode,
      primary: { main: ledger.accent, light: ledger.accentSoft, contrastText: ledger.paper },
      secondary: { main: ledger.positive, contrastText: ledger.paper },
      success: { main: ledger.positive, light: ledger.positiveSoft, contrastText: ledger.paper },
      error: { main: ledger.negative, light: ledger.negativeSoft, contrastText: ledger.paper },
      warning: { main: ledger.warning, light: ledger.warningSoft, contrastText: ledger.paper },
      info: { main: ledger.accent, light: ledger.accentSoft, contrastText: ledger.paper },
      text: { primary: ledger.ink, secondary: ledger.muted, disabled: ledger.ruleStrong },
      divider: ledger.rule,
      background: { default: ledger.paper, paper: ledger.paper },
      action: { hover: ledger.paper2, selected: ledger.paper3 },
      ledger,
    },
    typography: {
      fontFamily: fonts.body,
      h1: { fontFamily: fonts.display, fontWeight: 600, fontStyle: 'normal', lineHeight: 1.25 },
      h2: { fontFamily: fonts.display, fontWeight: 600, fontStyle: 'normal', lineHeight: 1.25 },
      h3: { fontFamily: fonts.display, fontWeight: 600, fontStyle: 'normal', lineHeight: 1.25 },
      h4: { fontFamily: fonts.display, fontWeight: 600, fontStyle: 'normal', lineHeight: 1.25 },
      // h5 = ชื่อหน้า (h1 ของแต่ละหน้า) · h6 = หัวข้อ section
      h5: {
        fontFamily: fonts.display, fontWeight: 600, fontStyle: 'normal', lineHeight: 1.25,
        fontSize: '1.5rem', '@media (min-width:900px)': { fontSize: '1.75rem' },
      },
      h6: { fontFamily: fonts.display, fontWeight: 600, fontStyle: 'normal', fontSize: '1.15rem', lineHeight: 1.3 },
      subtitle1: { fontWeight: 500 },
      subtitle2: { fontWeight: 600 },
      body1: { lineHeight: 1.6 },
      body2: { lineHeight: 1.55 },
      overline: { fontWeight: 600, letterSpacing: '0.06em', lineHeight: 1.6 },
      button: { fontWeight: 600, textTransform: 'none' },
    },
    shape: { borderRadius: 4 },
    components: {
      // MUI แปลง subtitle1/2 เป็น <h6> โดยปริยาย ทำให้หัวข้อข้ามระดับ (h1 → h6)
      // ในแอปนี้ subtitle ใช้เป็นชื่อการ์ด/ป้าย ไม่ใช่หัวข้อเอกสาร → ใช้ <p>
      MuiTypography: {
        defaultProps: { variantMapping: { subtitle1: 'p', subtitle2: 'p' } },
      },
      MuiCssBaseline: {
        styleOverrides: {
          body: { backgroundColor: ledger.paper, color: ledger.ink },
        },
      },
      MuiPaper: {
        defaultProps: { elevation: 0 },
        styleOverrides: { root: { backgroundImage: 'none' } },
      },
      // การ์ด = ส่วนของสมุด: เส้น hairline แทนเงา
      MuiCard: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: { borderRadius: 0, boxShadow: 'none', border: `1px solid ${ledger.rule}`, backgroundColor: ledger.paper },
        },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: {
            borderRadius: 4,
            textTransform: 'none',
            fontWeight: 600,
            // 44px = ขนาดเป้าสัมผัสขั้นต่ำที่ Apple/Google แนะนำ
            minHeight: 44,
            transition: 'background-color 120ms, border-color 120ms, color 120ms',
            '&.Mui-disabled': { color: ledger.muted },
          },
          contained: {
            '&.Mui-disabled': { backgroundColor: ledger.paper3, color: ledger.muted },
          },
          outlined: { borderColor: ledger.ruleStrong },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          // ปุ่มไอคอนในการ์ด/ตารางเดิมเล็กเกินกดพลาดบนมือถือ
          root: { minWidth: 44, minHeight: 44, borderRadius: 4 },
          // ยกเว้นตัวที่ระบุ size="small" ไว้ชัดเจน (เช่นในตาราง desktop)
          sizeSmall: { minWidth: 34, minHeight: 34 },
        },
      },
      MuiCheckbox: {
        styleOverrides: {
          // padding 10 → กล่องรวม 44px (ค่าเดิม 9 ได้ 42px)
          root: { padding: 10 },
          // size="small" ในตาราง desktop คงไว้ — กดด้วยเมาส์
          sizeSmall: { padding: 7 },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: { fontWeight: 500, borderRadius: 4 },
          outlined: { borderColor: ledger.ruleStrong },
        },
      },
      MuiInputBase: {
        styleOverrides: {
          // iOS Safari จะ zoom หน้าจอเข้าอัตโนมัติถ้า input มี font-size < 16px
          input: { fontSize: 16 },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: { backgroundColor: ledger.paper },
          notchedOutline: { borderColor: ledger.ruleStrong },
        },
      },
      MuiListItemButton: {
        styleOverrides: { root: { minHeight: 48 } },
      },
      MuiTableCell: {
        styleOverrides: {
          root: { borderBottom: `1px solid ${ledger.rule}` },
          head: {
            backgroundColor: ledger.paper2,
            color: ledger.ink2,
            fontWeight: 600,
            fontSize: '0.8125rem',
            whiteSpace: 'nowrap',
          },
        },
      },
      MuiTableRow: {
        styleOverrides: {
          root: { '&.MuiTableRow-hover:hover': { backgroundColor: ledger.paper2 } },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: { borderRadius: 4, border: `1px solid ${ledger.rule}`, boxShadow: mode === 'dark' ? '0 12px 40px rgba(0,0,0,0.5)' : '0 12px 40px rgba(26,21,17,0.16)' },
        },
      },
      MuiDialogTitle: {
        styleOverrides: { root: { fontFamily: fonts.display, fontWeight: 600 } },
      },
      MuiAlert: {
        styleOverrides: { root: { borderRadius: 4 } },
      },
      MuiTooltip: {
        styleOverrides: { tooltip: { backgroundColor: ledger.ink, fontSize: '0.8125rem' } },
      },
      MuiLinearProgress: {
        styleOverrides: {
          root: { backgroundColor: ledger.paper3, borderRadius: 0 },
        },
      },
      MuiToggleButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 500,
            minHeight: 44,
            borderColor: ledger.ruleStrong,
            color: ledger.ink2,
            '&.Mui-selected': { backgroundColor: ledger.accentSoft, color: ledger.accent },
          },
        },
      },
      MuiSnackbar: {
        defaultProps: { anchorOrigin: { vertical: 'top', horizontal: 'center' } },
      },
    },
  });
}

export default createLedgerTheme('light');
