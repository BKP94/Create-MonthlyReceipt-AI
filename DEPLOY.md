# คู่มือ Deploy — ใช้แอปผ่านมือถือ

> **ถ้าไม่อยากใช้ cloud / ไม่อยากผูกบัตรเครดิต → ดู [CONNECT.md](CONNECT.md) แทน**
> (backend รันเป็น Windows Service ที่บ้าน + tunnel — ข้อมูลไม่ต้องย้ายไปไหน)
>
> เอกสารนี้เป็นทางเลือกแบบเอา backend ขึ้น cloud

แอปนี้มี 2 ส่วนที่ต้อง deploy แยกกัน เพราะเทคโนโลยีคนละแบบ:

| ส่วน | คืออะไร | ไปอยู่ที่ไหน |
|---|---|---|
| **frontend** (`frontend/`) | React + Vite — ไฟล์ static (html/js/css) | **GitHub Pages** |
| **backend** (`backend/FinanceApi`) | ASP.NET Core + SQLite — ต้องมีเครื่องรันโปรแกรม | **Azure App Service** (หรือที่อื่น) |

> **GitHub Pages รัน backend ไม่ได้** — มันเสิร์ฟไฟล์อย่างเดียว รันโปรแกรม .NET ไม่ได้
> ดังนั้นถ้าเอาแค่ frontend ขึ้น Pages หน้าเว็บจะขึ้นแต่โหลดข้อมูลไม่ได้

---

## ⚠️ ข้อมูลเดิมจะหายไหม?

**ไม่หาย** ถ้าทำตามคู่มือนี้ — แต่ต้องเข้าใจ 3 ข้อนี้ก่อน:

1. **ไฟล์ `data/db/finance.db` บนเครื่องคุณไม่ถูกแตะเลย** และ `.gitignore` กันไม่ให้ขึ้น GitHub อยู่แล้ว
   (เจตนาถูกต้อง — ข้อมูลการเงินส่วนตัวไม่ควรอยู่บน GitHub)

2. **แต่ backend บน cloud จะเริ่มจากฐานข้อมูล "ว่างเปล่า"** เพราะไฟล์ .db ไม่ได้ขึ้นไปกับโค้ด
   ต้อง **อัปโหลดไฟล์ .db ขึ้นไปเอง** (ขั้นตอนที่ 5 ด้านล่าง)

3. **บน Azure ต้องเก็บ .db ไว้นอกโฟลเดอร์โค้ด** ไม่งั้น **deploy รอบถัดไปจะทับข้อมูลหาย**
   → ตั้งค่า `DataPath` ให้ชี้ไป `/home/data/db` (ขั้นตอนที่ 3)

**สำรองข้อมูลก่อนเริ่มทุกครั้ง:**

```bash
cp data/db/finance.db "data/db/finance.backup-$(date +%Y%m%d).db"
```

---

## ส่วนที่ 1 — Frontend ขึ้น GitHub Pages

ทำครั้งเดียว:

1. ไปที่ repo บน GitHub → **Settings** → **Pages**
2. ช่อง **Source** เลือก **GitHub Actions**
3. ไปที่ **Settings** → **Secrets and variables** → **Actions** → แท็บ **Variables** → **New repository variable**
   - Name: `VITE_API_URL`
   - Value: URL ของ backend เช่น `https://finance-api-beer.azurewebsites.net`
   - (ถ้ายังไม่มี backend ข้ามไปก่อนได้ — หน้าเว็บจะขึ้นแต่ยังโหลดข้อมูลไม่ได้)
4. `git push` ขึ้น branch `main`

Workflow `.github/workflows/deploy-pages.yml` จะ build และ deploy ให้อัตโนมัติ
เสร็จแล้วเข้าที่ `https://<ชื่อ user>.github.io/<ชื่อ repo>/`

> เปลี่ยนค่า `VITE_API_URL` แล้วต้อง **rerun workflow** ใหม่ (Actions → Run workflow)
> เพราะค่าถูกฝังเข้าไปในไฟล์ js ตอน build ไม่ได้อ่านตอนรัน

---

## ส่วนที่ 2 — Backend ขึ้น Azure App Service (F1 ฟรี)

### สิ่งที่ต้องรู้ก่อน

- ต้องสมัคร Azure account — **ต้องผูกบัตรเครดิต/เดบิตเพื่อยืนยันตัวตน** แม้จะใช้ tier ฟรี
  (F1 ไม่มีค่าใช้จ่าย แต่ Azure ขอบัตรไว้ตอนสมัคร)
- F1 จำกัด **CPU 60 นาที/วัน** และ **RAM 1 GB** — พอเหลือเฟือสำหรับใช้คนเดียว
- F1 **ไม่มี Always On** → ถ้าไม่มีคนใช้สักพัก แอปจะหลับ เปิดครั้งถัดไปรอ ~10-30 วินาที
- ได้ HTTPS ฟรีที่โดเมน `xxx.azurewebsites.net`

### ขั้นตอนที่ 1 — สร้าง Web App

1. เข้า [portal.azure.com](https://portal.azure.com) → **Create a resource** → ค้นหา **Web App**
2. กรอก:
   - **Resource Group**: สร้างใหม่ เช่น `rg-finance`
   - **Name**: ชื่อที่ไม่ซ้ำใคร เช่น `finance-api-beer` → จะได้ URL `https://finance-api-beer.azurewebsites.net`
   - **Publish**: `Code`
   - **Runtime stack**: `.NET 10 (LTS)` — ถ้าไม่มีให้เลือกเวอร์ชันล่าสุดที่มี แล้วดู "ถ้าไม่มี .NET 10" ด้านล่าง
   - **Operating System**: `Linux`
   - **Region**: `Southeast Asia` (สิงคโปร์ — ใกล้ไทยสุด)
   - **Pricing plan**: กด **Change size** → แท็บ **Dev/Test** → เลือก **F1 (Free)**
3. **Review + create** → **Create** รอสัก 1-2 นาที

### ขั้นตอนที่ 2 — เปิด CORS ให้ GitHub Pages

Backend กับ frontend อยู่คนละโดเมน เบราว์เซอร์จะบล็อกถ้าไม่อนุญาต

ใน Web App ที่สร้าง → **Settings** → **Environment variables** → **App settings** → **+ Add**:

| Name | Value |
|---|---|
| `AllowedOrigins` | `https://<ชื่อ user>.github.io` |

> ใส่แค่โดเมน ไม่ต้องมี path หรือ `/` ปิดท้าย
> โค้ดฝั่ง backend อ่านค่านี้แล้ว (`backend/FinanceApi/Program.cs`)

### ขั้นตอนที่ 3 — ตั้งที่เก็บฐานข้อมูล ⚠️ สำคัญที่สุด

บน Azure Linux โฟลเดอร์โค้ด (`/home/site/wwwroot`) **ถูกเขียนทับทุกครั้งที่ deploy**
ถ้าปล่อยให้ SQLite อยู่ตรงนั้น **ข้อมูลจะหายทุกครั้งที่ push โค้ด**

โฟลเดอร์ `/home` (นอก `site/wwwroot`) เป็น persistent storage ที่รอด — เก็บ .db ไว้ที่นั่น

เพิ่ม App setting อีกตัว:

| Name | Value |
|---|---|
| `DataPath` | `/home/data/db` |

โค้ดรองรับค่านี้อยู่แล้ว (`Program.cs` อ่าน `builder.Configuration["DataPath"]`)

กด **Apply** แล้วรอแอป restart

### ขั้นตอนที่ 4 — Deploy โค้ด

**วิธีง่ายสุด — ให้ Azure สร้าง GitHub Actions ให้:**

1. ใน Web App → **Deployment** → **Deployment Center**
2. **Source**: `GitHub` → authorize → เลือก Organization / Repository / Branch `main`
3. **Build provider**: `GitHub Actions`
4. **Runtime stack**: `.NET`, **Version**: ตรงกับที่เลือกตอนสร้าง
5. กด **Save**

Azure จะ commit ไฟล์ workflow เข้า repo ให้เอง แล้ว build+deploy อัตโนมัติทุกครั้งที่ push

> **ต้องแก้ไฟล์ workflow ที่ Azure สร้างให้ 1 จุด** — มันจะ build ทั้ง repo ซึ่งจะพังเพราะมี frontend ปนอยู่
> เปิดไฟล์ `.github/workflows/*azure*.yml` แล้วแก้ทุกคำสั่ง `dotnet build/publish` ให้ระบุ project:
> ```yaml
> - name: Build
>   run: dotnet build backend/FinanceApi/FinanceApi.csproj --configuration Release
> - name: Publish
>   run: dotnet publish backend/FinanceApi/FinanceApi.csproj -c Release -o ${{env.DOTNET_ROOT}}/myapp
> ```
> และเพิ่ม `paths: ['backend/**']` ใต้ `on: push:` เพื่อไม่ให้ deploy ซ้ำตอนแก้แค่ frontend

**ถ้าไม่มี .NET 10 ให้เลือกใน Runtime stack:** เปลี่ยนคำสั่ง publish เป็น self-contained
(รวม runtime ไปกับแอป ไม่ต้องพึ่งเวอร์ชันบนเครื่อง Azure):

```yaml
run: dotnet publish backend/FinanceApi/FinanceApi.csproj -c Release --self-contained -r linux-x64 -o ${{env.DOTNET_ROOT}}/myapp
```

### ขั้นตอนที่ 5 — ย้ายข้อมูลเดิมขึ้นไป

หลัง deploy รอบแรกสำเร็จ ฐานข้อมูลบน Azure ยังว่างอยู่ ต้องอัปโหลด `finance.db` ขึ้นไป:

1. ใน Web App → **Development Tools** → **Advanced Tools** → **Go →** (เปิด Kudu)
2. เมนูบน → **Debug console** → **Bash**
3. พิมพ์ `cd /home/data/db` แล้ว Enter
   (ถ้ายังไม่มีโฟลเดอร์ ให้พิมพ์ `mkdir -p /home/data/db && cd /home/data/db`)
4. **ลากไฟล์** `data/db/finance.db` จากเครื่องมาวางในหน้าต่างรายการไฟล์ของ Kudu
5. กลับไปที่ **Overview** ของ Web App → กด **Restart**
6. ทดสอบเปิด `https://<ชื่อแอป>.azurewebsites.net/api/expenses` — ควรเห็น JSON ข้อมูลเดิม

### ขั้นตอนที่ 6 — ผูก frontend เข้ากับ backend

กลับไปที่ GitHub repo → **Settings** → **Secrets and variables** → **Actions** → **Variables**
ตั้ง `VITE_API_URL` = `https://<ชื่อแอป>.azurewebsites.net`
แล้วไป **Actions** → เลือก workflow *Deploy to GitHub Pages* → **Run workflow**

---

## สำรองข้อมูลจาก Azure กลับมาเก็บ

ควรทำเป็นระยะ (เดือนละครั้ง) — F1 ไม่มี auto-backup:

1. Kudu → **Debug console** → **Bash** → `cd /home/data/db`
2. กดปุ่มดาวน์โหลด (ลูกศรลง) หน้าไฟล์ `finance.db`

---

## ติดตั้งแอปบนมือถือ (PWA)

หลัง deploy แล้ว เปิด URL ของ Pages บนมือถือ:

- **Android (Chrome)**: เมนู ⋮ → *เพิ่มไปยังหน้าจอหลัก* / *ติดตั้งแอป*
- **iPhone (Safari)**: ปุ่มแชร์ → *เพิ่มไปยังหน้าจอโฮม*

เปิดจากไอคอนแล้วจะไม่มีแถบ URL เหมือนแอปจริง และเปิดดูข้อมูลที่เคยโหลดไว้ได้แม้เน็ตหลุด
(แต่การเพิ่ม/แก้ไขต้องมีเน็ต เพราะข้อมูลอยู่ที่ backend)

---

## ทางเลือกอื่นแทน Azure

| บริการ | ฟรีถาวร? | เหมาะไหม |
|---|---|---|
| **Oracle Cloud Always Free** | ✅ | แรงกว่ามาก (VM 4 core/24GB) แต่ต้องตั้ง VM/nginx/SSL เอง |
| **Cloudflare Tunnel → PC ที่บ้าน** | ✅ | ไม่ต้องย้ายข้อมูลเลย ข้อมูลอยู่เครื่องเดิม แต่ PC ต้องเปิดตลอด |
| **Render Free** | ⚠️ | **ไม่แนะนำ** — ไม่มี disk ฟรี ข้อมูล SQLite หายทุก redeploy |
| **Fly.io / Railway / Koyeb** | ❌ | เลิก free tier ถาวรแล้ว ต้องผูกบัตรและมีค่าใช้จ่าย |

> ข้อมูล free tier เปลี่ยนบ่อย — ควรเช็คหน้า pricing ล่าสุดของแต่ละเจ้าก่อนตัดสินใจ
