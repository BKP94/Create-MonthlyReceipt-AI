// ========================================================
// MobileDataCard.jsx — การ์ดแทน "หนึ่งแถวของตาราง" บนหน้าจอมือถือ
//
// ตารางแนวนอนอ่านไม่ได้บนจอแคบ (ต้องเลื่อนซ้าย-ขวา) หน้าที่มีตาราง
// จึงเปลี่ยนมา render การ์ดเหล่านี้แทนเมื่อ useIsMobile() = true
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
//   sx        — style เพิ่มเติมของการ์ด (เช่น พื้นหลังเมื่อชำระแล้ว)
// ========================================================

import { Box, Card, CardContent, Divider, Typography } from '@mui/material';

export default function MobileDataCard({
  leading, title, titleChips, amount, amountColor = 'text.primary',
  rows = [], footer, actions, sx,
}) {
  return (
    <Card variant="outlined" sx={{ mb: 1.5, ...sx }}>
      <CardContent sx={{ p: 1.75, '&:last-child': { pb: 1.75 } }}>

        {/* ── บรรทัดหัว: (checkbox) ชื่อ + chips ... ยอดเงิน ── */}
        <Box display="flex" alignItems="flex-start" gap={1}>
          {leading && <Box sx={{ ml: -1, mt: -0.5 }}>{leading}</Box>}

          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography variant="subtitle2" fontWeight={700} sx={{ wordBreak: 'break-word' }}>
              {title}
            </Typography>
            {titleChips && (
              <Box display="flex" gap={0.5} flexWrap="wrap" mt={0.5}>
                {titleChips}
              </Box>
            )}
          </Box>

          {amount != null && (
            <Typography variant="subtitle1" fontWeight={700} color={amountColor} sx={{ whiteSpace: 'nowrap' }}>
              {amount}
            </Typography>
          )}
        </Box>

        {/* ── รายละเอียด label / value ── */}
        {rows.length > 0 && (
          <Box mt={1.25} display="flex" flexDirection="column" gap={0.5}>
            {rows.map((r) => (
              <Box key={r.label} display="flex" justifyContent="space-between" gap={2}>
                <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                  {r.label}
                </Typography>
                <Typography
                  variant="caption"
                  fontWeight={600}
                  color={r.color ?? 'text.primary'}
                  sx={{ textAlign: 'right', wordBreak: 'break-word' }}
                >
                  {r.value}
                </Typography>
              </Box>
            ))}
          </Box>
        )}

        {footer && <Box mt={1.25}>{footer}</Box>}

        {/* ── ปุ่มดำเนินการ ชิดขวา คั่นด้วยเส้น ──
            mb ติดลบ — หักช่องว่างของ IconButton (สูง 44px ตาม theme)
            ไม่ให้การ์ดสูงเกินจำเป็นเมื่อมีหลายสิบรายการ */}
        {actions && (
          <>
            <Divider sx={{ mt: 1, mb: 0 }} />
            <Box display="flex" justifyContent="flex-end" gap={0.5} sx={{ mb: -0.75, mr: -0.75 }}>
              {actions}
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
}
