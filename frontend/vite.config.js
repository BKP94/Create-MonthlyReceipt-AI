import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// ========================================================
// vite.config.js
//
// ตัวแปรสภาพแวดล้อมที่ใช้ (ตั้งใน .env / GitHub Actions):
//   VITE_BASE_PATH  — path ที่แอปถูกเสิร์ฟ เช่น '/Create-MonthlyReceipt-AI/'
//                     บน GitHub Pages ต้องตั้ง ไม่งั้นไฟล์ js/css โหลดไม่เจอ
//   VITE_API_URL    — URL เต็มของ backend เช่น 'https://xxx.azurewebsites.net'
//                     ถ้าไม่ตั้ง จะใช้ '/api' ผ่าน dev proxy (โหมดพัฒนา)
// ========================================================

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const base = env.VITE_BASE_PATH || '/';

  return {
    base,
    build: {
      rollupOptions: {
        output: {
          // แยก vendor ออกเป็นก้อนๆ — เวลา deploy ใหม่ เบราว์เซอร์/service worker
          // จะโหลดซ้ำเฉพาะก้อนที่เปลี่ยน ประหยัดเน็ตมือถือ
          manualChunks: {
            react: ['react', 'react-dom', 'react-router-dom'],
            mui: ['@mui/material', '@mui/icons-material'],
            charts: ['recharts'],
          },
        },
      },
      // ก้อน mui/charts ใหญ่เกิน 500 kB โดยธรรมชาติ — ปิดคำเตือนที่ไม่ได้ช่วยอะไร
      chunkSizeWarningLimit: 900,
    },
    plugins: [
      react(),
      VitePWA({
        // autoUpdate — service worker อัปเดตตัวเองเมื่อมีเวอร์ชันใหม่
        // แล้ว reload หน้าให้อัตโนมัติ (คู่กับ registerSW ใน main.jsx)
        registerType: 'autoUpdate',
        includeAssets: ['icons/apple-touch-icon.png'],
        manifest: {
          name: 'โปรแกรมบริหารการเงินส่วนตัว',
          short_name: 'บริหารการเงิน',
          description: 'บันทึกรายจ่ายรายเดือน ผ่อนชำระ งบประมาณ และประวัติเงินเดือน',
          lang: 'th',
          start_url: base,
          scope: base,
          // standalone — เปิดจากไอคอนหน้าจอโฮมแล้วไม่มีแถบ URL เหมือนแอปจริง
          display: 'standalone',
          orientation: 'portrait',
          background_color: '#F0F4F8',
          theme_color: '#1565C0',
          icons: [
            { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
            // maskable — Android ครอบเป็นวงกลม/สี่เหลี่ยมมนตามธีมเครื่อง
            { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,png,svg,woff2}'],
          // เมื่อเปิด URL ที่ service worker ไม่รู้จัก ให้คืน index.html
          // (จำเป็นสำหรับ client-side routing)
          navigateFallback: `${base}index.html`,
          runtimeCaching: [
            {
              // ฟอนต์ Sarabun จาก Google Fonts — cache ยาว ใช้งาน offline ได้
              urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\//,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts',
                expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
            {
              // ข้อมูลจาก API — เอาของสดก่อนเสมอ ถ้าเน็ตล่มค่อยใช้ของใน cache
              // timeout 5 วิ กันกรณีสัญญาณมือถืออ่อนแล้วหน้าค้าง
              urlPattern: ({ url }) => url.pathname.startsWith('/api'),
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-cache',
                networkTimeoutSeconds: 5,
                expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
          ],
        },
        devOptions: {
          // ปิดไว้ระหว่างพัฒนา — service worker ทำให้ HMR สับสน
          enabled: false,
        },
      }),
    ],
    server: {
      port: 3000,
      proxy: {
        '/api': {
          target: 'http://localhost:5000',
          changeOrigin: true,
        },
      },
    },
  };
});
