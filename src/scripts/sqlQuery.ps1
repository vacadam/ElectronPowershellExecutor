param (
    [string]$jsondata
)
$data = $jsondata | ConvertFrom-Json

if (!$data.query) {
    Write-Host "Unable to execute query - query argument was not provided."
    return
}
$selfPath = split-path -parent $MyInvocation.MyCommand.Definition
$queryPath = "$($selfPath)\queries\$($data.query).ps1"

if (!(Test-Path $queryPath)) {
    Write-Host "[ERROR] Unable to execute query - script for the query argument does not exist."
    return
}


function GetAndVerifyQuery($queryPath) {
    $fileContent = Get-Content -Path $queryPath -Raw
    $versionInfoFilePath = "$($selfPath)\versionInfo.json"
    $packageJson = Get-Content -Path $versionInfoFilePath | ConvertFrom-Json
    $contentToHash = $fileContent + $packageJson.version
    $sha256 = [System.Security.Cryptography.SHA256]::Create()
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($contentToHash)
    $hashBytes = $sha256.ComputeHash($bytes)
    $generatedHashHexString = [BitConverter]::ToString($hashBytes) -replace '-' | ForEach-Object { $_.ToLower() }
    return $generatedHashHexString
}
 
$queryHash = GetAndVerifyQuery($queryPath)
if (($queryHash -eq $data.savedQueryHash) -or !$data.isPackaged) {
    . $queryPath
} else {
    Write-Host "[ERROR] Execution stopped - script file $($data.query) has been altered. You little digital rascal!"
    return
}

$server = $env:COMPUTERNAME+'\MIAMI'
$connectionString = "Server=$server;Database=$database;Integrated Security=True;"
$connection = New-Object System.Data.SqlClient.SqlConnection
$connection.ConnectionString = $connectionString
$command = $connection.CreateCommand()
$command.CommandText = $sqlQuery

try {
    $connection.Open()
    if (-not $isSelect) {
        $rows = $command.ExecuteNonQuery()
        if (!$rows) {
            Write-Host "Query executed but affected zero rows."
            return
        }
        Write-Host "Query executed successfully. Total rows affected: $rows"
    } else {
        $outputLines = @()
        $results = $command.ExecuteReader()
        while ($results.Read()) {
            $output = ""
            foreach ($column in $columns) {
                $output += ($results[$column] -as [string]) + ' - '
            }
            $output = $output.TrimEnd(' - ')
            $outputLines += $output
        }
        $outputLines = $outputLines[-1..-($outputLines.Count)]
        foreach ($line in $outputLines) {
            Write-Host $line
            [Console]::Out.Flush()
            Start-Sleep -Milliseconds 100
        }
        Write-Host "Query finished."
    }
} catch {
    Write-Host "[ERROR] An error occurred: $_"
} finally {
    $connection.Close()
}