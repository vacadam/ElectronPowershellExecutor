param (
    [string]$jsondata
)
$data = $jsondata | ConvertFrom-Json

if ($data.customerror) {
    Write-Host '[ERROR] This is a custom error message via Write-Host command. You just need to prefix the message with [ERROR].<br>Ideal to use for custom error messages when shipping the app to users who might not understand powershell errors.'
} else {
    Hello
    start-sleep -milliseconds 300
    Write-Host 'All PowerShell error outputs (including Write-Error) are stylized and prefixed with "Error:".'
    start-sleep -milliseconds 300
    Write-Error 'something went wrong'
}

