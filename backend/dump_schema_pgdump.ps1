# PowerShell script to run pg_dump using DATABASE_URL from .env
# This script handles loading .env and running pg_dump

# Load .env file
$envFile = Join-Path $PSScriptRoot ".env"
if (-not (Test-Path $envFile)) {
    Write-Host "❌ .env file not found at: $envFile"
    exit 1
}

# Read DATABASE_URL from .env
$databaseUrl = $null
Get-Content $envFile | ForEach-Object {
    if ($_ -match '^DATABASE_URL=(.+)$') {
        $databaseUrl = $matches[1]
    }
}

if (-not $databaseUrl) {
    Write-Host "❌ DATABASE_URL not found in .env file"
    exit 1
}

# Check if pg_dump is available
$pgDump = Get-Command pg_dump -ErrorAction SilentlyContinue

if (-not $pgDump) {
    Write-Host "❌ pg_dump not found in PATH"
    Write-Host ""
    Write-Host "Please install PostgreSQL client tools:"
    Write-Host "  1. Download from: https://www.postgresql.org/download/windows/"
    Write-Host "  2. Or use Chocolatey: choco install postgresql"
    Write-Host ""
    Write-Host "Alternative: Use Supabase Dashboard → SQL Editor"
    Write-Host "  Run: SELECT pg_get_tabledef('table_name'::regclass); for each table"
    exit 1
}

Write-Host "✅ Found pg_dump at: $($pgDump.Source)"
Write-Host "📊 Dumping schema..."

$outputFile = Join-Path $PSScriptRoot "schema_dump.sql"

try {
    & pg_dump --schema-only --no-owner --no-privileges "$databaseUrl" | Out-File -FilePath $outputFile -Encoding utf8
    
    if ($LASTEXITCODE -eq 0) {
        $fileSize = (Get-Item $outputFile).Length
        Write-Host "✅ Schema dump completed successfully!"
        Write-Host "📄 Output file: $outputFile"
        Write-Host "📊 Size: $fileSize bytes"
    } else {
        Write-Host "❌ pg_dump failed with exit code: $LASTEXITCODE"
        exit 1
    }
} catch {
    Write-Host "❌ Error running pg_dump: $_"
    exit 1
}

