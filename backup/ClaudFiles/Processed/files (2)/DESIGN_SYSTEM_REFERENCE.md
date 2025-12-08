# AetherSignal V2: Design System Reference

**Quick reference for implementing the design system**

---

## 🎨 Color Tokens

```css
/* Copy this into your CSS/Tailwind config */

:root {
  /* Primary: Pharma Blue */
  --primary-900: #0A2540;
  --primary-700: #1E3A5F;
  --primary-500: #3B82F6;
  --primary-300: #60A5FA;
  --primary-100: #DBEAFE;
  
  /* Semantic */
  --success: #10B981;
  --warning: #F59E0B;
  --danger: #EF4444;
  --info: #3B82F6;
  
  /* Neutrals */
  --gray-900: #0F172A;
  --gray-700: #334155;
  --gray-500: #64748B;
  --gray-300: #CBD5E1;
  --gray-100: #F1F5F9;
  --white: #FFFFFF;
  
  /* Special */
  --quantum-gradient: linear-gradient(135deg, #667EEA 0%, #764BA2 100%);
}
```

---

## 📝 Typography Scale

```css
/* Font Stack */
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;

/* Sizes */
--text-xs: 12px;    /* Labels, captions */
--text-sm: 14px;    /* Secondary text */
--text-base: 16px;  /* Body */
--text-lg: 18px;    /* Emphasized */
--text-xl: 20px;    /* Section headers */
--text-2xl: 24px;   /* Page titles */
--text-3xl: 30px;   /* Hero */
--text-4xl: 36px;   /* Landing */

/* Weights */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

---

## 🧩 Component Examples

### Button Component

```tsx
// Button.tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  onClick?: () => void;
}

export function Button({ 
  variant = 'primary', 
  size = 'md', 
  children, 
  onClick 
}: ButtonProps) {
  const baseClasses = 'font-semibold rounded-lg transition-all duration-200';
  
  const variantClasses = {
    primary: 'bg-blue-500 hover:bg-blue-600 text-white shadow-md hover:shadow-lg',
    secondary: 'bg-gray-700 hover:bg-gray-600 text-white',
    danger: 'bg-red-500 hover:bg-red-600 text-white',
    ghost: 'bg-transparent hover:bg-gray-800 text-gray-300'
  };
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };
  
  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
```

**Usage:**
```tsx
<Button variant="primary" size="lg">Run Analysis</Button>
<Button variant="secondary" size="md">Save Query</Button>
<Button variant="danger" size="md">Delete</Button>
<Button variant="ghost" size="sm">Cancel</Button>
```

---

### Signal Card Component

```tsx
// SignalCard.tsx
interface SignalCardProps {
  drug: string;
  reaction: string;
  priority: 'low' | 'moderate' | 'high' | 'critical';
  prr: number;
  cases: number;
  quantumScore: number;
  onClick?: () => void;
}

export function SignalCard({
  drug,
  reaction,
  priority,
  prr,
  cases,
  quantumScore,
  onClick
}: SignalCardProps) {
  const priorityColors = {
    low: 'border-green-500 bg-green-500/10',
    moderate: 'border-yellow-500 bg-yellow-500/10',
    high: 'border-red-500 bg-red-500/10',
    critical: 'border-purple-500 bg-purple-500/10'
  };
  
  const priorityLabels = {
    low: '✓ Low',
    moderate: '⚠ Moderate',
    high: '⚠️ High',
    critical: '🚨 Critical'
  };
  
  return (
    <div
      className={`p-4 rounded-lg border-l-4 ${priorityColors[priority]} 
                  hover:shadow-lg transition-all cursor-pointer`}
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-bold text-lg text-white">{drug}</h3>
          <p className="text-gray-300 text-sm">{reaction}</p>
        </div>
        <span className="text-xs font-semibold px-2 py-1 rounded bg-gray-800">
          {priorityLabels[priority]}
        </span>
      </div>
      
      <div className="grid grid-cols-3 gap-2 mt-3 text-sm">
        <div>
          <p className="text-gray-500 text-xs">PRR</p>
          <p className="font-bold text-white">{prr.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs">Cases</p>
          <p className="font-bold text-white">{cases}</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs">Quantum</p>
          <p className="font-bold text-purple-400">{(quantumScore * 100).toFixed(0)}%</p>
        </div>
      </div>
    </div>
  );
}
```

**Usage:**
```tsx
<SignalCard
  drug="Dupilumab"
  reaction="Anaphylaxis"
  priority="critical"
  prr={8.3}
  cases={127}
  quantumScore={0.89}
  onClick={() => console.log('View details')}
/>
```

---

### Command Palette Component

```tsx
// CommandPalette.tsx
import { Command } from 'cmdk';

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Command.Dialog
      open={open}
      onOpenChange={onClose}
      className="fixed inset-0 z-50"
    >
      <div className="fixed inset-0 bg-black/80" onClick={onClose} />
      
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 
                      w-full max-w-2xl bg-gray-900 rounded-xl shadow-2xl border border-gray-700">
        
        <Command.Input
          placeholder="Type a command or search..."
          className="w-full px-4 py-3 bg-transparent text-white text-lg 
                     outline-none border-b border-gray-700"
        />
        
        <Command.List className="max-h-96 overflow-y-auto p-2">
          <Command.Empty className="py-6 text-center text-gray-500">
            No results found.
          </Command.Empty>
          
          <Command.Group heading="Recent" className="text-gray-500 text-xs px-2 py-1">
            <Command.Item className="px-3 py-2 rounded hover:bg-gray-800 cursor-pointer">
              Dupilumab signals
            </Command.Item>
            <Command.Item className="px-3 py-2 rounded hover:bg-gray-800 cursor-pointer">
              Q4 2024 PSUR
            </Command.Item>
          </Command.Group>
          
          <Command.Group heading="Actions" className="text-gray-500 text-xs px-2 py-1 mt-2">
            <Command.Item className="px-3 py-2 rounded hover:bg-gray-800 cursor-pointer">
              📤 Upload dataset
            </Command.Item>
            <Command.Item className="px-3 py-2 rounded hover:bg-gray-800 cursor-pointer">
              🔍 New query
            </Command.Item>
            <Command.Item className="px-3 py-2 rounded hover:bg-gray-800 cursor-pointer">
              📊 Generate report
            </Command.Item>
          </Command.Group>
        </Command.List>
      </div>
    </Command.Dialog>
  );
}
```

**Usage:**
```tsx
const [commandOpen, setCommandOpen] = useState(false);

// Listen for Cmd+K
useEffect(() => {
  const down = (e: KeyboardEvent) => {
    if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      setCommandOpen(true);
    }
  };
  document.addEventListener('keydown', down);
  return () => document.removeEventListener('keydown', down);
}, []);

<CommandPalette open={commandOpen} onClose={() => setCommandOpen(false)} />
```

---

### Data Table with Virtual Scrolling

```tsx
// DataTable.tsx
import { useVirtualizer } from '@tanstack/react-virtual';

interface Column {
  key: string;
  label: string;
  width?: number;
}

interface DataTableProps {
  columns: Column[];
  data: any[];
  onRowClick?: (row: any) => void;
}

export function DataTable({ columns, data, onRowClick }: DataTableProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 48,
    overscan: 10
  });
  
  return (
    <div className="border border-gray-700 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 flex">
        {columns.map((col) => (
          <div
            key={col.key}
            className="px-4 py-3 font-semibold text-sm text-gray-300"
            style={{ width: col.width || 'auto', flex: col.width ? undefined : 1 }}
          >
            {col.label}
          </div>
        ))}
      </div>
      
      {/* Virtual Rows */}
      <div
        ref={parentRef}
        className="h-96 overflow-auto"
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            position: 'relative'
          }}
        >
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const row = data[virtualRow.index];
            return (
              <div
                key={virtualRow.key}
                className="absolute top-0 left-0 w-full flex items-center 
                           hover:bg-gray-800/50 cursor-pointer border-b border-gray-800"
                style={{
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`
                }}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((col) => (
                  <div
                    key={col.key}
                    className="px-4 text-sm text-gray-100"
                    style={{ width: col.width || 'auto', flex: col.width ? undefined : 1 }}
                  >
                    {row[col.key]}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
```

**Usage:**
```tsx
<DataTable
  columns={[
    { key: 'drug', label: 'Drug', width: 200 },
    { key: 'reaction', label: 'Reaction', width: 200 },
    { key: 'prr', label: 'PRR', width: 100 },
    { key: 'cases', label: 'Cases', width: 100 }
  ]}
  data={signals} // Can be 1M+ rows
  onRowClick={(row) => console.log('Clicked:', row)}
/>
```

---

## 🎭 Animation Examples

### Fade In on Mount

```tsx
import { motion } from 'framer-motion';

<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.3 }}
>
  Content here
</motion.div>
```

### Slide In from Bottom

```tsx
<motion.div
  initial={{ y: 20, opacity: 0 }}
  animate={{ y: 0, opacity: 1 }}
  transition={{ duration: 0.4, ease: 'easeOut' }}
>
  Sliding content
</motion.div>
```

### Stagger Children (List Animation)

```tsx
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

<motion.ul variants={container} initial="hidden" animate="show">
  {items.map((item) => (
    <motion.li key={item.id} variants={item}>
      {item.name}
    </motion.li>
  ))}
</motion.ul>
```

---

## 📐 Layout Examples

### Three-Layer Navigation

```tsx
// Layout.tsx
export function Layout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  return (
    <div className="min-h-screen bg-gray-900">
      {/* Top Nav */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-gray-800 
                         border-b border-gray-700 flex items-center px-4 z-50">
        <div className="flex items-center gap-4">
          <Logo />
          <WorkspaceSwitcher />
        </div>
        <div className="flex-1 max-w-xl mx-8">
          <SearchBar />
        </div>
        <div className="flex items-center gap-4">
          <Notifications />
          <UserMenu />
        </div>
      </header>
      
      {/* Sidebar + Main */}
      <div className="pt-16 flex">
        {/* Sidebar */}
        <aside
          className={`fixed left-0 top-16 bottom-0 bg-gray-800 
                      border-r border-gray-700 transition-all
                      ${sidebarOpen ? 'w-64' : 'w-0'}`}
        >
          <Navigation />
        </aside>
        
        {/* Main Content */}
        <main
          className={`flex-1 transition-all ${sidebarOpen ? 'ml-64' : 'ml-0'}`}
        >
          <div className="p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
```

---

## 🎨 Tailwind Config

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          900: '#0A2540',
          700: '#1E3A5F',
          500: '#3B82F6',
          300: '#60A5FA',
          100: '#DBEAFE'
        },
        gray: {
          900: '#0F172A',
          800: '#1E293B',
          700: '#334155',
          600: '#475569',
          500: '#64748B',
          400: '#94A3B8',
          300: '#CBD5E1',
          200: '#E2E8F0',
          100: '#F1F5F9'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace']
      },
      fontSize: {
        'xs': '12px',
        'sm': '14px',
        'base': '16px',
        'lg': '18px',
        'xl': '20px',
        '2xl': '24px',
        '3xl': '30px',
        '4xl': '36px'
      },
      boxShadow: {
        'sm': '0 2px 4px rgba(0,0,0,0.1)',
        'md': '0 4px 12px rgba(0,0,0,0.15)',
        'lg': '0 12px 24px rgba(0,0,0,0.2)',
        'xl': '0 20px 40px rgba(0,0,0,0.3)'
      }
    }
  },
  plugins: []
}
```

---

## 📦 Package.json Dependencies

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "next": "^14.0.0",
    "typescript": "^5.3.0",
    "tailwindcss": "^3.4.0",
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-dropdown-menu": "^2.0.6",
    "framer-motion": "^10.16.0",
    "@tanstack/react-query": "^5.17.0",
    "@tanstack/react-virtual": "^3.0.0",
    "zustand": "^4.4.7",
    "cmdk": "^0.2.0",
    "recharts": "^2.10.0",
    "date-fns": "^3.0.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/node": "^20.10.0",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32",
    "eslint": "^8.56.0",
    "prettier": "^3.1.0"
  }
}
```

---

## 🚀 Quick Start Commands

```bash
# Create Next.js app
npx create-next-app@latest aethersignal-v2 --typescript --tailwind --app

# Install dependencies
cd aethersignal-v2
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu
npm install framer-motion @tanstack/react-query @tanstack/react-virtual
npm install zustand cmdk recharts date-fns

# Run dev server
npm run dev
```

---

## ✅ Checklist for Each Component

When building a new component:

- [ ] Use consistent color tokens
- [ ] Apply proper typography scale
- [ ] Add hover/active states
- [ ] Include loading states
- [ ] Handle error states
- [ ] Make it responsive
- [ ] Add keyboard shortcuts (if applicable)
- [ ] Test with screen readers
- [ ] Add animations (subtle)
- [ ] Document props in Storybook

---

**This design system ensures consistency across all screens and makes development faster.**

Copy these components, customize as needed, and maintain the visual language throughout the app.
