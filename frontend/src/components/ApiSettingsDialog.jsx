// ========================================================
// ApiSettingsDialog.jsx — หน้าตั้งค่า URL ของ backend
//
// ใช้ตอน frontend (GitHub Pages) กับ backend (เครื่องที่บ้าน ผ่าน tunnel)
// อยู่คนละโดเมน และ URL ของ tunnel เปลี่ยนได้ — ผู้ใช้จึงต้องแก้เองได้
// โดยไม่ต้อง build ใหม่
//
// ค่าเก็บใน localStorage ของเบราว์เซอร์นั้นๆ
// (มือถือกับ PC ต้องตั้งแยกกัน แต่ข้อมูลยังเป็นชุดเดียวกันเพราะชี้ backend ตัวเดียว)
// ========================================================

import { useState, useEffect } from 'react';
import {
  Alert, Box, Button, CircularProgress, DialogActions, DialogContent,
  TextField, Typography,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ResponsiveDialog from './ResponsiveDialog';
import { getApiBaseUrl, setApiBaseUrl } from '../config/apiConfig';

export default function ApiSettingsDialog({ open, onClose }) {
  const [url, setUrl] = useState('');
  const [testing, setTesting] = useState(false);
  // result — { ok: boolean, msg: string } | null
  const [result, setResult] = useState(null);

  // เปิด dialog ครั้งใหม่ → โหลดค่าปัจจุบันมาแสดง และล้างผลทดสอบเก่า
  useEffect(() => {
    if (open) {
      setUrl(getApiBaseUrl());
      setResult(null);
    }
  }, [open]);

  // handleTest — ยิงไปที่ /api/expenses เพื่อดูว่าต่อถึงจริงไหม
  // ใช้ fetch ตรงๆ ไม่ผ่าน axios instance เพราะต้องทดสอบ URL ที่ยังไม่ได้บันทึก
  const handleTest = async () => {
    setTesting(true);
    setResult(null);
    const base = url.trim().replace(/\/+$/, '');
    try {
      const res = await fetch(`${base || ''}/api/expenses`, { method: 'GET' });
      if (res.ok) {
        const data = await res.json();
        setResult({ ok: true, msg: `เชื่อมต่อสำเร็จ — พบข้อมูล ${data.length} รายการ` });
      } else {
        setResult({ ok: false, msg: `เซิร์ฟเวอร์ตอบกลับ HTTP ${res.status}` });
      }
    } catch (e) {
      // fetch โยน TypeError ทั้งกรณีต่อไม่ติดและกรณีถูก CORS บล็อก
      // แยกสองกรณีนี้จากฝั่ง JS ไม่ได้ จึงบอกทั้งสองความเป็นไปได้
      setResult({
        ok: false,
        msg: `ต่อไม่ได้ (${e.message}) — ตรวจว่า backend เปิดอยู่ `
           + `และตั้ง AllowedOrigins ให้รวม ${window.location.origin} แล้ว`,
      });
    } finally {
      setTesting(false);
    }
  };

  // handleSave — บันทึกแล้ว reload ทั้งหน้า เพื่อให้ทุกหน้าโหลดข้อมูลใหม่จาก backend ตัวใหม่
  const handleSave = () => {
    setApiBaseUrl(url);
    window.location.reload();
  };

  return (
    <ResponsiveDialog open={open} onClose={onClose} maxWidth="sm" title="ตั้งค่าการเชื่อมต่อ">
      <DialogContent>
        <Typography variant="body2" color="text.secondary" mb={2}>
          ที่อยู่ของ backend ที่เครื่องนี้จะเรียกข้อมูล
          เว้นว่างไว้ = ใช้โดเมนเดียวกับหน้าเว็บนี้ (สำหรับตอนรันบนเครื่องตัวเอง)
        </Typography>

        <TextField
          label="URL ของ backend"
          fullWidth
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://xxxx-xxxx.trycloudflare.com"
          helperText="ใส่แค่ที่อยู่หลัก ไม่ต้องมี /api ต่อท้าย"
          // มือถือไม่ต้องขึ้นตัวใหญ่/แก้คำอัตโนมัติสำหรับ URL
          inputProps={{ autoCapitalize: 'none', autoCorrect: 'off', spellCheck: false }}
        />

        {result && (
          <Alert
            severity={result.ok ? 'success' : 'error'}
            icon={result.ok ? <CheckCircleIcon fontSize="inherit" /> : undefined}
            sx={{ mt: 2 }}
          >
            {result.msg}
          </Alert>
        )}

        <Box mt={2}>
          <Button onClick={handleTest} disabled={testing} variant="outlined" fullWidth>
            {testing ? <CircularProgress size={22} /> : 'ทดสอบการเชื่อมต่อ'}
          </Button>
        </Box>
      </DialogContent>

      {/* mt: auto — ดันปุ่มลงล่างสุดเมื่อ dialog เต็มจอบนมือถือ */}
      <DialogActions sx={{ px: 3, pb: 2, gap: 1, mt: 'auto' }}>
        <Button variant="outlined" onClick={onClose} fullWidth>ยกเลิก</Button>
        <Button variant="contained" onClick={handleSave} fullWidth>บันทึก</Button>
      </DialogActions>
    </ResponsiveDialog>
  );
}
