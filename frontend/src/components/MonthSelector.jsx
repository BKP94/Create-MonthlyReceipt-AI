// ========================================================
// MonthSelector.jsx — ตัวเลือกเดือน/ปี พร้อมปุ่มเลื่อนถอยหน้า
//
// บนมือถือ: กินความกว้างเต็มแถว, ปุ่มลูกศรและ dropdown สูง 44px (touch target)
//           และซ่อนข้อความ "มกราคม 2569" ท้ายแถว เพราะซ้ำกับ dropdown
// บน desktop: เรียงในบรรทัดเดียวเหมือนเดิม
// ========================================================

import { Box, FormControl, InputLabel, MenuItem, Select, IconButton, Typography } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { thaiFullMonths, YEARS } from '../utils/formatters';
import useIsMobile from '../hooks/useIsMobile';

// บนมือถือ (< md) ทุกตัวควบคุมสูงอย่างน้อย 44px — ขนาดเป้าสัมผัสขั้นต่ำ
// ใช้ breakpoint ใน sx แทนการสลับ size ตาม hook เพื่อให้ถูกตั้งแต่ render แรก
const arrowSx = { minWidth: { xs: 44, md: 34 }, minHeight: { xs: 44, md: 34 } };
// ตั้งที่ .MuiSelect-select ด้วย เพราะเป็นส่วนที่แตะแล้วเมนูเปิดจริง (กรอบนอกสูงอย่างเดียวไม่พอ)
// ซ้อน selector ใต้ root เพื่อให้ specificity ชนะสไตล์ตั้งต้นของ MUI เสมอ ไม่ขึ้นกับลำดับ CSS
export const selectSx = {
  '& .MuiInputBase-root': { minHeight: { xs: 44, md: 40 } },
  '& .MuiInputBase-root .MuiSelect-select': {
    minHeight: { xs: 44, md: 'auto' },
    boxSizing: 'border-box',
    display: 'flex',
    alignItems: 'center',
    py: { xs: 0, md: '8.5px' },
  },
};

export default function MonthSelector({ year, month, onChange }) {
  const isMobile = useIsMobile();

  const prev = () => {
    if (month === 1) onChange(year - 1, 12);
    else onChange(year, month - 1);
  };
  const next = () => {
    if (month === 12) onChange(year + 1, 1);
    else onChange(year, month + 1);
  };

  return (
    <Box
      display="flex"
      alignItems="center"
      gap={1}
      flexWrap="wrap"
      sx={{ width: { xs: '100%', md: 'auto' } }}
    >
      <IconButton onClick={prev} size="small" sx={arrowSx} aria-label="เดือนก่อนหน้า">
        <ChevronLeftIcon />
      </IconButton>

      {/* flexGrow บนมือถือ → dropdown ยืดเต็มพื้นที่ที่เหลือ กดง่ายขึ้น */}
      <FormControl size="small" sx={{ minWidth: 130, flexGrow: { xs: 1, md: 0 }, ...selectSx }}>
        <InputLabel id="month-select-label">เดือน</InputLabel>
        <Select labelId="month-select-label" value={month} label="เดือน" onChange={(e) => onChange(year, e.target.value)}>
          {thaiFullMonths.slice(1).map((name, i) => (
            <MenuItem key={i + 1} value={i + 1}>{name}</MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl size="small" sx={{ minWidth: 90, ...selectSx }}>
        <InputLabel id="year-select-label">ปี</InputLabel>
        <Select labelId="year-select-label" value={year} label="ปี" onChange={(e) => onChange(e.target.value, month)}>
          {YEARS.map((y) => (
            <MenuItem key={y} value={y}>{y + 543}</MenuItem>
          ))}
        </Select>
      </FormControl>

      <IconButton onClick={next} size="small" sx={arrowSx} aria-label="เดือนถัดไป">
        <ChevronRightIcon />
      </IconButton>

      {/* ข้อความสรุป — ซ่อนบนมือถือเพราะซ้ำกับ dropdown และทำให้ตกบรรทัด */}
      {!isMobile && (
        <Typography variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
          {thaiFullMonths[month]} {year + 543}
        </Typography>
      )}
    </Box>
  );
}
