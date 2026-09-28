$ErrorActionPreference = "Stop"

Write-Host "=== PHASE 6 - STEP 6.1C DATA RELATIONSHIP AUDIT ==="
Write-Host ""

Write-Host "=== DATABASE COUNTS ==="

$CountSql = "SELECT (SELECT COUNT(*) FROM customers) AS customers, (SELECT COUNT(*) FROM licenses) AS licenses, (SELECT COUNT(*) FROM devices) AS devices, (SELECT COUNT(*) FROM renewals) AS renewals, (SELECT COUNT(*) FROM notifications) AS notifications;"

& npx wrangler d1 execute himanshu-xl-tools-licenses --remote --command $CountSql

if ($LASTEXITCODE -ne 0) {
    throw "DATABASE COUNT AUDIT FAILED"
}

Write-Host ""
Write-Host "=== CUSTOMER -> LICENSE -> DEVICE LINK ==="

$LinkSql = "SELECT c.customer_id, c.name AS customer_name, l.license_id, l.status AS license_status, l.plan_code, l.expiry_date, d.device_id, d.status AS device_status FROM customers c LEFT JOIN licenses l ON l.customer_id = c.customer_id LEFT JOIN devices d ON d.license_id = l.license_id ORDER BY c.customer_id LIMIT 20;"

& npx wrangler d1 execute himanshu-xl-tools-licenses --remote --command $LinkSql

if ($LASTEXITCODE -ne 0) {
    throw "RELATIONSHIP AUDIT FAILED"
}

Write-Host ""
Write-Host "STEP 6.1C DATA RELATIONSHIP AUDIT: PASS"