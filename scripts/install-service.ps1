#Requires -RunAsAdministrator
<#
================================================================
install-service.ps1 — ติดตั้ง FinanceApi เป็น Windows Service

ทำอะไรบ้าง:
  1. publish โค้ด backend ไปที่ backend\publish
  2. สร้าง Windows Service ชื่อ "FinanceApi" แบบเริ่มอัตโนมัติตอนเปิดเครื่อง
  3. ตั้งให้รีสตาร์ทเองถ้าแครช
  4. เริ่มบริการแล้วทดสอบว่าตอบสนอง

วิธีรัน — คลิกขวาที่ PowerShell เลือก "Run as administrator" แล้วพิมพ์:
  powershell -ExecutionPolicy Bypass -File C:\Project_BEER\Monthly_Receipt\scripts\install-service.ps1

หมายเหตุ: ฐานข้อมูลอยู่ที่ path ใน appsettings.json (DataPath)
ซึ่งอยู่นอกโฟลเดอร์ publish — การ publish ทับจึงไม่กระทบข้อมูลเดิม
================================================================
#>

$ErrorActionPreference = 'Stop'

$Root        = Split-Path $PSScriptRoot -Parent
$Project     = Join-Path $Root 'backend\FinanceApi\FinanceApi.csproj'
$PublishDir  = Join-Path $Root 'backend\publish'
$Exe         = Join-Path $PublishDir 'FinanceApi.exe'
$ServiceName = 'FinanceApi'

Write-Host "=== ติดตั้ง $ServiceName เป็น Windows Service ===" -ForegroundColor Cyan

# ── 1. หยุดบริการเดิมก่อน (ถ้ามี) ไม่งั้น publish ทับไฟล์ .exe ที่กำลังรันไม่ได้ ──
$existing = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
if ($existing) {
    Write-Host "พบบริการเดิมอยู่แล้ว — หยุดก่อน..." -ForegroundColor Yellow
    if ($existing.Status -ne 'Stopped') {
        Stop-Service -Name $ServiceName -Force
        $existing.WaitForStatus('Stopped', '00:00:30')
    }
}

# ── 2. Publish ──
Write-Host "กำลัง publish ไปที่ $PublishDir ..." -ForegroundColor Cyan
dotnet publish $Project -c Release -o $PublishDir --nologo
if ($LASTEXITCODE -ne 0) { throw "publish ไม่สำเร็จ (exit $LASTEXITCODE)" }
if (-not (Test-Path $Exe)) { throw "ไม่พบไฟล์ $Exe หลัง publish" }

# ── 3. สร้างบริการ (ถ้ายังไม่มี) ──
if (-not $existing) {
    Write-Host "สร้างบริการ $ServiceName ..." -ForegroundColor Cyan
    New-Service -Name $ServiceName `
                -BinaryPathName "`"$Exe`"" `
                -DisplayName 'Finance API (Monthly Receipt)' `
                -Description 'Backend API ของโปรแกรมบริหารการเงินส่วนตัว รันที่ http://localhost:5000' `
                -StartupType Automatic | Out-Null
} else {
    # บริการมีอยู่แล้ว — อัปเดต path เผื่อย้ายโฟลเดอร์
    & sc.exe config $ServiceName binPath= "`"$Exe`"" start= auto | Out-Null
}

# ── 4. ตั้งให้รีสตาร์ทเองเมื่อแครช ──
# reset= 86400 → นับ failure ใหม่ทุก 24 ชม.
# actions= restart/5000 → รอ 5 วินาทีแล้วเริ่มใหม่ ทำได้ 3 ครั้ง
& sc.exe failure $ServiceName reset= 86400 actions= restart/5000/restart/5000/restart/5000 | Out-Null

# ── 5. เริ่มบริการ ──
Write-Host "กำลังเริ่มบริการ..." -ForegroundColor Cyan
Start-Service -Name $ServiceName
(Get-Service $ServiceName).WaitForStatus('Running', '00:00:30')

# ── 6. ทดสอบว่าตอบสนองจริง ──
Start-Sleep -Seconds 3
try {
    $r = Invoke-WebRequest -Uri 'http://localhost:5000/api/expenses' -UseBasicParsing -TimeoutSec 15
    Write-Host "`n[OK] บริการทำงานแล้ว — /api/expenses ตอบกลับ HTTP $($r.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "`n[!] บริการเริ่มแล้วแต่เรียก API ไม่ได้: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "    ดู log ได้ที่ Event Viewer -> Windows Logs -> Application" -ForegroundColor Yellow
    exit 1
}

Write-Host @"

เสร็จแล้ว — จากนี้ backend จะเริ่มเองทุกครั้งที่เปิดเครื่อง

คำสั่งที่ใช้บ่อย:
  Get-Service FinanceApi           # ดูสถานะ
  Restart-Service FinanceApi       # รีสตาร์ท
  Stop-Service FinanceApi          # หยุด

** สำคัญ ** ถ้ายังใช้ start_hidden.vbs เปิด backend อยู่ ให้เอาบรรทัดนั้นออก
   ไม่งั้นจะมี backend 2 ตัวแย่ง port 5000 กัน
"@ -ForegroundColor Cyan
