# ใช้แอปจากมือถือ โดยไม่ต้องพึ่ง Cloud

แนวทางนี้ **ไม่ต้องสมัคร cloud hosting และไม่ต้องผูกบัตรเครดิต**
ข้อมูลยังอยู่ใน `data/db/finance.db` บนเครื่องที่บ้านเหมือนเดิม ไม่ต้องย้ายไปไหน

```
มือถือ  ──HTTPS──>  tunnel  ──>  PC ที่บ้าน
                                  ├─ FinanceApi (Windows Service, port 5000)
                                  └─ finance.db  ← ข้อมูลอยู่ตรงนี้
หน้าเว็บ (HTML/JS) โหลดจาก GitHub Pages — เป็นแค่ไฟล์ ไม่มีข้อมูลอยู่ในนั้น
```

มี 2 ขั้นตอนที่แก้คนละปัญหา ต้องทำทั้งคู่:

| ขั้นตอน | แก้ปัญหาอะไร |
|---|---|
| **1. ติดตั้งเป็น Windows Service** | backend เริ่มเองตอนเปิดเครื่อง ไม่ต้องล็อกอิน ไม่มีหน้าต่าง cmd ค้าง แครชแล้วรีสตาร์ทเอง |
| **2. เปิด tunnel** | มือถือที่อยู่นอกบ้านเข้าถึง backend ได้ |

---

## ขั้นตอนที่ 1 — ติดตั้ง backend เป็น Windows Service

เปิด **PowerShell แบบ Run as administrator** แล้วรัน:

```powershell
powershell -ExecutionPolicy Bypass -File C:\Project_BEER\Monthly_Receipt\scripts\install-service.ps1
```

สคริปต์จะ publish โค้ด → สร้าง service ชื่อ `FinanceApi` → ตั้งให้เริ่มอัตโนมัติ → เริ่มและทดสอบให้

### ⚠️ ต้องแก้ `start_hidden.vbs` ด้วย

ไฟล์นั้นเปิด backend ด้วย `dotnet run` อยู่ — ถ้าปล่อยไว้จะมี backend **2 ตัวแย่ง port 5000** กัน
ให้ลบบรรทัด `dotnet run` ออก เหลือแค่บรรทัด frontend (หรือลบทั้งไฟล์ถ้าไม่ได้ใช้ dev server แล้ว)

### คำสั่งที่ใช้บ่อย

```powershell
Get-Service FinanceApi
Restart-Service FinanceApi
```

| อยากทำอะไร | สคริปต์ |
|---|---|
| แก้โค้ด C# แล้วอัปเดต service | `scripts\update-service.ps1` |
| ถอน service (ข้อมูลไม่หาย) | `scripts\uninstall-service.ps1` |

> ฐานข้อมูลอยู่ที่ `DataPath` ใน `appsettings.json` ซึ่งอยู่**นอก**โฟลเดอร์ `backend\publish`
> การ publish ทับจึงไม่แตะข้อมูลเดิม

---

## ขั้นตอนที่ 2 — เปิด tunnel ให้มือถือเข้าถึง

### ⚠️ อ่านก่อนเลือก — เรื่องความปลอดภัย

**Backend ตัวนี้ไม่มีระบบล็อกอินเลย** ใครก็ตามที่เข้าถึง URL ได้ จะอ่านและแก้ข้อมูลการเงินของคุณได้ทั้งหมด
เพราะฉะนั้นวิธีที่เลือกต้องมี "ด่าน" กันคนอื่นด้วย ไม่ใช่แค่ต่อได้

| วิธี | URL คงที่ | มีด่านกันคนอื่น | ต้องมีโดเมน | เหมาะกับ |
|---|---|---|---|---|
| **A. Tailscale** | ✅ | ✅ (เฉพาะเครื่องที่ล็อกอินบัญชีคุณ) | ❌ | **แนะนำ** — ฟรี ปลอดภัย ตั้งครั้งเดียวจบ |
| **B. Cloudflare Tunnel + โดเมน + Access** | ✅ | ✅ (ล็อกอินอีเมล) | ✅ (~300฿/ปี) | อยากได้ URL สวยๆ ไม่ต้องลงแอปที่มือถือ |
| **C. Cloudflare quick tunnel** | ❌ เปลี่ยนทุกครั้งที่รีสตาร์ท | ❌ **ไม่มี** | ❌ | ทดลองชั่วคราวเท่านั้น |

> **อย่าใช้ C เป็นการถาวร** — URL เดาไม่ง่ายก็จริง แต่ "เดายาก" ไม่ใช่ "ปลอดภัย"
> และ URL ที่เปลี่ยนทุกครั้งแปลว่าต้องมาแก้ค่าในแอปใหม่ทุกครั้งที่รีสตาร์ทเครื่อง

---

### วิธี A — Tailscale (แนะนำ)

Tailscale สร้างเครือข่ายส่วนตัวระหว่างอุปกรณ์ของคุณเอง มือถือจะเห็น PC ได้เหมือนอยู่วง LAN เดียวกัน
แม้อยู่คนละที่ — และ **ไม่มีใครนอกบัญชีคุณเข้าถึงได้เลย**

1. สมัครและติดตั้งบน PC — [tailscale.com/download](https://tailscale.com/download)
   ```powershell
   winget install --id Tailscale.Tailscale
   ```
2. ติดตั้งแอป Tailscale บนมือถือ (App Store / Play Store) แล้ว **ล็อกอินบัญชีเดียวกัน**
3. เปิด [login.tailscale.com/admin/dns](https://login.tailscale.com/admin/dns) → เปิด **MagicDNS** และ **HTTPS Certificates**
4. บน PC เปิด PowerShell แล้วสั่งให้ Tailscale เสิร์ฟ backend ผ่าน HTTPS:
   ```powershell
   tailscale serve --bg 5000
   tailscale serve status
   ```
   จะได้ URL หน้าตาแบบ `https://ชื่อเครื่อง.ชื่อ-tailnet.ts.net`

   > syntax ของ `tailscale serve` ต่างกันตามเวอร์ชัน — ถ้าคำสั่งข้างบนไม่ผ่าน ลอง `tailscale serve --help`

5. เอา URL นั้นไปกรอกในแอป (ขั้นตอนที่ 3)
6. เพิ่ม URL นี้เข้า `AllowedOrigins`? **ไม่ต้อง** — `AllowedOrigins` คือโดเมนของ*หน้าเว็บ* ไม่ใช่ของ API

**ข้อแลก:** มือถือต้องเปิด Tailscale ไว้ตอนใช้งาน (กินแบตนิดหน่อย เหมือน VPN)

---

### วิธี B — Cloudflare Tunnel + โดเมนของตัวเอง

ต้องมีโดเมนที่ย้าย nameserver มาอยู่กับ Cloudflare แล้ว

1. ติดตั้ง cloudflared:
   ```powershell
   winget install --id Cloudflare.cloudflared
   ```
2. ล็อกอินและสร้าง tunnel:
   ```powershell
   cloudflared tunnel login
   cloudflared tunnel create finance
   cloudflared tunnel route dns finance api.yourdomain.com
   ```
3. สร้างไฟล์ config ที่ `C:\Users\<ชื่อคุณ>\.cloudflared\config.yml`:
   ```yaml
   tunnel: finance
   credentials-file: C:\Users\<ชื่อคุณ>\.cloudflared\<tunnel-id>.json

   ingress:
     - hostname: api.yourdomain.com
       service: http://localhost:5000
     - service: http_status:404
   ```
4. ติดตั้ง cloudflared เป็น Windows Service ด้วย (จะได้เริ่มเองตอนเปิดเครื่องเหมือนกัน):
   ```powershell
   cloudflared service install
   ```
5. **ใส่ด่านล็อกอิน** (ข้ามขั้นนี้ไม่ได้ ไม่งั้นข้อมูลการเงินเปิดสาธารณะ):
   เข้า [one.dash.cloudflare.com](https://one.dash.cloudflare.com) → **Access** → **Applications** → **Add an application**
   → Self-hosted → ใส่ `api.yourdomain.com` → สร้าง policy แบบ **Allow** เฉพาะอีเมลของคุณ

   > **ข้อควรรู้:** Access ใช้ cookie ในเบราว์เซอร์ — ถ้าแอปเรียก API ข้ามโดเมนแล้วโดน Access เด้ง
   > อาจต้องเปิดหน้า `https://api.yourdomain.com` ในเบราว์เซอร์ตัวเดียวกันเพื่อล็อกอินก่อนหนึ่งครั้ง

---

### วิธี C — quick tunnel (ทดลองเท่านั้น)

```powershell
winget install --id Cloudflare.cloudflared
cloudflared tunnel --url http://localhost:5000
```

จะพิมพ์ URL แบบ `https://xxxx-yyyy-zzzz.trycloudflare.com` ออกมาบนหน้าจอ
**ปิดหน้าต่างนี้เมื่อไหร่ tunnel ก็ดับ และเปิดใหม่จะได้ URL คนละอันทุกครั้ง**

---

## ขั้นตอนที่ 3 — บอกแอปว่า backend อยู่ที่ไหน

หน้าเว็บบน GitHub Pages ไม่รู้จัก URL ของ tunnel — ต้องกรอกเอง (เก็บไว้ในเบราว์เซอร์เครื่องนั้น):

1. เปิดแอป → กดไอคอน **เกียร์/เชื่อมต่อ** มุมขวาบนของแถบสีน้ำเงิน
2. วาง URL ของ tunnel ลงไป (ใส่แค่ที่อยู่หลัก **ไม่ต้องมี `/api`** ต่อท้าย)
3. กด **ทดสอบการเชื่อมต่อ** → ถ้าขึ้น "เชื่อมต่อสำเร็จ — พบข้อมูล N รายการ" แปลว่าใช้ได้
4. กด **บันทึก**

> ต้องตั้งแยกกันในแต่ละเครื่อง/เบราว์เซอร์ (มือถือทีนึง PC ทีนึง)
> แต่ **ข้อมูลยังเป็นชุดเดียวกัน** เพราะทั้งคู่ชี้ไป backend ตัวเดียวกัน

---

## ปัญหาที่เจอบ่อย

| อาการ | สาเหตุ / วิธีแก้ |
|---|---|
| ทดสอบแล้วขึ้น "ต่อไม่ได้" | เช็ค `Get-Service FinanceApi` ว่า Running อยู่ไหม และ tunnel ยังเปิดอยู่ไหม |
| ต่อได้จาก PC แต่มือถือไม่ได้ | (Tailscale) มือถือเปิด Tailscale แล้วหรือยัง / ล็อกอินบัญชีเดียวกันไหม |
| Console ขึ้น error เรื่อง CORS | โดเมนของหน้าเว็บยังไม่อยู่ใน `AllowedOrigins` ของ `appsettings.json` → เพิ่มแล้ว `Restart-Service FinanceApi` |
| ขึ้น Mixed Content / blocked | URL ของ backend ต้องเป็น **https://** — หน้าเว็บบน Pages เป็น HTTPS จะเรียก http:// ไม่ได้ |
| หน้าเว็บยังแสดงข้อมูลเก่า | service worker cache ไว้ — ปิดแอปแล้วเปิดใหม่ หรือ pull-to-refresh |
| แก้โค้ด C# แล้วไม่มีอะไรเปลี่ยน | service ยังรันโค้ดเก่า → รัน `scripts\update-service.ps1` |

---

## สำรองข้อมูล

ข้อมูลทั้งหมดอยู่ในไฟล์เดียว — คัดลอกเก็บไว้เป็นระยะ:

```powershell
Copy-Item C:\Project_BEER\Monthly_Receipt\data\db\finance.db "$env:USERPROFILE\Documents\finance-backup-$(Get-Date -f yyyyMMdd).db"
```

> ควรหยุด service ก่อนคัดลอกเพื่อความชัวร์ (`Stop-Service FinanceApi` → คัดลอก → `Start-Service FinanceApi`)
