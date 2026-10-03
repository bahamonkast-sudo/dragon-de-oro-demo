[Setup]
AppName=Visionarios
AppVersion=1.5.0
AppPublisher=Guardian Visionarios
AppPublisherURL=
AppSupportURL=
AppUpdatesURL=
DefaultDirName={sd}\Visionarios_App
DefaultGroupName=Visionarios
OutputBaseFilename=Instalador_Visionarios
OutputDir=C:\Visionarios\Output
Compression=lzma
SolidCompression=yes
SetupIconFile=ui\logo.ico
UninstallDisplayIcon={app}\ui\logo.ico
WizardStyle=modern
DisableDirPage=no
UsePreviousAppDir=no
AppId={{VISIONARIOS-APP-2026-MAIN-ID}}

[Languages]
Name: "spanish"; MessagesFile: "compiler:Languages\Spanish.isl"

[Files]
; Copia todos los archivos de la app Visionarios de forma recursiva (excepto runtime y Output)
Source: "C:\Visionarios\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs; Excludes: "Output\*,*.iss,.git\*,runtime\*"

; Node.js portable bundleado — el cliente NO necesita instalar Node.js
Source: "C:\Visionarios\runtime\node.exe"; DestDir: "{app}\runtime"; Flags: ignoreversion

[Icons]
; Acceso directo en el escritorio — lanza cmd.exe directamente con el bat
Name: "{commondesktop}\Visionarios"; Filename: "{cmd}"; Parameters: "/c ""{app}\visionarios.bat"""; IconFilename: "{app}\ui\logo.ico"; WorkingDir: "{app}"; Comment: "Abrir Visionarios"

; Acceso directo en el menu de inicio
Name: "{group}\Visionarios"; Filename: "{cmd}"; Parameters: "/c ""{app}\visionarios.bat"""; IconFilename: "{app}\ui\logo.ico"; WorkingDir: "{app}"; Comment: "Abrir Visionarios"
Name: "{group}\Desinstalar Visionarios"; Filename: "{uninstallexe}"

[Run]
; Generar archivo de marca para indicar que es la app instalada
Filename: "{cmd}"; Parameters: "/c echo instalada > ""{app}\installed.txt"""; Flags: runhidden
; Al finalizar la instalacion ejecuta visionarios.bat via cmd.exe con directorio de trabajo correcto
Filename: "{cmd}"; Parameters: "/c ""{app}\visionarios.bat"""; WorkingDir: "{app}"; Description: "Ejecutar Visionarios ahora"; Flags: postinstall nowait skipifsilent

[UninstallDelete]
; Limpia directorios y archivos de salida al desinstalar
Type: filesandordirs; Name: "{app}\Output"
Type: files; Name: "{app}\installed.txt"
