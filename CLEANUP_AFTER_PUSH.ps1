# Cleanup Script - Run AFTER git push finishes
# Removes large files and .md files from git tracking

Write-Host "`n🧹 CLEANING UP GIT REPOSITORY" -ForegroundColor Cyan
Write-Host "`nStep 1: Removing large data files..." -ForegroundColor Yellow

# Remove large files
git rm --cached data/snomed_ct.db 2>$null
git rm --cached "data/SnomedCT_ManagedServiceUS_PRODUCTION_US1000124_20250901T120000Z.zip" 2>$null
git rm --cached -r snomed_extracted/ 2>$null
git rm --cached -r faers_data/ 2>$null

Write-Host "  ✅ Large files removed from tracking" -ForegroundColor Green

Write-Host "`nStep 2: Removing .md files (keeping README.md)..." -ForegroundColor Yellow

# Get all .md files tracked by git
$mdFiles = git ls-files "*.md" | Where-Object { 
    $_ -ne "README.md" -and 
    $_ -notlike "frontend/README.md" -and 
    $_ -notlike "backend/README.md" 
}

if ($mdFiles) {
    $mdFiles | ForEach-Object {
        git rm --cached $_ 2>$null
    }
    Write-Host "  ✅ Removed $($mdFiles.Count) .md files from tracking" -ForegroundColor Green
} else {
    Write-Host "  ℹ️  No .md files to remove" -ForegroundColor Gray
}

Write-Host "`nStep 3: Committing cleanup..." -ForegroundColor Yellow
git commit -m "Remove large files and documentation from tracking (use .gitignore)"

Write-Host "`nStep 4: Pushing cleanup..." -ForegroundColor Yellow
git push origin main

Write-Host "`n✅ CLEANUP COMPLETE!" -ForegroundColor Green
Write-Host "  • Large files excluded (still exist locally)" -ForegroundColor White
Write-Host "  • .md files excluded (still exist locally)" -ForegroundColor White
Write-Host "  • .gitignore updated for future commits" -ForegroundColor White

