[Setup]
AppName=Himanshu XL Tools
AppVersion=1.0.0.7
AppId=HimanshuXLTools
DefaultDirName={commonappdata}\HimanshuXLTools
DefaultGroupName=Himanshu XL Tools
OutputDir=output
OutputBaseFilename=HimanshuXLToolsSetup
Compression=lzma
SolidCompression=yes
PrivilegesRequired=admin
UninstallDisplayName=Himanshu XL Tools

[Files]
Source: "manifest.xml"; DestDir: "{app}"; Flags: ignoreversion
Source: "manifest.xml"; DestDir: "C:\HimanshuXLToolsCatalog"; Flags: ignoreversion
Source: "install-machine.ps1"; DestDir: "{app}"; Flags: ignoreversion
Source: "install-user.ps1"; DestDir: "{app}"; Flags: ignoreversion
Source: "uninstall-machine.ps1"; DestDir: "{app}"; Flags: ignoreversion

[Run]
Filename: "powershell.exe"; Parameters: "-NoProfile -ExecutionPolicy Bypass -File ""{app}\install-machine.ps1"""; Flags: runhidden waituntilterminated
Filename: "powershell.exe"; Parameters: "-NoProfile -ExecutionPolicy Bypass -File ""{app}\install-user.ps1"""; Flags: runhidden waituntilterminated runasoriginaluser

[UninstallRun]
Filename: "powershell.exe"; Parameters: "-NoProfile -ExecutionPolicy Bypass -File ""{app}\uninstall-machine.ps1"""; Flags: runhidden waituntilterminated; RunOnceId: "HimanshuXLToolsCleanup"

[UninstallDelete]
Type: filesandordirs; Name: "C:\HimanshuXLToolsCatalog"
