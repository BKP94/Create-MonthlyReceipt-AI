// ========================================================
// Section.jsx — ส่วนของหน้า: หัวข้อ h2 + ปุ่มด้านขวา (optional) แล้วตามด้วยเนื้อหา
// ใช้แทน Card ลอย — ส่วนต่างๆ แบ่งด้วยระยะห่างและเส้น hairline (design.md § Genre)
// ========================================================

import { Box, Typography } from '@mui/material';

export default function Section({ title, aside, children, sx }) {
  return (
    <Box component="section" sx={{ mb: 5, ...sx }}>
      {title && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            gap: 2,
            flexWrap: 'wrap',
            mb: 1.5,
          }}
        >
          <Typography variant="h6" component="h2">{title}</Typography>
          {aside && (
            <Typography variant="body2" color="text.secondary" component="div">{aside}</Typography>
          )}
        </Box>
      )}
      {children}
    </Box>
  );
}
