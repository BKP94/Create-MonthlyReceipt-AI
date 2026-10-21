// ========================================================
// formatters.js — ฟังก์ชันช่วยจัดรูปแบบข้อมูลสำหรับแสดงผล
// ใช้งานร่วมกันทุกหน้า import มาใช้ได้เลย
// ========================================================

// formatCurrency — แสดงตัวเลขเงินแบบมีทศนิยม 2 ตำแหน่ง พร้อม comma คั่น
// ตัวอย่าง: 12345.6 → "12,345.60"
// Intl.NumberFormat คือ API มาตรฐานของ JavaScript สำหรับ format ตัวเลข
export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return '0.00';
  return new Intl.NumberFormat('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

// formatCurrencyShort — แสดงตัวเลขย่อสำหรับแกน Y ของ BarChart
// ตัวอย่าง: 1,500,000 → "1.5ล."  |  25000 → "25.0K"  |  999 → "999"
export const formatCurrencyShort = (amount) => {
  if (!amount) return '0';
  if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}ล.`;
  if (amount >= 1000) return `${(amount / 1000).toFixed(1)}K`;
  return amount.toFixed(0);
};

// thaiShortMonths — ชื่อเดือนภาษาไทยแบบย่อ (ใช้ใน BarChart)
// index 0 เว้นว่างเพราะเดือนเริ่มที่ 1
export const thaiShortMonths = [
  '', 'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
];

// thaiFullMonths — ชื่อเดือนภาษาไทยแบบเต็ม (ใช้ใน dropdown เลือกเดือน)
export const thaiFullMonths = [
  '', 'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

// categoryConfig — config หมวดหมู่รายจ่าย
// label: ชื่อภาษาไทยที่แสดงใน Chip
// color: สีของ MUI Chip (error=แดง, primary=น้ำเงิน, success=เขียว, default=เทา)
export const categoryConfig = {
  debt:    { label: 'หนี้/ผ่อน',    color: 'error'   },
  daily:   { label: 'ประจำวัน',     color: 'primary' },
  savings: { label: 'เงินเก็บ',     color: 'success' },
  other:   { label: 'อื่นๆ',        color: 'default' },
};

// YEARS — อาร์เรย์ปี ค.ศ. ตั้งแต่ 2020 ถึงปีปัจจุบัน + 5 สำหรับ dropdown เลือกปี
// คำนวณจากปีปัจจุบัน จะได้ไม่หมดอายุเมื่อเลยปี 2030
const LAST_YEAR = new Date().getFullYear() + 5;
export const YEARS = Array.from({ length: LAST_YEAR - 2020 + 1 }, (_, i) => 2020 + i);

// formatDate — แสดงวันที่เป็น dd/mm/yyyy (พ.ศ.)
// อ่านจาก string ตรงๆ ("2026-10-31" หรือ "2026-10-31T00:00:00") ไม่ผ่าน new Date()
// เพื่อไม่ให้ timezone เลื่อนวัน และไม่ขึ้นกับ locale ของเบราว์เซอร์
export const formatDate = (value) => {
  if (!value) return '-';
  const m = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return String(value);
  return `${m[3]}/${m[2]}/${Number(m[1]) + 543}`;
};

// formatDateTime — วันที่ + เวลา (ใช้กับ UpdatedAt) เช่น 21/10/2569 14:05
export const formatDateTime = (value) => {
  if (!value) return '-';
  const m = String(value).match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/);
  if (!m) return formatDate(value);
  return `${m[3]}/${m[2]}/${Number(m[1]) + 543} ${m[4]}:${m[5]}`;
};
