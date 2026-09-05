# ใช้แอปจากมือถือ โดยไม่ต้องพึ่ง Cloud

ข้อมูลอยู่ใน `data/db/finance.db` บนเครื่องที่บ้านเหมือนเดิม ไม่ต้องย้ายไปไหน
ไม่ต้องสมัคร cloud hosting ไม่ต้องผูกบัตรเครดิต

```
มือถือ ──HTTPS──> Tailscale ──> PC ที่บ้าน
                                 └─ FinanceApi (Windows Service, port 5000)
                                    ├─ /api/*  → ข้อมูล
                                    ├─ /       → หน้าเว็บ (wwwroot)
                                    └─ finance.db  ← ข้อมูลอยู่ตรงนี้
```

**หน้าเว็บกับ API อยู่โดเมนเดียวกัน** — backend เสิร์ฟไฟล์หน้าเว็บเองจาก `wwwroot`
ทำแบบนี้เพื่อตัดปัญหา cross-origin ทิ้งทั้งหมด (อ่านเหตุผลใน [ทำไมไม่ใช้ GitHub Pages](#ทำไมไม่ใช้-github-pages-เสิร์ฟหน้าเว็บ))

---

## สถานะปัจจุบันของเครื่องนี้

| อย่าง | ค่า |
|---|---|
| URL ใช้งานจริง | `https://desktop-ptt1otr.tail2d0ea0.ts.net` |
| Windows Service | `FinanceApi` (Automatic, รีสตาร์ทเองเมื่อแครช) |
| Binary | `backend\publish\FinanceApi.exe` |
| Kestrel ฟังที่ | `127.0.0.1:5000` เท่านั้น |
| Tailscale | `serve --bg 5000` โหมด **tailnet only** (Funnel ปิด) |

---

## ขั้นตอนที่ 1 — ติดตั้ง backend เป็น Windows Service

**PowerShell แบบ Run as administrator:**

```powershell
powershell -ExecutionPolicy Bypass -File C:\Project_BEER\Monthly_Receipt\scripts\install-service.ps1
```

สคริปต์จะ build frontend → ก๊อปเข้า `wwwroot` → publish → สร้าง service → เริ่มและทดสอบให้

### คำสั่งที่ใช้บ่อย

```powershell
Get-Service FinanceApi
Restart-Service FinanceApi
```

| อยากทำอะไร | สคริปต์ |
|---|---|
| **แก้โค้ดแล้วอัปเดต** (ทั้ง C# และ frontend) | `scripts\update-service.ps1` |
| ถอน service (ข้อมูลไม่หาย) | `scripts\uninstall-service.ps1` |

> ⚠️ แก้โค้ดแล้วรัน `dotnet run` เฉยๆ ไม่พอ — service ถือ port 5000 อยู่ จะชนกัน
> ต้องรัน `update-service.ps1` เท่านั้น

> ฐานข้อมูลอยู่ที่ `DataPath` ใน `appsettings.json` ซึ่งอยู่**นอก**โฟลเดอร์ `backend\publish`
> การ publish ทับจึงไม่แตะข้อมูลเดิม

---

## ขั้นตอนที่ 2 — Tailscale

### ⚠️ อ่านก่อน — เรื่องความปลอดภัย

**Backend ไม่มีระบบล็อกอินเลย** ใครเข้าถึง URL ได้ อ่านและแก้ข้อมูลการเงินได้ทั้งหมด
วิธีที่เลือกจึงต้องมี "ด่าน" ไม่ใช่แค่ต่อได้

| วิธี | URL คงที่ | มีด่านกันคนอื่น | ต้องมีโดเมน |
|---|---|---|---|
| **A. Tailscale** | ✅ | ✅ เฉพาะเครื่องที่ล็อกอินบัญชีคุณ | ❌ |
| B. Cloudflare Tunnel + โดเมน + Access | ✅ | ✅ ล็อกอินอีเมล | ✅ ~300฿/ปี |
| C. Cloudflare quick tunnel | ❌ | ❌ **ไม่มีเลย** | ❌ |

> **อย่าใช้ C เป็นการถาวร** — "URL เดายาก" ไม่ใช่ "ปลอดภัย"

### ติดตั้ง (วิธี A)

```powershell
winget install --id Tailscale.Tailscale
```

> ถ้าขึ้น `winget : The term 'winget' is not recognized` แปลว่า PATH ขาด ไม่ใช่ไม่มี winget:
> ```powershell
> [Environment]::SetEnvironmentVariable('PATH', [Environment]::GetEnvironmentVariable('PATH','User') + ';' + "$env:LOCALAPPDATA\Microsoft\WindowsApps", 'User')
> ```
> แล้วปิด-เปิด PowerShell ใหม่

1. ล็อกอิน: `tailscale up` (เลือก Sign in with GitHub)
2. ลงแอป Tailscale บนมือถือ **ล็อกอินบัญชีเดียวกัน** และเปิดสวิตช์ค้างไว้
3. เปิด [login.tailscale.com/admin/dns](https://login.tailscale.com/admin/dns) → เปิด **MagicDNS** และ **HTTPS Certificates** (ทั้งสองอัน ข้ามไม่ได้)
4. เสิร์ฟทั้งหน้าเว็บและ API:
   ```powershell
   tailscale serve --bg 5000
   tailscale serve status
   ```
   ต้องขึ้นว่า `(tailnet only)` — ถ้าขึ้น Funnel แปลว่าเปิดสาธารณะ ให้ปิดทันที

เสร็จแล้วเปิด URL ที่ได้บนมือถือได้เลย **ไม่ต้องตั้งค่าอะไรในแอปเพิ่ม**
เมนูเบราว์เซอร์ → **Add to Home Screen** → ใช้เป็นแอปเต็มจอ

**ข้อแลก:** มือถือต้องเปิด Tailscale ไว้ตอนใช้งาน (เหมือน VPN)

### ใครมี URL ก็เข้าได้ไหม?

**ไม่ได้** — กัน 3 ชั้น:

1. `tailscale serve` โหมด tailnet only (ไม่ใช่ Funnel) → เฉพาะเครื่องในบัญชีคุณ
2. ชื่อโดเมนชี้ไป `100.x.x.x` (วง CGNAT) → route ไม่ถึงจากอินเทอร์เน็ต
3. Kestrel ฟังแค่ `127.0.0.1:5000` → เครื่องอื่นใน Wi-Fi บ้านก็ยิงตรงไม่ได้

**ความเสี่ยงที่เหลือ:** บัญชี Tailscale คือกุญแจดอกเดียว ใครเข้าบัญชี GitHub ของคุณได้
จะเพิ่มเครื่องเข้า tailnet แล้วเห็นข้อมูลทั้งหมด → **ควรเปิด 2FA บน GitHub**

ชื่อโดเมนไม่ลับ (อยู่ใน Certificate Transparency log สาธารณะ) แต่รู้ชื่อแล้วก็เข้าไม่ได้อยู่ดี

---

## ทำไมไม่ใช้ GitHub Pages เสิร์ฟหน้าเว็บ

ลองแล้วไม่ผ่าน — หน้าเว็บบนโดเมน public ยิงมาหา backend ที่อยู่วง Tailscale เจอ 2 กำแพงพร้อมกัน:

1. **Chrome Secure DNS (DNS-over-HTTPS)** ข้าม MagicDNS ของ Tailscale → `DNS_PROBE_FINISHED_NXDOMAIN`
   แก้ได้ด้วยการปิด secure DNS ที่ `chrome://settings/security` แต่ต้องไปตั้งทุกเครื่อง
2. **Private Network Access** — Chrome บล็อกหน้าเว็บ public ที่ยิงไป IP วงส่วนตัว
   (แก้ฝั่ง server ได้ด้วย header `Access-Control-Allow-Private-Network` ซึ่งใส่ไว้แล้วใน `Program.cs`)

เสิร์ฟจากโดเมนเดียวกันตัดปัญหาทั้งคู่ทิ้ง และไม่ต้องกรอก URL ในแอปอีก

workflow `.github/workflows/deploy-pages.yml` ยังอยู่ ใช้ได้ถ้าวันหลังย้าย backend ขึ้น cloud จริง
(ตอนนั้นค่อยตั้ง `AllowedOrigins` ใน `appsettings.json` ให้ตรงโดเมนหน้าเว็บ)

> ⚠️ **อย่า commit ข้อมูลการเงินจริงขึ้น repo public** — `data/samples/` และ `data/db/`
> อยู่ใน `.gitignore` แล้ว

---

## ปัญหาที่เจอบ่อย

| อาการ | สาเหตุ / วิธีแก้ |
|---|---|
| เข้า URL ไม่ได้ ขึ้น `DNS_PROBE_FINISHED_NXDOMAIN` | Chrome เปิด Secure DNS อยู่ → ปิดที่ `chrome://settings/security` |
| ต่อได้จาก PC แต่มือถือไม่ได้ | มือถือเปิดสวิตช์ Tailscale หรือยัง (`tailscale status` จะขึ้น offline ถ้าปิด) |
| เข้าเว็บได้แต่ไม่มีข้อมูล | `Get-Service FinanceApi` ยัง Running อยู่ไหม |
| แก้โค้ดแล้วไม่มีอะไรเปลี่ยน | รัน `scripts\update-service.ps1` (แบบ admin) |
| หน้าเว็บแสดงของเก่า | service worker cache → Ctrl+Shift+R บน PC / ปิดแอปเปิดใหม่บนมือถือ |
| สคริปต์ `.ps1` ขึ้น `The Try statement is missing its Catch` | ไฟล์หาย BOM → Windows PowerShell 5.1 อ่านภาษาไทยเพี้ยนจนพัง ต้องบันทึกเป็น UTF-8 **with BOM** |
| `tailscale serve` ขึ้น Funnel แทน tailnet only | `tailscale funnel --https=443 off` |

---

## สำรองข้อมูล

ข้อมูลทั้งหมดอยู่ในไฟล์เดียว:

```powershell
Stop-Service FinanceApi
Copy-Item C:\Project_BEER\Monthly_Receipt\data\db\finance.db "$env:USERPROFILE\Documents\finance-backup-$(Get-Date -f yyyyMMdd).db"
Start-Service FinanceApi
```
