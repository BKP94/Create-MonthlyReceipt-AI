import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

export default function ConfirmDialog({ open, title, message, onConfirm, onCancel }) {
  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <WarningAmberIcon color="warning" />
        {title || 'ยืนยันการลบ'}
      </DialogTitle>
      <DialogContent>
        <DialogContentText>{message || 'คุณต้องการลบรายการนี้ใช่หรือไม่?'}</DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        <Button variant="outlined" onClick={onCancel} fullWidth>ยกเลิก</Button>
        <Button variant="contained" color="error" onClick={onConfirm} fullWidth>ลบ</Button>
      </DialogActions>
    </Dialog>
  );
}
