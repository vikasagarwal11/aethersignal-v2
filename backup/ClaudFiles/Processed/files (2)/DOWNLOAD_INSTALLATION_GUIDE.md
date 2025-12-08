# 📥 COMPLETE DOWNLOAD & INSTALLATION GUIDE

**For non-technical users - Step by step with pictures**

---

## 🎯 **WHAT YOU'RE DOWNLOADING**

- **13 React component files** (.tsx files)
- **1 utility file** (utils.ts)
- **1 test page** (page.tsx)
- **2 installation scripts** (.sh and .ps1)

**Total:** 17 files packaged in **week2-components.zip**

---

## 📥 **STEP 1: DOWNLOAD THE ZIP FILE**

### **Option A: Download from Claude Interface**

1. Look at the **right sidebar** of this conversation
2. Find the file: **`week2-components.zip`**
3. Click the **download button** (⬇️ icon)
4. File will download to your **Downloads** folder

### **Option B: Individual Files**

If you don't see the zip file, download each file individually:

1. Scroll through this conversation
2. Find each component file I created
3. Each will have a **download button**
4. Download all 17 files

---

## 📂 **STEP 2: EXTRACT THE ZIP FILE**

### **Windows:**
1. Go to your **Downloads** folder
2. Find **week2-components.zip**
3. **Right-click** → **Extract All**
4. Choose location (e.g., Desktop)
5. Click **Extract**

### **Mac:**
1. Go to your **Downloads** folder
2. **Double-click** week2-components.zip
3. Folder will automatically extract

You should now have a folder called **week2-components** with 14 files inside.

---

## 🚀 **STEP 3: INSTALL COMPONENTS**

### **Windows Users (PowerShell):**

```powershell
# 1. Open PowerShell in your frontend directory
cd path\to\aethersignal-v2\frontend

# 2. Copy the week2-components folder here
# (Drag from Desktop/Downloads to frontend folder)

# 3. Run installation script
.\week2-components\install-components.ps1

# If you get "execution policy" error, run this first:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### **Mac/Linux Users (Terminal):**

```bash
# 1. Open Terminal
cd ~/path/to/aethersignal-v2/frontend

# 2. Copy week2-components folder here
# (Drag from Downloads to frontend folder)

# 3. Make script executable
chmod +x week2-components/install-components.sh

# 4. Run installation script
./week2-components/install-components.sh
```

### **Manual Installation (If scripts don't work):**

```bash
# From frontend directory:

# Create directories
mkdir -p lib
mkdir -p components/ui

# Copy utils
cp week2-components/utils.ts lib/

# Copy all components
cp week2-components/*.tsx components/ui/
```

---

## 📄 **STEP 4: CREATE TEST PAGE**

### **Create Test Directory:**

```bash
# From frontend directory
mkdir -p app/test
```

### **Copy Test Page:**

1. Find **test-page.tsx** in the downloads
2. Copy it to: **frontend/app/test/page.tsx**

**Or create manually:**

```bash
# Windows PowerShell
Copy-Item week2-components\test-page.tsx app\test\page.tsx

# Mac/Linux
cp week2-components/test-page.tsx app/test/page.tsx
```

---

## ✅ **STEP 5: VERIFY INSTALLATION**

### **Check Files Exist:**

```bash
# From frontend directory

# Check utils
ls lib/utils.ts

# Check components (should show 13 files)
ls components/ui/

# Check test page
ls app/test/page.tsx
```

**You should see:**
```
lib/
  utils.ts ✅

components/ui/
  button.tsx ✅
  input.tsx ✅
  textarea.tsx ✅
  select.tsx ✅
  checkbox.tsx ✅
  switch.tsx ✅
  card.tsx ✅
  dialog.tsx ✅
  tabs.tsx ✅
  badge.tsx ✅
  tooltip.tsx ✅
  signal-card.tsx ✅
  kpi-card.tsx ✅

app/test/
  page.tsx ✅
```

---

## 🧪 **STEP 6: TEST COMPONENTS**

### **Start Development Server:**

```bash
# Make sure you're in frontend directory
cd frontend

# Start server
npm run dev
```

### **Open Browser:**

1. Open your browser
2. Go to: **http://localhost:3000/test**
3. You should see the component library test page!

---

## 🎉 **WHAT YOU SHOULD SEE**

If everything worked, you'll see:

```
✅ Big heading: "AetherSignal Component Library"
✅ Multiple sections showing different components:
   - Buttons (all variants and sizes)
   - Input fields (with icons, errors)
   - Textarea (with character counter)
   - Select dropdown
   - Checkboxes and switches
   - Badges (all colors)
   - Tabs (clickable)
   - Modal dialogs (clickable buttons)
   - 3 KPI cards with metrics
   - 4 Signal cards with drug data
   - Success message at bottom
```

---

## ❌ **TROUBLESHOOTING**

### **Problem: "Module not found: Can't resolve '@/lib/utils'"**

**Solution:**
```bash
# Check utils.ts exists
ls lib/utils.ts

# If missing, copy it manually
cp week2-components/utils.ts lib/utils.ts
```

---

### **Problem: "Module not found: Can't resolve '@/components/ui/...'"**

**Solution:**
```bash
# Check components exist
ls components/ui/

# If missing, copy all components
cp week2-components/*.tsx components/ui/
```

---

### **Problem: Page shows blank/white screen**

**Solution:**
1. Open browser console (F12)
2. Look for error messages
3. Usually missing imports or typos
4. Check that all files are in correct locations

---

### **Problem: Can't find week2-components.zip**

**Solution:**
Download individual files:
1. Scroll through this conversation
2. Find each component (input.tsx, card.tsx, etc.)
3. Click download button on each
4. Save all to a folder
5. Copy to frontend directory

---

## 📸 **TAKE SCREENSHOTS**

Once everything works:

1. **Screenshot 1:** Test page showing all components
2. **Screenshot 2:** File explorer showing installed files
3. **Share with me:** "✅ All installed! Screenshots attached!"

---

## 🎯 **NEXT STEPS AFTER INSTALLATION**

Once you confirm everything works:

**I'll create:**
1. DataTable component (virtual scrolling)
2. Command Palette (Cmd+K search)
3. Toast notifications
4. Dropdown menu
5. Loading states
6. Empty states

**Then Week 3:**
- Build Signal Explorer screen
- Connect to your backend API
- Real data integration

---

## 💬 **NEED HELP?**

**If stuck, tell me:**

1. What step you're on
2. What error message you see (if any)
3. Screenshot of the error
4. Your operating system (Windows/Mac)

**I'll help you fix it immediately!** 🚀

---

## 📊 **FILE LOCATIONS SUMMARY**

```
aethersignal-v2/
└── frontend/
    ├── lib/
    │   └── utils.ts              ← Utility functions
    ├── components/
    │   └── ui/
    │       ├── button.tsx        ← All 13 components here
    │       ├── input.tsx
    │       ├── textarea.tsx
    │       ├── select.tsx
    │       ├── checkbox.tsx
    │       ├── switch.tsx
    │       ├── card.tsx
    │       ├── dialog.tsx
    │       ├── tabs.tsx
    │       ├── badge.tsx
    │       ├── tooltip.tsx
    │       ├── signal-card.tsx
    │       └── kpi-card.tsx
    └── app/
        └── test/
            └── page.tsx          ← Test page
```

---

## ✅ **SUCCESS CRITERIA**

You'll know it worked when:

- [ ] No errors in terminal
- [ ] Test page loads at /test
- [ ] You can click buttons
- [ ] You can type in inputs
- [ ] Modal opens when clicked
- [ ] Tabs switch when clicked
- [ ] SignalCards show drug data
- [ ] Everything looks professional

---

**Download now and let me know when you're ready to test!** 📥🚀
