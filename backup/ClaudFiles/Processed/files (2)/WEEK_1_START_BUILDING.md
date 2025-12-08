# 🚀 Week 1: Start Building - Project Setup

**Let's initialize your V2 project structure RIGHT NOW!**

---

## ✅ **WHAT WE HAVE**

```
✅ Design System Complete
✅ Screen Specifications Complete
✅ All API Keys Saved
✅ Database Optimized
✅ Ready to Code!
```

---

## 📂 **PROJECT STRUCTURE**

We'll create this structure:

```
aethersignal-v2/
├── backup/                    # Your current Streamlit (reference only)
├── frontend/                  # New Next.js app
│   ├── app/                  # Next.js 14 App Router
│   ├── components/           # React components
│   ├── lib/                  # Utilities
│   ├── public/               # Static assets
│   └── styles/               # Global styles
├── backend/                   # New FastAPI app
│   ├── app/                  # FastAPI app
│   │   ├── api/             # API routes
│   │   ├── core/            # Config, database
│   │   ├── models/          # Pydantic models
│   │   └── services/        # Business logic
│   └── tests/                # Tests
├── shared/                    # Shared types, constants
└── docs/                      # Documentation
```

---

## 🛠️ **STEP 1: CREATE PROJECT STRUCTURE** (5 minutes)

Run these commands in your terminal:

```bash
# Navigate to where you want the project
cd ~/Documents  # or wherever you keep projects

# Create main directory
mkdir aethersignal-v2
cd aethersignal-v2

# Create subdirectories
mkdir -p backup frontend backend shared docs

echo "✅ Project structure created!"
```

---

## 📦 **STEP 2: INITIALIZE FRONTEND** (10 minutes)

### **2A: Create Next.js App**

```bash
cd frontend

# Create Next.js 14 app with TypeScript and Tailwind
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*"

# When prompted:
# ✓ Would you like to use TypeScript? Yes
# ✓ Would you like to use ESLint? Yes
# ✓ Would you like to use Tailwind CSS? Yes
# ✓ Would you like to use `app/` directory? Yes
# ✓ Would you like to customize the default import alias? No
```

### **2B: Install Frontend Dependencies**

```bash
# Core libraries
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-select @radix-ui/react-tabs @radix-ui/react-tooltip

# Animation
npm install framer-motion

# Data fetching & state
npm install @tanstack/react-query @tanstack/react-virtual zustand

# Forms & validation
npm install react-hook-form zod @hookform/resolvers

# Charts
npm install recharts d3

# Command palette
npm install cmdk

# Icons
npm install lucide-react

# Date handling
npm install date-fns

# Utilities
npm install clsx tailwind-merge class-variance-authority

# Analytics (we'll configure later)
npm install posthog-js
npm install @sentry/nextjs

echo "✅ Frontend dependencies installed!"
```

### **2C: Configure Tailwind with Design System**

Create `tailwind.config.ts`:

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary - Pharma Blue
        primary: {
          50: "#EFF6FF",
          100: "#DBEAFE",
          200: "#BFDBFE",
          300: "#93C5FD",
          400: "#60A5FA",
          500: "#3B82F6",  // BASE
          600: "#2563EB",
          700: "#1D4ED8",
          800: "#1E40AF",
          900: "#1E3A8A",
        },
        // Semantic colors
        success: {
          50: "#F0FDF4",
          500: "#22C55E",
          700: "#15803D",
        },
        warning: {
          50: "#FFFBEB",
          500: "#F59E0B",
          700: "#B45309",
        },
        danger: {
          50: "#FEF2F2",
          500: "#EF4444",
          700: "#B91C1C",
        },
        urgent: {
          50: "#FAF5FF",
          500: "#A855F7",
          700: "#7E22CE",
        },
        // Quantum gradient
        quantum: {
          from: "#667EEA",
          to: "#764BA2",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Courier New", "monospace"],
      },
      boxShadow: {
        sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
        md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
        xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        "2xl": "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
        focus: "0 0 0 3px rgba(59, 130, 246, 0.5)",
        glow: "0 0 20px rgba(59, 130, 246, 0.4)",
      },
      animation: {
        "fade-in": "fadeIn 200ms ease-out",
        "slide-up": "slideUp 300ms ease-out",
        "scale-in": "scaleIn 200ms ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
```

---

## 🐍 **STEP 3: INITIALIZE BACKEND** (10 minutes)

### **3A: Set Up Python Environment**

```bash
cd ../backend

# Create virtual environment
python3 -m venv venv

# Activate it
source venv/bin/activate  # On Mac/Linux
# OR
venv\Scripts\activate  # On Windows

# Upgrade pip
pip install --upgrade pip
```

### **3B: Install Backend Dependencies**

```bash
# Core
pip install fastapi uvicorn[standard] python-multipart

# Database
pip install sqlalchemy asyncpg psycopg2-binary alembic

# Validation
pip install pydantic pydantic-settings

# Auth
pip install python-jose[cryptography] passlib[bcrypt] python-multipart

# CORS
pip install python-cors

# Environment
pip install python-dotenv

# Testing
pip install pytest pytest-asyncio httpx

# Analytics
pip install sentry-sdk[fastapi]

# Data processing (copy from your existing code)
pip install pandas numpy scipy

# Save dependencies
pip freeze > requirements.txt

echo "✅ Backend dependencies installed!"
```

### **3C: Create Backend Structure**

```bash
mkdir -p app/api app/core app/models app/services app/db
mkdir tests

# Create __init__.py files
touch app/__init__.py
touch app/api/__init__.py
touch app/core/__init__.py
touch app/models/__init__.py
touch app/services/__init__.py
touch app/db/__init__.py
```

---

## 🔐 **STEP 4: CREATE ENVIRONMENT FILES** (5 minutes)

### **Frontend `.env.local`**

```bash
cd ../frontend

cat > .env.local << 'EOF'
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://scrksfxnkxmvvdzwmqnc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjcmtzZnhua3htdnZkendtcW5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2MDM2NTcsImV4cCI6MjA3OTE3OTY1N30.tumWvHiXv7VsX0QTm-iyc5L0dwGFDTtgEkHAUieMcIY

# PostHog
NEXT_PUBLIC_POSTHOG_KEY=phc_4BRkFQ8JXs7XHT4Ed3uO87fa3ysoATunA10F58Aq85d
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com

# Sentry
NEXT_PUBLIC_SENTRY_DSN=https://0575364e6680251680fa0720c9e1b1e@o4509285113921536.ingest.us.sentry.io/4510485293039616

# API
NEXT_PUBLIC_API_URL=http://localhost:8000
EOF

echo "✅ Frontend .env.local created!"
```

### **Backend `.env`**

```bash
cd ../backend

cat > .env << 'EOF'
# Database
DATABASE_URL=postgresql://postgres:Hsgbu@118811@scrksfxnkxmvvdzwmqnc.supabase.co:5432/postgres

# Supabase
SUPABASE_URL=https://scrksfxnkxmvvdzwmqnc.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjcmtzZnhua3htdnZkendtcW5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2MDM2NTcsImV4cCI6MjA3OTE3OTY1N30.tumWvHiXv7VsX0QTm-iyc5L0dwGFDTtgEkHAUieMcIY
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjcmtzZnhua3htdnZkendtcW5jIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzYwMzY1NywiZXhwIjoyMDc5MTc5NjU3fQ.dUwNCFto69ZqCqcjDUMDlOuEkZ0PArK9B-RkNTp5jmw

# Sentry
SENTRY_DSN=https://a5e1134b30e6c1128255182411617f8d@o4509285113921536.ingest.us.sentry.io/4510485313683456

# App
SECRET_KEY=your-secret-key-here-change-in-production
ENVIRONMENT=development
EOF

echo "✅ Backend .env created!"
```

---

## 📝 **STEP 5: CREATE INITIAL FILES** (10 minutes)

### **Frontend: Create First Component**

```bash
cd ../frontend

mkdir -p components/ui

cat > components/ui/button.tsx << 'EOF'
import { cva, type VariantProps } from "class-variance-authority";
import { ButtonHTMLAttributes, forwardRef } from "react";

const buttonVariants = cva(
  "inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        primary: "bg-primary-500 hover:bg-primary-600 active:bg-primary-700 text-white shadow-sm hover:shadow-md",
        secondary: "bg-gray-700 hover:bg-gray-600 active:bg-gray-500 text-white shadow-sm",
        danger: "bg-danger-500 hover:bg-danger-600 active:bg-danger-700 text-white shadow-sm",
        ghost: "bg-transparent hover:bg-gray-800 active:bg-gray-700 text-gray-300",
      },
      size: {
        sm: "h-8 px-3 text-sm",
        md: "h-10 px-4 text-base",
        lg: "h-12 px-6 text-lg",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant, size, className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={buttonVariants({ variant, size, className })}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
EOF

echo "✅ Button component created!"
```

### **Backend: Create Main App**

```bash
cd ../backend

cat > app/main.py << 'EOF'
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import sentry_sdk
import os
from dotenv import load_dotenv

load_dotenv()

# Initialize Sentry
sentry_sdk.init(
    dsn=os.getenv("SENTRY_DSN"),
    traces_sample_rate=1.0,
    environment=os.getenv("ENVIRONMENT", "development"),
)

app = FastAPI(
    title="AetherSignal V2 API",
    description="Pharmacovigilance analytics platform",
    version="2.0.0",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {
        "message": "AetherSignal V2 API",
        "version": "2.0.0",
        "status": "running"
    }

@app.get("/health")
async def health():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
EOF

echo "✅ FastAPI app created!"
```

---

## 🎯 **STEP 6: TEST EVERYTHING** (5 minutes)

### **Test Frontend**

```bash
cd ../frontend

# Start development server
npm run dev

# Open browser to http://localhost:3000
# You should see Next.js welcome page
```

### **Test Backend**

```bash
cd ../backend
source venv/bin/activate

# Start FastAPI server
python app/main.py

# Open browser to http://localhost:8000/docs
# You should see Swagger API docs
```

---

## ✅ **VERIFICATION CHECKLIST**

```
□ Project structure created
□ Frontend initialized (Next.js + Tailwind)
□ Frontend dependencies installed
□ Backend initialized (FastAPI + Python)
□ Backend dependencies installed
□ Environment files created (.env.local, .env)
□ Button component works
□ FastAPI app runs
□ Frontend runs (localhost:3000)
□ Backend runs (localhost:8000)
□ API docs accessible (localhost:8000/docs)
```

---

## 📊 **YOUR PROGRESS**

```
✅ Week 1 Day 1: Project initialized
✅ Design system complete
✅ API keys configured
✅ Ready for Week 2!

NEXT: Build component library (Week 2)
```

---

## 💬 **WHAT TO DO NOW**

1. **Run the commands above** (30-45 minutes)
2. **Verify everything works**
3. **Take a screenshot of running apps**
4. **Share with me**: "✅ Week 1 complete! Frontend and backend running!"

Then I'll guide you through **Week 2: Building the component library**! 🚀

---

**Questions? Stuck anywhere? Let me know!** I'll help you troubleshoot! 💪
