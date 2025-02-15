param (
    [string]$jsondata
)
$data = $jsondata | ConvertFrom-Json

$output = "Output - " + $data.output
Write-Host $output
start-sleep -milliseconds 500