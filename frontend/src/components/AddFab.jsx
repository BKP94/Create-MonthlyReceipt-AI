// ========================================================
// AddFab.jsx — ปุ่มลอย "เพิ่ม" มุมขวาล่าง สำหรับมือถือ
// แทนปุ่ม "เพิ่ม..." ใน header ที่กดยากเพราะอยู่ไกลจากนิ้วโป้ง
//
// bottom ใช้ env(safe-area-inset-bottom) เผื่อแถบ home indicator
// ของ iPhone และ gesture bar ของ Android ไม่ให้ทับปุ่ม
// ========================================================

import { Fab } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

export default function AddFab({ onClick, label = 'เพิ่ม' }) {
  return (
    <Fab
      color="primary"
      aria-label={label}
      onClick={onClick}
      sx={{
        position: 'fixed',
        right: 16,
        bottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
        zIndex: (t) => t.zIndex.appBar - 1,
      }}
    >
      <AddIcon />
    </Fab>
  );
}
