$ErrorActionPreference = "SilentlyContinue"

$shareName = "HimanshuXLToolsCatalog"
$guid = "{40755012-DC33-48D4-9586-955E1FA60E03}"

Get-SmbShare `
    -Name $shareName `
    -ErrorAction SilentlyContinue |
Remove-SmbShare `
    -Force `
    -ErrorAction SilentlyContinue

Get-ChildItem "Registry::HKEY_USERS" -ErrorAction SilentlyContinue |
ForEach-Object {

    $catalogPath =
        "$($_.PSPath)\Software\Microsoft\Office\16.0\WEF\TrustedCatalogs\$guid"

    if (Test-Path $catalogPath) {
        Remove-Item `
            $catalogPath `
            -Recurse `
            -Force `
            -ErrorAction SilentlyContinue
    }
}
