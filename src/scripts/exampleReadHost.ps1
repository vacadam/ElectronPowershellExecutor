Write-Host "Welcome to the Interactive Setup Wizard!"

start-sleep -Seconds 1

Write-Host "[INPUT]What's your name?"
$name = Read-Host 
Write-Host "Nice to meet you, $name! Let's set things up for you." 

start-sleep -Seconds 1

do {
    Write-Host "[INPUT]How old are you?"
    $age = Read-Host
    if ($age -match '^\d+$') {
        $valid = $true
    } else {
        Write-Host "[ERROR]Please enter a valid number!"
        $valid = $false
    }
} while (-not $valid)

start-sleep -Seconds 1

Write-Host "[INPUT]What's your favorite programming language?"
$language = Read-Host
if ($language -match '^(PowerShell|Python|JavaScript|C\#|Rust|Go)$') {
    Write-Host "Great choice! $language is awesome!"
} else {
    Write-Host "$($language)? Hmm, interesting choice!"
}
start-sleep -Seconds 1

Write-Host "[INPUT]Do you want to save this info? (yes/no)"
$confirm = Read-Host
if ($confirm -match '^(yes|y)$') {
    Write-Host "Information saved! Thanks, $name!"
} else {
    Write-Host "No worries, nothing was saved. Restart if you change your mind!"
}
start-sleep -Seconds 2

Write-Host "Setup complete! Have a great day, $name!"
