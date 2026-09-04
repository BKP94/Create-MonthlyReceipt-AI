// ========================================================
// generate-icons.mjs — สร้างไอคอน PNG ของ PWA จากโค้ด (ไม่ต้องพึ่ง lib ภายนอก)
//
// รันด้วย: node scripts/generate-icons.mjs
// ผลลัพธ์: public/icons/*.png
//
// วาดด้วยการ render ที่ความละเอียด 4 เท่าแล้วย่อลง (supersampling)
// เพื่อให้ขอบมนเรียบ ไม่เป็นรอยหยัก
// ========================================================

import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '../public/icons');

const BG = [0x15, 0x65, 0xc0];      // #1565C0 — primary.main ของ theme
const FG = [0xff, 0xff, 0xff];      // ขาว

// ---------- PNG encoder ----------
const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

const crc32 = (buf) => {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
};

const chunk = (type, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
};

// encodePng — rgba: Uint8Array ขนาด w*h*4
function encodePng(w, h, rgba) {
  // PNG เก็บทีละแถว โดยมี filter byte (0 = None) นำหน้าแต่ละแถว
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0;
    Buffer.from(rgba.buffer, y * w * 4, w * 4).copy(raw, y * (w * 4 + 1) + 1);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;   // bit depth
  ihdr[9] = 6;   // color type 6 = RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ---------- การวาด ----------
// inRoundedRect — จุด (x,y) อยู่ในสี่เหลี่ยมมุมมนหรือไม่ (พิกัด 0..1)
function inRoundedRect(x, y, rx0, ry0, rx1, ry1, r) {
  if (x < rx0 || x > rx1 || y < ry0 || y > ry1) return false;
  const cx = Math.min(Math.max(x, rx0 + r), rx1 - r);
  const cy = Math.min(Math.max(y, ry0 + r), ry1 - r);
  return (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
}

// แท่งกราฟ 3 แท่งไล่ระดับขึ้น — สื่อถึง "แอปการเงิน" อ่านออกแม้ขนาดเล็ก
const BARS = [
  { x0: 0.24, x1: 0.38, top: 0.56 },
  { x0: 0.43, x1: 0.57, top: 0.40 },
  { x0: 0.62, x1: 0.76, top: 0.26 },
];
const BAR_BOTTOM = 0.76;

// render — คืน RGBA ของไอคอนขนาด size
// maskable=true → พื้นเต็มสี่เหลี่ยม (ไม่มีมุมมน) และย่อเนื้อหาลง
//                 เพื่อให้ Android crop เป็นวงกลมได้โดยไม่ตัดกราฟ
function render(size, maskable) {
  const SS = 4;                 // supersampling factor
  const N = size * SS;
  const out = new Uint8Array(size * size * 4);

  // safe zone ของ maskable icon = 80% ตรงกลาง → ย่อเนื้อหาเหลือ 0.72
  const scale = maskable ? 0.72 : 1;
  const shift = (1 - scale) / 2;
  const map = (v) => v * scale + shift;

  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let bgHits = 0, fgHits = 0;

      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const x = (px * SS + sx + 0.5) / N;
          const y = (py * SS + sy + 0.5) / N;

          const onBg = maskable || inRoundedRect(x, y, 0, 0, 1, 1, 0.22);
          if (!onBg) continue;
          bgHits++;

          // เนื้อหาถูกย่อ/เลื่อนตาม scale เมื่อเป็น maskable
          const ux = (x - shift) / scale;
          const uy = (y - shift) / scale;

          // เส้นฐาน
          let onFg = inRoundedRect(ux, uy, 0.20, BAR_BOTTOM, 0.80, BAR_BOTTOM + 0.055, 0.027);
          // แท่งกราฟ
          if (!onFg) {
            for (const b of BARS) {
              if (inRoundedRect(ux, uy, b.x0, b.top, b.x1, BAR_BOTTOM - 0.02, 0.035)) { onFg = true; break; }
            }
          }
          if (onFg) fgHits++;
        }
      }

      const total = SS * SS;
      const alpha = bgHits / total;                       // ความทึบของพื้นหลัง (ขอบมน)
      const fgRatio = bgHits ? fgHits / bgHits : 0;       // สัดส่วนสีขาวในพิกเซลนี้
      const i = (py * size + px) * 4;
      for (let c = 0; c < 3; c++) {
        out[i + c] = Math.round(BG[c] * (1 - fgRatio) + FG[c] * fgRatio);
      }
      out[i + 3] = Math.round(alpha * 255);
    }
  }
  return out;
}

mkdirSync(OUT_DIR, { recursive: true });

const targets = [
  { file: 'icon-192.png',          size: 192, maskable: false },
  { file: 'icon-512.png',          size: 512, maskable: false },
  { file: 'icon-maskable-512.png', size: 512, maskable: true  },
  // apple-touch-icon ไม่รองรับความโปร่งใส/มุมมน — iOS ครอบมุมให้เอง
  { file: 'apple-touch-icon.png',  size: 180, maskable: true  },
];

for (const t of targets) {
  writeFileSync(resolve(OUT_DIR, t.file), encodePng(t.size, t.size, render(t.size, t.maskable)));
  console.log('generated', t.file, `${t.size}x${t.size}`);
}
