$ErrorActionPreference = "Stop"

$shareName = "HimanshuXLToolsCatalog"
$guid = "{40755012-DC33-48D4-9586-955E1FA60E03}"

$registryPath =
    "HKCU:\Software\Microsoft\Office\16.0\WEF\TrustedCatalogs\$guid"

New-Item -Path $registryPath -Force | Out-Null

Set-ItemProperty -Path $registryPath -Name "Id" -Value $guid

Set-ItemProperty `
    -Path $registryPath `
    -Name "Url" `
    -Value "\\$env:COMPUTERNAME\$shareName"

New-ItemProperty `
    -Path $registryPath `
    -Name "Flags" `
    -PropertyType DWord `
    -Value 1 `
    -Force |
Out-Null

Remove-Item `
    "$env:LOCALAPPDATA\Microsoft\Office\16.0\Wef\*" `
    -Recurse `
    -Force `
    -ErrorAction SilentlyContinue
