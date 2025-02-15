param (
    [string]$jsondata
)
$data = $jsondata | ConvertFrom-Json

if (!$data.service) {
    Write-Host "[ERROR] Unable to restart the service - name of the service was not provided!"
    return
}

$serviceExists = get-service -Name $data.service -ErrorAction 'silentlycontinue' 

if ($serviceExists) {
    Write-Host "Restarting $($data.service) ..."
    restart-service $data.service -ErrorAction 'silentlycontinue'

    Start-Sleep -Seconds 1
    $serviceStatus = Get-Service -Name $data.service -ErrorAction SilentlyContinue

    if ($serviceStatus -and $serviceStatus.Status -eq 'Running') {
        Write-Host "Service $($data.service) was restarted successfully."
    } else {
        Write-Host "[ERROR] Failed to restart service $($data.service). Current status: $($serviceStatus.Status)"
    }
    
} else {
    Write-Host "[ERROR] Service $($data.service) does not exists in the system!"
}