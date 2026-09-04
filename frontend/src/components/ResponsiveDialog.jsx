// ========================================================
// ResponsiveDialog.jsx — Dialog ที่กลายเป็นเต็มจอบนมือถือ
//
// บนจอเล็ก dialog แบบลอยกลางจอเหลือพื้นที่กรอกฟอร์มน้อยมาก
// และเมื่อคีย์บอร์ดเด้งขึ้นมาจะบังปุ่มบันทึก — จึงใช้ fullScreen แทน
// พร้อมปุ่ม X ปิดที่หัว dialog (เพราะกดนอกกรอบเพื่อปิดไม่ได้แล้ว)
//
// รับ props เดียวกับ MUI Dialog ทุกตัว ส่งต่อผ่าน ...rest
// title — ถ้าส่งมา จะ render DialogTitle ให้เอง (พร้อมปุ่มปิดบนมือถือ)
// ========================================================

import { Dialog, DialogTitle, IconButton, Box } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import useIsMobile from '../hooks/useIsMobile';

export default function ResponsiveDialog({ title, titleIcon, children, onClose, ...rest }) {
  const isMobile = useIsMobile();

  return (
    <Dialog
      fullScreen={isMobile}
      fullWidth
      onClose={onClose}
      // เว้นพื้นที่ safe area บน/ล่าง เมื่อเต็มจอ (notch + home indicator)
      PaperProps={isMobile ? {
        sx: {
          pt: 'env(safe-area-inset-top, 0px)',
          pb: 'env(safe-area-inset-bottom, 0px)',
        },
      } : undefined}
      {...rest}
    >
      {title && (
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, pr: 1 }}>
          {titleIcon}
          <Box sx={{ flexGrow: 1 }}>{title}</Box>
          {isMobile && onClose && (
            <IconButton onClick={onClose} edge="end" aria-label="ปิด">
              <CloseIcon />
            </IconButton>
          )}
        </DialogTitle>
      )}
      {children}
    </Dialog>
  );
}
