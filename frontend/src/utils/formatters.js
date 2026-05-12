export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return '0.00';
  return new Intl.NumberFormat('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatCurrencyShort = (amount) => {
  if (!amount) return '0';
  if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}ล.`;
  if (amount >= 1000) return `${(amount / 1000).toFixed(1)}K`;
  return amount.toFixed(0);
};

export const thaiShortMonths = [
  '', 'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
];

export const thaiFullMonths = [
  '', 'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

export const categoryConfig = {
  debt:    { label: 'หนี้/ผ่อน',    color: 'error'   },
  daily:   { label: 'ประจำวัน',     color: 'primary' },
  savings: { label: 'เงินเก็บ',     color: 'success' },
  other:   { label: 'อื่นๆ',        color: 'default' },
};

export const YEARS = Array.from({ length: 11 }, (_, i) => 2020 + i);
