# Week 2 Component Installation Script
# Run this from your frontend directory

# Step 1: Create necessary directories
echo "Creating directories..."
mkdir -p lib
mkdir -p components/ui

# Step 2: Copy utils.ts to lib folder
echo "Installing utils..."
cp week2-components/utils.ts lib/utils.ts

# Step 3: Copy all component files to components/ui
echo "Installing components..."
cp week2-components/input.tsx components/ui/input.tsx
cp week2-components/textarea.tsx components/ui/textarea.tsx
cp week2-components/select.tsx components/ui/select.tsx
cp week2-components/checkbox.tsx components/ui/checkbox.tsx
cp week2-components/switch.tsx components/ui/switch.tsx
cp week2-components/card.tsx components/ui/card.tsx
cp week2-components/dialog.tsx components/ui/dialog.tsx
cp week2-components/tabs.tsx components/ui/tabs.tsx
cp week2-components/badge.tsx components/ui/badge.tsx
cp week2-components/tooltip.tsx components/ui/tooltip.tsx
cp week2-components/signal-card.tsx components/ui/signal-card.tsx
cp week2-components/kpi-card.tsx components/ui/kpi-card.tsx

echo "✅ Installation complete!"
echo ""
echo "Next steps:"
echo "1. Run: npm run dev"
echo "2. Create test page at app/test/page.tsx"
echo "3. Visit http://localhost:3000/test"
