// ========================================================
// PageHeader.jsx — หัวหน้าที่ทุกหน้าใช้ร่วมกัน (design.md § Must share)
//   h1 + คำอธิบายหนึ่งบรรทัด + ปุ่ม/ตัวเลือกด้านขวา แล้วปิดด้วยเส้น hairline
// ========================================================

import { Box, Typography } from '@mui/material';

export default function PageHeader({ title, description, actions, children }) {
  return (
    <Box
      component="header"
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        alignItems: { xs: 'stretch', md: 'flex-end' },
        justifyContent: 'space-between',
        gap: 2,
        pb: 2.5,
        mb: 4,
        borderBottom: 1,
        borderColor: 'divider',
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="h5" component="h1" sx={{ overflowWrap: 'anywhere' }}>
          {title}
        </Typography>
        {description && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
            {description}
          </Typography>
        )}
      </Box>
      {actions && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          {actions}
        </Box>
      )}
      {children}
    </Box>
  );
}
