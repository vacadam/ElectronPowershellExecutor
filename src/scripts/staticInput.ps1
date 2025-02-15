param (
    [string]$jsondata
)
$data = $jsondata | ConvertFrom-Json


Write-Host "This command uses script staticInput.ps1"
Start-Sleep -seconds 3
Write-Host "Predefined input enhances script reusability by allowing the same script to be executed with different preset values, without requiring manual user input each time. For example, we can have a script (startApplication.ps1) that accepts a parameter (path). Instead of prompting the user to enter a value, we define multiple commands/buttons, each specifying a different predefined value for path. This way, the same script can be used in various contexts, simply by changing the predefined parameter in the JSON configuration."

Start-Sleep -seconds 1


$output = "Predefined input - <b>" + $data.test + "</b>"
$output

