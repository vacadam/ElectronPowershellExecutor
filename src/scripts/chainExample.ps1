param (
    [string]$jsondata
)
$data = $jsondata | ConvertFrom-Json

start-sleep -seconds 1

if ($data.chain.increment) {
    $newValue = $data.chain.increment + 1
    $output = "Same script. Current value: " + $newValue
    Write-Host $output

    $object = @{"increment" = $newValue} | ConvertTo-Json
    Write-host $object
} else {
    write-host "First script iteration. Start increment."
    $object = @{"increment" = 1} | ConvertTo-Json
    Write-host $object
}

