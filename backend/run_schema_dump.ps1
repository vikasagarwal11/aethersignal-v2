# Schema Dump Script - Complete workflow
# This script will dump your database schema using pg_dump

Write-Host "`n=== AetherSignal Schema Dump ===" -ForegroundColor Cyan
Write-Host ""

# Check if pg_dump is available
$pgDump = Get-Command pg_dump -ErrorAction SilentlyContinue

if (-not $pgDump) {
    Write-Host "❌ pg_dump not found in PATH" -ForegroundColor Red
    Write-Host ""
    Write-Host "Installing PostgreSQL (includes pg_dump)..." -ForegroundColor Yellow
    Write-Host "This requires administrator privileges." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Run this command in Administrator PowerShell:" -ForegroundColor Cyan
    Write-Host "  choco install postgresql -y" -ForegroundColor Green
    Write-Host ""
    Write-Host "OR download from: https://www.postgresql.org/download/windows/" -ForegroundColor Cyan
    Write-Host ""
    exit 1
}

Write-Host "✅ Found pg_dump at: $($pgDump.Source)" -ForegroundColor Green
Write-Host ""

# Load DATABASE_URL from .env
$envFile = Join-Path $PSScriptRoot ".env"
if (-not (Test-Path $envFile)) {
    Write-Host "❌ .env file not found at: $envFile" -ForegroundColor Red
    exit 1
}

$databaseUrl = $null
Get-Content $envFile | ForEach-Object {
    if ($_ -match '^DATABASE_URL=(.+)$') {
        $databaseUrl = $matches[1].Trim()
    }
}

if (-not $databaseUrl) {
    Write-Host "❌ DATABASE_URL not found in .env file" -ForegroundColor Red
    exit 1
}

Write-Host "📊 Dumping schema..." -ForegroundColor Cyan
Write-Host ""

$outputFile = Join-Path $PSScriptRoot "schema_dump.sql"

try {
    # Run pg_dump
    & pg_dump --schema-only --no-owner --no-privileges "$databaseUrl" | Out-File -FilePath $outputFile -Encoding utf8 -NoNewline
    
    if ($LASTEXITCODE -eq 0) {
        $fileSize = (Get-Item $outputFile).Length
        $lineCount = (Get-Content $outputFile | Measure-Object -Line).Lines
        
        Write-Host "✅ Schema dump completed successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "📄 Output file: $outputFile" -ForegroundColor Cyan
        Write-Host "📊 Size: $fileSize bytes" -ForegroundColor Cyan
        Write-Host "📋 Lines: $lineCount" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Schema includes:" -ForegroundColor Yellow
        Write-Host "  - Table definitions (CREATE TABLE)" -ForegroundColor White
        Write-Host "  - Indexes" -ForegroundColor White
        Write-Host "  - Functions" -ForegroundColor White
        Write-Host "  - Triggers" -ForegroundColor White
        Write-Host "  - Constraints" -ForegroundColor White
        Write-Host ""
    } else {
        Write-Host "❌ pg_dump failed with exit code: $LASTEXITCODE" -ForegroundColor Red
        Write-Host ""
        Write-Host "Common issues:" -ForegroundColor Yellow
        Write-Host "  - Connection timeout: Check firewall/Supabase connection settings" -ForegroundColor White
        Write-Host "  - Authentication failed: Verify DATABASE_URL credentials" -ForegroundColor White
        Write-Host ""
        exit 1
    }
} catch {
    Write-Host "❌ Error running pg_dump: $_" -ForegroundColor Red
    Write-Host ""
    exit 1
}

