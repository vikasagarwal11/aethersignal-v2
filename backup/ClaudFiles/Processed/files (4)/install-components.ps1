# Week 2 Component Installation Script (PowerShell)
# Run this from your frontend directory

Write-Host "Creating directories..." -ForegroundColor Green
New-Item -ItemType Directory -Force -Path "lib" | Out-Null
New-Item -ItemType Directory -Force -Path "components/ui" | Out-Null

Write-Host "Installing utils..." -ForegroundColor Green
Copy-Item "week2-components/utils.ts" -Destination "lib/utils.ts"

Write-Host "Installing components..." -ForegroundColor Green
Copy-Item "week2-components/input.tsx" -Destination "components/ui/input.tsx"
Copy-Item "week2-components/textarea.tsx" -Destination "components/ui/textarea.tsx"
Copy-Item "week2-components/select.tsx" -Destination "components/ui/select.tsx"
Copy-Item "week2-components/checkbox.tsx" -Destination "components/ui/checkbox.tsx"
Copy-Item "week2-components/switch.tsx" -Destination "components/ui/switch.tsx"
Copy-Item "week2-components/card.tsx" -Destination "components/ui/card.tsx"
Copy-Item "week2-components/dialog.tsx" -Destination "components/ui/dialog.tsx"
Copy-Item "week2-components/tabs.tsx" -Destination "components/ui/tabs.tsx"
Copy-Item "week2-components/badge.tsx" -Destination "components/ui/badge.tsx"
Copy-Item "week2-components/tooltip.tsx" -Destination "components/ui/tooltip.tsx"
Copy-Item "week2-components/signal-card.tsx" -Destination "components/ui/signal-card.tsx"
Copy-Item "week2-components/kpi-card.tsx" -Destination "components/ui/kpi-card.tsx"

Write-Host "✅ Installation complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:"
Write-Host "1. Run: npm run dev"
Write-Host "2. Create test page at app/test/page.tsx"
Write-Host "3. Visit http://localhost:3000/test"
