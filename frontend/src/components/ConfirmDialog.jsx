import { Button, DialogActions, DialogContent, DialogContentText } from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ResponsiveDialog from './ResponsiveDialog';

export default function ConfirmDialog({ open, title, message, onConfirm, onCancel }) {
  return (
    <ResponsiveDialog
      open={open}
      onClose={onCancel}
      maxWidth="xs"
      title={title || 'ยืนยันการลบ'}
      titleIcon={<WarningAmberIcon color="warning" />}
    >
      <DialogContent>
        <DialogContentText>{message || 'คุณต้องการลบรายการนี้ใช่หรือไม่?'}</DialogContentText>
      </DialogContent>
      {/* mt: auto — ดันปุ่มลงล่างสุดเมื่อ dialog เต็มจอบนมือถือ */}
      <DialogActions sx={{ px: 3, pb: 2, gap: 1, mt: 'auto' }}>
        <Button variant="outlined" onClick={onCancel} fullWidth>ยกเลิก</Button>
        <Button variant="contained" color="error" onClick={onConfirm} fullWidth>ลบ</Button>
      </DialogActions>
    </ResponsiveDialog>
  );
}
