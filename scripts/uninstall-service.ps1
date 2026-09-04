#Requires -RunAsAdministrator
<#
================================================================
uninstall-service.ps1 — ถอน Windows Service ของ FinanceApi

ลบเฉพาะตัวบริการ — ไม่แตะฐานข้อมูลและไม่ลบโค้ด

วิธีรัน (PowerShell แบบ Run as administrator):
  powershell -ExecutionPolicy Bypass -File C:\Project_BEER\Monthly_Receipt\scripts\uninstall-service.ps1
================================================================
#>

$ErrorActionPreference = 'Stop'
$ServiceName = 'FinanceApi'

$svc = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
if (-not $svc) {
    Write-Host "ไม่พบบริการ $ServiceName — ไม่มีอะไรต้องถอน" -ForegroundColor Yellow
    exit 0
}

if ($svc.Status -ne 'Stopped') {
    Write-Host "หยุดบริการ..." -ForegroundColor Cyan
    Stop-Service -Name $ServiceName -Force
    $svc.WaitForStatus('Stopped', '00:00:30')
}

# Remove-Service มีใน PowerShell 6+ เท่านั้น — Windows PowerShell 5.1 ต้องใช้ sc.exe
if (Get-Command Remove-Service -ErrorAction SilentlyContinue) {
    Remove-Service -Name $ServiceName
} else {
    & sc.exe delete $ServiceName | Out-Null
}

Write-Host "ถอนบริการ $ServiceName เรียบร้อย (ฐานข้อมูลยังอยู่ครบ)" -ForegroundColor Green
