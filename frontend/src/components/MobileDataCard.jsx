// ========================================================
// MobileDataCard.jsx — "หนึ่งบรรทัดของสมุดบัญชี" บนหน้าจอมือถือ
//
// ตารางแนวนอนอ่านไม่ได้บนจอแคบ หน้าที่มีตารางจึง render รายการเหล่านี้แทน
// เมื่อ useIsMobile() = true — เป็นแถวคั่นด้วยเส้น hairline ไม่ใช่การ์ดลอย
//
// Props:
//   leading   — element ด้านซ้ายสุด (เช่น Checkbox) — optional
//   title     — ชื่อรายการ (บรรทัดบนสุด)
//   titleChips— array ของ element เล็กๆ ต่อท้ายชื่อ (เช่น Chip หมวดหมู่)
//   amount    — ตัวเลขเด่นมุมขวาบน (string ที่ format มาแล้ว)
//   amountColor — สีของ amount (ค่า sx color ของ MUI)
//   rows      — [{ label, value, color }] รายละเอียดแบบ label ซ้าย / ค่าขวา
//   footer    — element ใต้สุด (เช่น LinearProgress)
//   actions   — element ปุ่มดำเนินการ (แก้ไข/ลบ)
//   sx        — style เพิ่มเติม (เช่น พื้นหลังเมื่อชำระแล้ว)
// ========================================================

import { Box, Typography } from '@mui/material';
import { num } from '../theme';

export default function MobileDataCard({
  leading, title, titleChips, amount, amountColor = 'text.primary',
  rows = [], footer, actions, sx,
}) {
  return (
    <Box
      component="li"
      sx={{
        listStyle: 'none',
        py: 1.75,
        px: 0.5,
        borderBottom: 1,
        borderColor: 'divider',
        ...sx,
      }}
    >
      {/* ── บรรทัดหัว: (checkbox) ชื่อ + chips ... ยอดเงิน ── */}
      <Box display="flex" alignItems="flex-start" gap={1}>
        {leading && <Box sx={{ ml: -1, mt: -1 }}>{leading}</Box>}

        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography variant="subtitle2" sx={{ wordBreak: 'break-word', lineHeight: 1.45 }}>
            {title}
          </Typography>
          {titleChips && (
            <Box display="flex" gap={0.5} flexWrap="wrap" mt={0.5}>
              {titleChips}
            </Box>
          )}
        </Box>

        {amount != null && (
          <Typography sx={{ ...num, fontWeight: 500, fontSize: 16, whiteSpace: 'nowrap' }} color={amountColor}>
            {amount}
          </Typography>
        )}
      </Box>

      {/* ── รายละเอียด label / value ── */}
      {rows.length > 0 && (
        <Box component="dl" sx={{ m: 0, mt: 1, display: 'flex', flexDirection: 'column', gap: 0.25 }}>
          {rows.map((r) => (
            <Box key={r.label} display="flex" justifyContent="space-between" gap={2}>
              <Typography component="dt" variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                {r.label}
              </Typography>
              <Typography
                component="dd"
                variant="caption"
                color={r.color ?? 'text.primary'}
                sx={{ m: 0, textAlign: 'right', wordBreak: 'break-word', fontWeight: 500 }}
              >
                {r.value}
              </Typography>
            </Box>
          ))}
        </Box>
      )}

      {footer && <Box mt={1.25}>{footer}</Box>}

      {/* ── ปุ่มดำเนินการ ชิดขวา — mb ติดลบหักช่องว่างของ IconButton 44px ── */}
      {actions && (
        <Box display="flex" justifyContent="flex-end" gap={0.5} sx={{ mt: 0.5, mb: -1, mr: -1 }}>
          {actions}
        </Box>
      )}
    </Box>
  );
}

// MobileDataList — ครอบ MobileDataCard ให้เป็น <ul> ที่มีเส้นบนสุด
export function MobileDataList({ children, sx }) {
  return (
    <Box component="ul" sx={{ m: 0, p: 0, borderTop: 1, borderColor: 'ledger.ruleStrong', ...sx }}>
      {children}
    </Box>
  );
}
