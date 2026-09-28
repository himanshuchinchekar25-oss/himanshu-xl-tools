$ErrorActionPreference = "Stop"

$shareName = "HimanshuXLToolsCatalog"
$catalogPath = "C:\HimanshuXLToolsCatalog"

$everyoneSid = New-Object System.Security.Principal.SecurityIdentifier("S-1-1-0")
$everyone = $everyoneSid.Translate([System.Security.Principal.NTAccount]).Value

$existing = Get-SmbShare -Name $shareName -ErrorAction SilentlyContinue

if ($existing) {
    Remove-SmbShare -Name $shareName -Force
}

New-SmbShare -Name $shareName -Path $catalogPath -ReadAccess $everyone | Out-Null
