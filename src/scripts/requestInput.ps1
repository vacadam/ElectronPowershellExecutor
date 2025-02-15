param (
    [string]$jsondata
)
$data = $jsondata | ConvertFrom-Json


$username = 'Your name: '
if ($data.inputusername) {
    $username += $data.inputusername
} else {
    $username += 'n/a'
}
Write-Host $username
start-sleep -milliseconds 300

$surname = 'Your surname: '
if ($data.inputusersurname) {
    $surname += $data.inputusersurname
} else {
    $surname += 'n/a'
}
Write-Host $surname
start-sleep -milliseconds 300

$age = 'Your age: '
if ($data.inputvalidation) {
    $age += $data.inputvalidation
} else {
    $age += 'n/a'
}
Write-Host $age
start-sleep -milliseconds 300

$ps = 'Like PS: ' + $data.inputcheckbox1
Write-Host $ps
start-sleep -milliseconds 300

$js = 'Like JS: ' + $data.inputcheckbox2
Write-Host $js
start-sleep -milliseconds 300

$folder = 'Chosen folder: ' + $data.inputfolder
Write-Host $folder
start-sleep -milliseconds 300