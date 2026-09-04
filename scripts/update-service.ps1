#Requires -RunAsAdministrator
<#
================================================================
update-service.ps1 — อัปเดตโค้ด backend ที่รันเป็น Service อยู่

ใช้หลังแก้โค้ด C# แล้วอยากให้บริการใช้เวอร์ชันใหม่:
หยุดบริการ -> publish ทับ -> เริ่มใหม่

วิธีรัน (PowerShell แบบ Run as administrator):
  powershell -ExecutionPolicy Bypass -File C:\Project_BEER\Monthly_Receipt\scripts\update-service.ps1
================================================================
#>

$ErrorActionPreference = 'Stop'

$Root        = Split-Path $PSScriptRoot -Parent
$Project     = Join-Path $Root 'backend\FinanceApi\FinanceApi.csproj'
$PublishDir  = Join-Path $Root 'backend\publish'
$ServiceName = 'FinanceApi'

$svc = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
if (-not $svc) { throw "ยังไม่ได้ติดตั้งบริการ — ให้รัน install-service.ps1 ก่อน" }

Write-Host "หยุดบริการ..." -ForegroundColor Cyan
if ($svc.Status -ne 'Stopped') {
    Stop-Service -Name $ServiceName -Force
    $svc.WaitForStatus('Stopped', '00:00:30')
}

Write-Host "publish เวอร์ชันใหม่..." -ForegroundColor Cyan
dotnet publish $Project -c Release -o $PublishDir --nologo
if ($LASTEXITCODE -ne 0) { throw "publish ไม่สำเร็จ (exit $LASTEXITCODE)" }

Write-Host "เริ่มบริการ..." -ForegroundColor Cyan
Start-Service -Name $ServiceName
(Get-Service $ServiceName).WaitForStatus('Running', '00:00:30')

Start-Sleep -Seconds 3
try {
    $r = Invoke-WebRequest -Uri 'http://localhost:5000/api/expenses' -UseBasicParsing -TimeoutSec 15
    Write-Host "[OK] อัปเดตเรียบร้อย — HTTP $($r.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "[!] เริ่มบริการแล้วแต่เรียก API ไม่ได้: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
