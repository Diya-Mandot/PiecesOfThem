param(
    [string]$BackupPath = ""
)

$ErrorActionPreference = "Stop"

$RepoRoot = Split-Path -Parent $PSScriptRoot
$ComposeFile = Join-Path $RepoRoot "docker-compose.yml"
$ContainerName = "piecesofthem-postgres"
$DefaultBackupDir = Join-Path $RepoRoot "data\backups"

function Resolve-BackupPath {
    param([string]$RequestedPath)

    if ($RequestedPath) {
        return (Resolve-Path -LiteralPath $RequestedPath).Path
    }

    $latest = Get-ChildItem -LiteralPath $DefaultBackupDir -Filter "piecesofthem-curated-*.sql" |
        Sort-Object LastWriteTimeUtc -Descending |
        Select-Object -First 1

    if (-not $latest) {
        throw "No backup file found in $DefaultBackupDir"
    }

    return $latest.FullName
}

function Ensure-PostgresContainer {
    docker compose -f $ComposeFile up -d postgres | Out-Null

    $deadline = (Get-Date).AddMinutes(2)
    while ((Get-Date) -lt $deadline) {
        docker exec $ContainerName psql -U pieces -d piecesofthem -c "select 1;" *> $null
        if ($LASTEXITCODE -eq 0) {
            return
        }
        Start-Sleep -Seconds 2
    }

    throw "Postgres container did not become healthy in time."
}

$ResolvedBackupPath = Resolve-BackupPath -RequestedPath $BackupPath
Ensure-PostgresContainer

Write-Host "Restoring backup: $ResolvedBackupPath"
Get-Content -LiteralPath $ResolvedBackupPath -Raw |
    docker exec -i $ContainerName psql -v ON_ERROR_STOP=1 -U pieces -d piecesofthem | Out-Null

Write-Host "Restore complete."
