# Script PowerShell tự động sinh chứng chỉ SSL tự ký cho Nginx Reverse Proxy
# Đề tài 9 - ICTU E-Commerce Monitoring

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "Đang tạo chứng chỉ SSL tự ký (selfsigned.key & selfsigned.crt)..." -ForegroundColor Cyan

$OpenSslPath = "openssl"
if (-not (Get-Command openssl -ErrorAction SilentlyContinue)) {
    if (Test-Path "C:\Program Files\Git\usr\bin\openssl.exe") {
        $OpenSslPath = "C:\Program Files\Git\usr\bin\openssl.exe"
    } else {
        Write-Error "Không tìm thấy openssl. Vui lòng cài Git for Windows hoặc OpenSSL."
        exit 1
    }
}

& $OpenSslPath req -x509 -nodes -days 365 -newkey rsa:2048 `
  -keyout "$ScriptDir\selfsigned.key" `
  -out "$ScriptDir\selfsigned.crt" `
  -subj "/C=VN/ST=ThaiNguyen/L=ThaiNguyen/O=ICTU/OU=DevOps/CN=localhost" `
  -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"

Write-Host "Tạo chứng chỉ SSL thành công tại $ScriptDir!" -ForegroundColor Green
