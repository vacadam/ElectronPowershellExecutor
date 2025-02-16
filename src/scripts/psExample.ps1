param (
    [string]$jsondata
)
$data = $jsondata | ConvertFrom-Json


Write-Host 'This is just an example of PowerShell script.'
start-sleep -seconds 3


Write-Host '[INPUT] Would you like me to show you system information? (yes/no)'
$sysInfo = Read-Host
start-sleep -seconds 1


if ($sysInfo -in 'yes', 'y') {
    Write-Host "User: $env:USERNAME"
    start-sleep -milliseconds 500
    Write-Host "Computer: $env:COMPUTERNAME"
    start-sleep -milliseconds 500
    $os = Get-WmiObject Win32_OperatingSystem | Select-Object Caption, OSArchitecture, Version
    Write-Host "OS Name: $($os.Caption)"
    start-sleep -milliseconds 300
    Write-Host "Architecture: $($os.OSArchitecture)"
    start-sleep -milliseconds 300
    Write-Host "Version: $($os.Version)"
    start-sleep -milliseconds 300
}

Write-Host '[INPUT] Would you like me to show you error messages? (yes/no)'
$errMessage = Read-Host
start-sleep -seconds 1

if ($errMessage -in 'yes', 'y') {
    HELLO
    start-sleep -seconds 1
    Write-Host "[ERROR] This one is custom error message via Write-Host command."
}
start-sleep -seconds 3


$psVersion = "$($PSVersionTable.PSVersion.Major).$($PSVersionTable.PSVersion.Minor)"
Write-Host "Your running PowerShell version is $($psVersion)<br>The application checks for the availability of pwsh.exe on the system at startup. If pwsh.exe is not found, powershell.exe is used to execute commands. In cases where pwsh.exe is required, you can specify this requirement in the commands JSON to prevent execution when only powershell.exe is available."
