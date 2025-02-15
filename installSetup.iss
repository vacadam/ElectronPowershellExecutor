[Code]
#define AppVersion "1.0.0"
#define TimeStamp GetDateTimeString("dd-MM-yyyy", "-", "")

[Setup]
; NOTE: The value of AppId uniquely identifies this application. Do not use the same AppId value in installers for other applications.
; (To generate a new GUID, click Tools | Generate GUID inside the IDE.)
AppId={{5D1C408B-3C70-495C-B607-69AAD80A8691}
AppName=EPE
AppVersion={#AppVersion}
;AppVerName=EPE {#AppVersion}
AppPublisher=github.vacadam
DefaultDirName={autopf}\EPE
; "ArchitecturesAllowed=x64compatible" specifies that Setup cannot run
; on anything but x64 and Windows 11 on Arm.
ArchitecturesAllowed=x64compatible
; "ArchitecturesInstallIn64BitMode=x64compatible" requests that the
; install be done in "64-bit mode" on x64 or Windows 11 on Arm,
; meaning it should use the native 64-bit Program Files directory and
; the 64-bit view of the registry.
ArchitecturesInstallIn64BitMode=x64compatible
DisableProgramGroupPage=yes
; Uncomment the following line to run in non administrative install mode (install for current user only.)
;PrivilegesRequired=lowest
PrivilegesRequiredOverridesAllowed=dialog
OutputDir=installers\EPE_{#AppVersion}
OutputBaseFilename=EPE_{#AppVersion}_Installer_({#TimeStamp})
SetupIconFile=EPEicon.ico
Compression=lzma
SolidCompression=yes
WizardStyle=modern

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked

[Files]
Source: "build\win-unpacked\EPE.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "build\win-unpacked\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs
; NOTE: Don't use "Flags: ignoreversion" on any shared system files

[Icons]
Name: "{autoprograms}\EPE"; Filename: "{app}\EPE.exe"
Name: "{autodesktop}\EPE"; Filename: "{app}\EPE.exe"; Tasks: desktopicon

[Run]
Filename: "{app}\EPE.exe"; Description: "{cm:LaunchProgram,EPE}"; Flags: nowait postinstall skipifsilent
