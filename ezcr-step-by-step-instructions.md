# EZCR - Complete Step-by-Step Project Instructions

**Version**: 2.0  
**Last Updated**: October 7, 2025  
**Estimated Time**: 8 weeks (full-time development)  
**Difficulty**: Intermediate to Advanced

---

## TABLE OF CONTENTS

1. [Pre-Setup Requirements](#pre-setup-requirements)
2. [Week 0: Environment Setup](#week-0-environment-setup)
3. [Week 1: Foundation](#week-1-foundation)
4. [Week 2: Database & Core Components](#week-2-database--core-components)
5. [Week 3: E-Commerce Features](#week-3-e-commerce-features)
6. [Week 4: Product Configurator](#week-4-product-configurator)
7. [Week 5: AI & Automation](#week-5-ai--automation)
8. [Week 6: Advanced Features](#week-6-advanced-features)
9. [Week 7: Testing & Integration](#week-7-testing--integration)
10. [Week 8: Launch Preparation](#week-8-launch-preparation)
11. [Post-Launch](#post-launch)
12. [Troubleshooting Guide](#troubleshooting-guide)

---

## PRE-SETUP REQUIREMENTS

### Required Accounts & Access

✅ **GitHub Account**
- Username: mocamGitHub
- Repository: ezcr (private)
- SSH key configured

✅ **Hetzner VPS**
- IP: 5.161.84.153
- SSH User: nexcyte
- SSH key or password access

✅ **Coolify Access**
- URL: https://coolify.nexcyte.com
- Login credentials
- Project creation permission

✅ **Supabase Access**
- URL: https://supabase.nexcyte.com
- Anon Key: (obtain from Supabase dashboard)
- Service Key: (obtain from Supabase dashboard)

✅ **Stripe Account**
- Test mode publishable key
- Test mode secret key
- Webhook endpoint configured

✅ **Resend Account** (Email service)
- API key
- Sender email verified

✅ **OpenAI Account** (For AI features)
- API key
- Organization ID

✅ **Optional Services**
- Twilio (SMS): Account SID, Auth Token, Phone Number
- Google Analytics: Measurement ID

### Local Development Environment

✅ **Software Installation**

```bash
# 1. Node.js 20.x LTS
# Download: https://nodejs.org/
node --version  # Should show v20.x.x

# 2. pnpm (Package Manager)
npm install -g pnpm
pnpm --version  # Should show 8.x.x

# 3. Git
# Download: https://git-scm.com/
git --version

# 4. VS Code (Recommended)
# Download: https://code.visualstudio.com/

# 5. PostgreSQL Client (Optional, for direct DB access)
# Download: https://www.postgresql.org/download/
# Or use: https://dbeaver.io/
```

✅ **VS Code Extensions** (Recommended)

```
- ESLint (dbaeumer.vscode-eslint)
- Prettier (esbenp.prettier-vscode)
- Tailwind CSS IntelliSense (bradlc.vscode-tailwindcss)
- TypeScript Vue Plugin (Vue.volar)
- Prisma (prisma.prisma)
- Path Intellisense (christian-kohler.path-intellisense)
- GitLens (eamodio.gitlens)
- Error Lens (usernamehw.errorlens)
```

### Knowledge Base Files

✅ **Downloaded from Previous Chat**

```
1. UNIFIED-KNOWLEDGE-BASE.md (this should be saved in your project root)
2. Configurator HTML reference (from conversation 887c7cc3)
3. All agent specification .md files (will create in Week 0)
```

---

## WEEK 0: ENVIRONMENT SETUP

**Goal**: Set up development environment, create project structure, configure tools.

**Estimated Time**: 4-8 hours

### Step 0.1: Create Project Directory

```bash
# On Windows
cd C:\Users\morri\Dropbox\Websites
mkdir ezcr
cd ezcr

# Verify you're in the right directory
pwd
# Should show: C:\Users\morri\Dropbox\Websites\ezcr
```

### Step 0.2: Initialize Git Repository

```bash
# Initialize git
git init

# Set user info (if not already set globally)
git config user.name "mocamGitHub"
git config user.email "your-email@example.com"

# Create .gitignore
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
coverage/
.nyc_output/

# Next.js
.next/
out/
build/
dist/

# Production
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

# Local env files
.env
.env.local
.env.*.local
.env.development.local
.env.test.local
.env.production.local

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Misc
*.pem
*.key
*.cert

# Supabase
supabase/.branches
supabase/.temp

# NotebookLM
.notebooklm/
EOF

# Initial commit
git add .gitignore
git commit -m "Initial commit: Add .gitignore"
```

### Step 0.3: Create Next.js 15 Project

```bash
# Create Next.js project with TypeScript, Tailwind, App Router
npx create-next-app@latest . --typescript --tailwind --app --src-dir --import-alias "@/*"

# When prompted:
# ✓ Would you like to use ESLint? Yes
# ✓ Would you like to use Turbopack? Yes (for faster dev)
# ✓ Initialize a git repository? No (we already did)

# Verify installation
ls -la
# Should see: package.json, tsconfig.json, tailwind.config.ts, etc.
```

### Step 0.4: Install Core Dependencies

```bash
# Install all required packages
pnpm install @supabase/supabase-js @supabase/ssr
pnpm install @stripe/stripe-js stripe
pnpm install zustand
pnpm install zod react-hook-form @hookform/resolvers
pnpm install lucide-react
pnpm install framer-motion
pnpm install date-fns
pnpm install resend
pnpm install openai
pnpm install @radix-ui/react-*  # ShadCN dependencies (will add via CLI)

# Development dependencies
pnpm install -D @types/node
pnpm install -D prettier eslint-config-prettier
pnpm install -D playwright @playwright/test
pnpm install -D vitest @testing-library/react @testing-library/jest-dom
```

### Step 0.5: Initialize ShadCN UI

```bash
# Initialize ShadCN
npx shadcn@latest init

# When prompted:
# ✓ TypeScript: Yes
# ✓ Style: Default
# ✓ Base color: Slate
# ✓ CSS variables: Yes
# ✓ Import alias: @/components (default)

# Install essential UI components
npx shadcn@latest add button
npx shadcn@latest add input
npx shadcn@latest add label
npx shadcn@latest add card
npx shadcn@latest add dialog
npx shadcn@latest add dropdown-menu
npx shadcn@latest add select
npx shadcn@latest add checkbox
npx shadcn@latest add radio-group
npx shadcn@latest add textarea
npx shadcn@latest add badge
npx shadcn@latest add toast
npx shadcn@latest add alert
npx shadcn@latest add separator
npx shadcn@latest add skeleton
npx shadcn@latest add tabs
```

### Step 0.6: Configure Tailwind with Brand Colors

```typescript
// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // EZCR Brand Colors
        'brand-black': '#1a1a1a',
        'brand-orange': '#ff6b35',
        'brand-silver': '#c0c0c0',
        
        // Semantic colors
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "#1a1a1a",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "#c0c0c0",
          foreground: "hsl(var(--secondary-foreground))",
        },
        accent: {
          DEFAULT: "#ff6b35",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      fontSize: {
        // Elderly-friendly minimum 16px
        'xs': ['0.75rem', { lineHeight: '1.5' }],
        'sm': ['0.875rem', { lineHeight: '1.5' }],
        'base': ['1rem', { lineHeight: '1.625' }],     // 16px
        'lg': ['1.125rem', { lineHeight: '1.75' }],
        'xl': ['1.25rem', { lineHeight: '1.75' }],
        '2xl': ['1.5rem', { lineHeight: '2' }],
        '3xl': ['1.875rem', { lineHeight: '2.25' }],
        '4xl': ['2.25rem', { lineHeight: '2.5' }],
      },
      minHeight: {
        'touch': '44px', // Minimum touch target
      },
      minWidth: {
        'touch': '44px',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
```

### Step 0.7: Create Directory Structure

```bash
# Create all necessary directories
mkdir -p .claude/agents
mkdir -p .claude/context
mkdir -p .notebooklm
mkdir -p docs/{architecture,api,guides,decisions}
mkdir -p email-templates/{orders,cart,support}
mkdir -p n8n/workflows
mkdir -p public/{images,videos,pdfs}
mkdir -p scripts
mkdir -p src/components/{layout,products,cart,configurator,chat}
mkdir -p src/lib/{ai,automation,commerce,configurator,db,stripe,supabase,validation}
mkdir -p src/middleware
mkdir -p src/styles
mkdir -p src/types
mkdir -p supabase/{migrations,functions}
mkdir -p tests/{e2e,unit}

# Verify structure
tree -L 2 -d .
```

### Step 0.8: Create Environment Files

```bash
# Create .env.example (template)
cat > .env.example << 'EOF'
# Database - Supabase
NEXT_PUBLIC_SUPABASE_URL=https://supabase.nexcyte.com
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_KEY=your_service_key_here
DATABASE_URL=postgresql://user:pass@supabase.nexcyte.com:5432/postgres

# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate_with_openssl_rand_base64_32

# Payments - Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email - Resend
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@ezcycleramp.com

# SMS - Twilio (Optional)
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...

# AI - OpenAI
OPENAI_API_KEY=sk-proj-...
OPENAI_ORGANIZATION=org-...

# Automation - N8N
N8N_WEBHOOK_URL=https://n8n.ezcycleramp.com/webhook/
N8N_API_KEY=...

# Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-...

# Feature Flags
NEXT_PUBLIC_ENABLE_CHATBOT=true
NEXT_PUBLIC_ENABLE_WAITLIST=true
NEXT_PUBLIC_ENABLE_AI_SCHEDULING=true

# Environment
NODE_ENV=development
NEXT_PUBLIC_SITE_URL=http://localhost:3000
EOF

# Copy to .env.local and fill in actual values
cp .env.example .env.local

# IMPORTANT: Edit .env.local with your actual credentials!
# DO NOT commit .env.local to git!
```

### Step 0.9: Create Agent Specification Files

```bash
# Create placeholder files for all 12 agents
# (Full content will be provided in separate artifacts)

touch .claude/agents/{01-database,02-ui,03-ecommerce,04-ai,05-automation,06-testing,07-devops,08-documentation,09-security,10-notebooklm,11-customer-success,12-configurator}-agent.md

# Create coordination files
touch .claude/coordinator.md
touch .claude/project.md
touch .claude/tasks.md

# Create context files
touch .claude/context/{database-schema,api-routes,business-rules,component-library}.md
```

### Step 0.10: Initialize Supabase

```bash
# Initialize Supabase
npx supabase init

# Link to remote Supabase instance
npx supabase link --project-ref YOUR_PROJECT_REF

# Generate types from remote schema
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.ts
```

### Step 0.11: Configure package.json Scripts

```json
{
  "scripts": {
    "dev": "next dev --turbo",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "format": "prettier --write \"src/**/*.{js,jsx,ts,tsx,json,css,md}\"",
    "type-check": "tsc --noEmit",
    "test": "vitest",
    "test:unit": "vitest run",
    "test:e2e": "playwright test",
    "test:watch": "vitest watch",
    "db:push": "npx supabase db push",
    "db:pull": "npx supabase db pull",
    "db:migrate": "npx supabase migration up",
    "db:seed": "tsx scripts/seed.ts",
    "generate": "npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.ts",
    "clean": "rm -rf .next node_modules",
    "reset": "pnpm clean && pnpm install"
  }
}
```

### Step 0.12: Create GitHub Repository

```bash
# Create repository on GitHub (mocamGitHub/ezcr)
# Then connect local to remote

git remote add origin git@github.com:mocamGitHub/ezcr.git

# Initial push
git add .
git commit -m "feat: Initial project setup with Next.js 15, TypeScript, Tailwind, ShadCN"
git branch -M main
git push -u origin main
```

### Step 0.13: Verify Setup

```bash
# 1. Test development server
pnpm dev

# Open http://localhost:3000
# Should see Next.js welcome page

# 2. Test TypeScript
pnpm type-check
# Should show no errors

# 3. Test linting
pnpm lint
# Should pass

# 4. Test formatting
pnpm format
# Should format all files

# 5. Test Supabase connection
# Create a test file: src/lib/supabase/client.ts
# Try to connect and query

# If all tests pass, Week 0 is complete! ✅
```

---

## WEEK 1: FOUNDATION

**Goal**: Set up database schema, create core utilities, implement basic layout.

**Estimated Time**: 40 hours

### Day 1: Database Schema Design

#### Step 1.1: Create Initial Migration

```bash
# Create first migration
npx supabase migration new initial_schema

# This creates: supabase/migrations/TIMESTAMP_initial_schema.sql
```

#### Step 1.2: Write Database Schema

Copy the complete schema from the Knowledge Base document, sections for:
- tenants table
- product_categories table
- products table
- orders table
- order_items table
- shopping_cart table
- abandoned_carts table
- waitlist table
- product_configurations table
- testimonials table
- knowledge_base table
- chat_conversations table
- user_profiles table

```sql
-- supabase/migrations/TIMESTAMP_initial_schema.sql

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Create all tables (copy from Knowledge Base)
-- ...

-- Create RLS policies
-- ...

-- Create functions
-- ...

-- Create triggers
-- ...
```

#### Step 1.3: Apply Migration

```bash
# Push to Supabase
npx supabase db push

# Verify
npx supabase db diff

# Generate types
pnpm generate
```

#### Step 1.4: Seed Initial Data

```typescript
// scripts/seed.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

async function seed() {
  // 1. Create EZCR tenant
  const { data: tenant } = await supabase
    .from('tenants')
    .insert({
      id: '00000000-0000-0000-0000-000000000001',
      name: 'EZ Cycle Ramp',
      domain: 'ezcycleramp.com',
      slug: 'ezcr',
      settings: {
        brand_color: '#ff6b35',
        veteran_owned: true,
        bbb_rating: 'A+',
      },
    })
    .select()
    .single();

  console.log('✓ Tenant created:', tenant.name);

  // 2. Create product categories
  const { data: ramps } = await supabase
    .from('product_categories')
    .insert({
      tenant_id: tenant.id,
      name: 'Motorcycle Ramps',
      slug: 'ramps',
      description: 'Premium folding and standard motorcycle loading ramps',
    })
    .select()
    .single();

  const { data: accessories } = await supabase
    .from('product_categories')
    .insert({
      tenant_id: tenant.id,
      name: 'Accessories',
      slug: 'accessories',
      description: 'Tie-down straps, wheel chocks, and more',
    })
    .select()
    .single();

  console.log('✓ Categories created');

  // 3. Create products
  const products = [
    {
      tenant_id: tenant.id,
      category_id: ramps.id,
      name: 'AUN250 Folding Ramp',
      slug: 'aun250-folding-ramp',
      sku: 'AUN250',
      description: 'Premium folding motorcycle loading ramp...',
      price: 1299.00,
      weight_lbs: 45,
      is_featured: true,
      status: 'active',
      inventory_count: 25,
    },
    {
      tenant_id: tenant.id,
      category_id: ramps.id,
      name: 'AUN210 Standard Ramp',
      slug: 'aun210-standard-ramp',
      sku: 'AUN210',
      description: 'Standard motorcycle loading ramp...',
      price: 999.00,
      weight_lbs: 38,
      is_featured: true,
      status: 'active',
      inventory_count: 30,
    },
    {
      tenant_id: tenant.id,
      category_id: ramps.id,
      name: 'AUN200 Basic Ramp',
      slug: 'aun200-basic-ramp',
      sku: 'AUN200',
      description: 'Affordable basic ramp...',
      price: 799.00,
      weight_lbs: 32,
      status: 'active',
      inventory_count: 20,
    },
    {
      tenant_id: tenant.id,
      category_id: ramps.id,
      name: 'AUN150 Hybrid Ramp',
      slug: 'aun150-hybrid-ramp',
      sku: 'AUN150',
      description: 'Coming soon...',
      price: 899.00,
      status: 'coming_soon',
      coming_soon_date: '2025-03-01',
      inventory_count: 0,
    },
    {
      tenant_id: tenant.id,
      category_id: accessories.id,
      name: 'Tie-Down Straps (Set of 4)',
      slug: 'tie-down-straps',
      sku: 'TDS-001',
      price: 39.99,
      status: 'active',
      inventory_count: 100,
    },
    {
      tenant_id: tenant.id,
      category_id: accessories.id,
      name: 'Wheel Chock',
      slug: 'wheel-chock',
      sku: 'WC-001',
      price: 49.99,
      status: 'active',
      inventory_count: 75,
    },
  ];

  await supabase.from('products').insert(products);
  console.log('✓ Products created');

  console.log('\n✅ Seed complete!');
}

seed().catch(console.error);
```

```bash
# Run seed
pnpm db:seed
```

### Day 2-3: Core Utilities & Supabase Client

#### Step 1.5: Create Supabase Client

```typescript
// src/lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database';

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

```typescript
// src/lib/supabase/server.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options });
        },
      },
    }
  );
}
```

#### Step 1.6: Create Database Utilities

```typescript
// src/lib/db/queries.ts
import { createClient } from '@/lib/supabase/server';

export async function getProducts(tenantId: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('status', 'active')
    .order('display_order', { ascending: true });

  if (error) throw error;
  return data;
}

export async function getProductBySlug(tenantId: string, slug: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('slug', slug)
    .single();

  if (error) throw error;
  return data;
}

// Add more query functions as needed
```

### Day 4-5: Layout Components

#### Step 1.7: Create Header Component

```typescript
// src/components/layout/Header.tsx
import Link from 'next/link';
import { ShoppingCart, Search, Menu, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
      <div className="container flex h-16 items-center">
        {/* Logo */}
        <Link href="/" className="mr-8 flex items-center space-x-2">
          <span className="font-bold text-xl text-brand-black">EZ CYCLE</span>
          <span className="font-bold text-xl text-brand-orange">RAMP</span>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
          <Link href="/products/ramps" className="hover:text-brand-orange transition-colors">
            Ramps
          </Link>
          <Link href="/products/accessories" className="hover:text-brand-orange transition-colors">
            Accessories
          </Link>
          <Link href="/configure" className="hover:text-brand-orange transition-colors">
            Configurator
          </Link>
          <Link href="/about" className="hover:text-brand-orange transition-colors">
            About
          </Link>
          <Link href="/contact" className="hover:text-brand-orange transition-colors">
            Contact
          </Link>
        </nav>

        {/* Actions */}
        <div className="ml-auto flex items-center space-x-4">
          <Button variant="ghost" size="icon">
            <Search className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <User className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="relative">
            <ShoppingCart className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-brand-orange text-white text-xs flex items-center justify-center">
              0
            </span>
          </Button>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Trust Badges */}
      <div className="border-t bg-muted/50">
        <div className="container flex items-center justify-center py-2 space-x-8 text-xs">
          <div className="flex items-center space-x-2">
            <span>🇺🇸</span>
            <span className="font-medium">Veteran Owned</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>⭐</span>
            <span className="font-medium">BBB A+ Rating</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>🚚</span>
            <span className="font-medium">Free Shipping Over $500</span>
          </div>
        </div>
      </div>
    </header>
  );
}
```

#### Step 1.8: Create Footer Component

```typescript
// src/components/layout/Footer.tsx
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t bg-muted/50">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company */}
          <div>
            <h3 className="font-semibold text-lg mb-4">EZ Cycle Ramp</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Premium motorcycle loading ramps for pickups, vans, and trailers.
            </p>
            <p className="text-sm text-muted-foreground">
              📞 800-687-4410<br />
              📧 support@ezcycleramp.com
            </p>
          </div>

          {/* Products */}
          <div>
            <h3 className="font-semibold mb-4">Products</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/products/aun250" className="hover:text-brand-orange">AUN250 Folding</Link></li>
              <li><Link href="/products/aun210" className="hover:text-brand-orange">AUN210 Standard</Link></li>
              <li><Link href="/products/aun200" className="hover:text-brand-orange">AUN200 Basic</Link></li>
              <li><Link href="/products/accessories" className="hover:text-brand-orange">Accessories</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold mb-4">Support</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/installation" className="hover:text-brand-orange">Installation Guide</Link></li>
              <li><Link href="/faq" className="hover:text-brand-orange">FAQ</Link></li>
              <li><Link href="/warranty" className="hover:text-brand-orange">Warranty</Link></li>
              <li><Link href="/returns" className="hover:text-brand-orange">Returns</Link></li>
              <li><Link href="/contact" className="hover:text-brand-orange">Contact Us</Link></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="font-semibold mb-4">Newsletter</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Get updates on new products and special offers.
            </p>
            {/* Newsletter form (implement in Week 3) */}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>© 2025 NEO-DYNE, USA. All rights reserved.</p>
          <p className="mt-2">
            <Link href="/privacy" className="hover:text-brand-orange">Privacy Policy</Link>
            {' • '}
            <Link href="/terms" className="hover:text-brand-orange">Terms of Service</Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
```

#### Step 1.9: Update Root Layout

```typescript
// src/app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'EZ Cycle Ramp - Premium Motorcycle Loading Ramps',
  description: 'Premium folding and standard motorcycle loading ramps for pickups, vans, and trailers. Veteran owned, A+ BBB rating.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Header />
        <main className="min-h-[calc(100vh-4rem)]">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
```

#### Step 1.10: Create Basic Homepage

```typescript
// src/app/page.tsx
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-brand-black to-gray-800 text-white py-24">
        <div className="container">
          <div className="max-w-3xl">
            <h1 className="text-5xl font-bold mb-6">
              Ramp Up Your Loading Game
            </h1>
            <p className="text-xl mb-8 text-gray-300">
              Premium folding and standard motorcycle loading ramps. Made in USA.
              Veteran owned. A+ BBB rating.
            </p>
            <div className="flex space-x-4">
              <Button asChild size="lg" className="bg-brand-orange hover:bg-brand-orange/90">
                <Link href="/products/aun250">Shop AUN250</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="text-white border-white hover:bg-white/10">
                <Link href="/products/aun210">Shop AUN210</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl mb-4">💪</div>
              <h3 className="font-semibold text-lg mb-2">Durable</h3>
              <p className="text-muted-foreground">Built to last with premium materials</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">📏</div>
              <h3 className="font-semibold text-lg mb-2">Adjustable</h3>
              <p className="text-muted-foreground">Fits various truck bed heights</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">🔧</div>
              <h3 className="font-semibold text-lg mb-2">Easy Install</h3>
              <p className="text-muted-foreground">Simple setup in under an hour</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-brand-orange text-white py-16">
        <div className="container text-center">
          <h2 className="text-3xl font-bold mb-4">Not Sure Which Ramp is Right?</h2>
          <p className="text-lg mb-8">Use our configurator to find the perfect ramp for your setup.</p>
          <Button asChild size="lg" variant="outline" className="text-white border-white hover:bg-white/10">
            <Link href="/configure">Start Configurator</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
```

### Week 1 Wrap-Up

```bash
# Commit all work
git add .
git commit -m "feat: Complete Week 1 - Database schema, utilities, layout components"
git push

# Test everything
pnpm dev
# Visit http://localhost:3000
# Should see homepage with header/footer

# Update .claude/coordinator.md with progress

# Week 1 Complete! ✅
```

---

## WEEK 2: DATABASE & CORE COMPONENTS

**Goal**: Implement product display, create reusable components, set up database queries.

**Estimated Time**: 40 hours

### Day 1-2: Product Components

#### Step 2.1: Create Product Card

```typescript
// src/components/products/ProductCard.tsx
import Image from 'next/image';
import Link from 'link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart } from 'lucide-react';

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    compare_at_price?: number;
    images?: string[];
    status: string;
    inventory_count: number;
    is_featured: boolean;
  };
}

export function ProductCard({ product }: ProductCardProps) {
  const isOutOfStock = product.inventory_count <= 0;
  const isLowStock = product.inventory_count > 0 && product.inventory_count <= 5;
  const isComingSoon = product.status === 'coming_soon';

  return (
    <div className="group relative border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
      {/* Image */}
      <Link href={`/products/${product.slug}`}>
        <div className="aspect-square relative bg-muted">
          {product.images?.[0] ? (
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No Image
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-2 left-2 space-y-2">
            {product.is_featured && (
              <Badge variant="secondary">Featured</Badge>
            )}
            {isOutOfStock && (
              <Badge variant="destructive">Out of Stock</Badge>
            )}
            {isComingSoon && (
              <Badge variant="secondary">Coming Soon</Badge>
            )}
            {isLowStock && !isOutOfStock && (
              <Badge variant="warning">Only {product.inventory_count} Left!</Badge>
            )}
          </div>

          {/* Discount Badge */}
          {product.compare_at_price && product.compare_at_price > product.price && (
            <div className="absolute top-2 right-2">
              <Badge className="bg-brand-orange text-white">
                Save {Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)}%
              </Badge>
            </div>
          )}
        </div>
      </Link>

      {/* Content */}
      <div className="p-4">
        <Link href={`/products/${product.slug}`}>
          <h3 className="font-semibold text-lg mb-2 hover:text-brand-orange transition-colors">
            {product.name}
          </h3>
        </Link>

        {/* Price */}
        <div className="flex items-baseline space-x-2 mb-4">
          <span className="text-2xl font-bold">${product.price.toFixed(2)}</span>
          {product.compare_at_price && (
            <span className="text-muted-foreground line-through">
              ${product.compare_at_price.toFixed(2)}
            </span>
          )}
        </div>

        {/* Actions */}
        {!isOutOfStock && !isComingSoon && (
          <Button className="w-full bg-brand-orange hover:bg-brand-orange/90">
            <ShoppingCart className="mr-2 h-4 w-4" />
            Add to Cart
          </Button>
        )}
        {isOutOfStock && (
          <Button className="w-full" variant="outline" disabled>
            Out of Stock
          </Button>
        )}
        {isComingSoon && (
          <Button className="w-full" variant="outline">
            Notify Me
          </Button>
        )}
      </div>
    </div>
  );
}
```

#### Step 2.2: Create Product Grid

```typescript
// src/components/products/ProductGrid.tsx
import { ProductCard } from './ProductCard';

interface ProductGridProps {
  products: any[]; // Use proper type from database.ts
  title?: string;
}

export function ProductGrid({ products, title }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No products found.</p>
      </div>
    );
  }

  return (
    <div>
      {title && (
        <h2 className="text-3xl font-bold mb-8">{title}</h2>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
```

#### Step 2.3: Create Products Page

```typescript
// src/app/products/page.tsx
import { getProducts } from '@/lib/db/queries';
import { ProductGrid } from '@/components/products/ProductGrid';

export default async function ProductsPage() {
  const tenantId = '00000000-0000-0000-0000-000000000001'; // EZCR tenant
  const products = await getProducts(tenantId);

  return (
    <div className="container py-12">
      <h1 className="text-4xl font-bold mb-2">All Products</h1>
      <p className="text-muted-foreground mb-8">
        Premium motorcycle loading ramps and accessories
      </p>

      <ProductGrid products={products} />
    </div>
  );
}
```

#### Step 2.4: Create Product Detail Page

```typescript
// src/app/products/[slug]/page.tsx
import { getProductBySlug } from '@/lib/db/queries';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart } from 'lucide-react';
import Image from 'next/image';

interface ProductPageProps {
  params: { slug: string };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const tenantId = '00000000-0000-0000-0000-000000000001';
  const product = await getProductBySlug(tenantId, params.slug);

  if (!product) {
    notFound();
  }

  return (
    <div className="container py-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Images */}
        <div>
          <div className="aspect-square relative bg-muted rounded-lg overflow-hidden">
            {product.images?.[0] ? (
              <Image
                src={product.images[0]}
                alt={product.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No Image Available
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div>
          <div className="mb-4">
            {product.is_featured && <Badge className="mr-2">Featured</Badge>}
            <Badge variant="outline">SKU: {product.sku}</Badge>
          </div>

          <h1 className="text-4xl font-bold mb-4">{product.name}</h1>

          <div className="flex items-baseline space-x-4 mb-6">
            <span className="text-3xl font-bold">${product.price.toFixed(2)}</span>
            {product.compare_at_price && (
              <span className="text-xl text-muted-foreground line-through">
                ${product.compare_at_price.toFixed(2)}
              </span>
            )}
          </div>

          <div className="prose max-w-none mb-8">
            <p>{product.description}</p>
          </div>

          {/* Specifications */}
          {product.specifications && (
            <div className="mb-8">
              <h3 className="font-semibold text-lg mb-4">Specifications</h3>
              <dl className="grid grid-cols-2 gap-4">
                {Object.entries(product.specifications).map(([key, value]) => (
                  <div key={key}>
                    <dt className="text-sm text-muted-foreground">{key}</dt>
                    <dd className="font-medium">{String(value)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {/* Stock Status */}
          <div className="mb-6">
            {product.inventory_count > 5 && (
              <Badge variant="success">In Stock</Badge>
            )}
            {product.inventory_count > 0 && product.inventory_count <= 5 && (
              <Badge variant="warning">Only {product.inventory_count} Left!</Badge>
            )}
            {product.inventory_count <= 0 && product.status !== 'coming_soon' && (
              <Badge variant="destructive">Out of Stock</Badge>
            )}
            {product.status === 'coming_soon' && (
              <Badge variant="secondary">Coming Soon</Badge>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-4">
            {product.inventory_count > 0 && product.status === 'active' && (
              <>
                <Button size="lg" className="w-full bg-brand-orange hover:bg-brand-orange/90">
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  Add to Cart
                </Button>
                <Button size="lg" variant="outline" className="w-full">
                  Buy Now
                </Button>
              </>
            )}
            {product.inventory_count <= 0 && product.status === 'active' && (
              <Button size="lg" variant="outline" className="w-full">
                Join Waitlist
              </Button>
            )}
            {product.status === 'coming_soon' && (
              <Button size="lg" variant="outline" className="w-full">
                Notify Me When Available
              </Button>
            )}
          </div>

          {/* Trust Indicators */}
          <div className="mt-8 pt-8 border-t space-y-2 text-sm text-muted-foreground">
            <p>✓ Free shipping on orders over $500</p>
            <p>✓ 30-day money-back guarantee</p>
            <p>✓ Veteran owned & operated</p>
            <p>✓ A+ BBB rating</p>
          </div>
        </div>
      </div>
    </div>
  );
}
```

### Day 3-4: Additional Components

*Continue with creating filters, search, cart drawer, etc.*

### Day 5: Testing & Review

```bash
# Test all products pages
pnpm dev

# Navigate through:
# - /products (grid view)
# - /products/aun250-folding-ramp (detail view)
# - /products/aun210-standard-ramp (detail view)

# Verify:
# - Products display correctly
# - Images load (or placeholders show)
# - Prices format correctly
# - Badges show appropriate states
# - Buttons are clickable (though not functional yet)

# Commit work
git add .
git commit -m "feat: Complete Week 2 - Product display components"
git push

# Week 2 Complete! ✅
```

---

## WEEK 3: E-COMMERCE FEATURES

**Goal**: Implement shopping cart, checkout flow, Stripe integration.

**Estimated Time**: 40 hours

*[Continue with detailed week-by-week instructions...]*

---

## TROUBLESHOOTING GUIDE

### Common Issues & Solutions

#### Issue: Supabase Connection Fails

```bash
# Check environment variables
cat .env.local | grep SUPABASE

# Test connection
npx supabase status

# Regenerate types
pnpm generate
```

#### Issue: TypeScript Errors

```bash
# Check TypeScript configuration
cat tsconfig.json

# Run type check
pnpm type-check

# Clear cache and rebuild
rm -rf .next
pnpm build
```

#### Issue: Module Not Found

```bash
# Clear node_modules and reinstall
pnpm reset
pnpm install
```

#### Issue: Port Already in Use

```bash
# Kill process on port 3000 (Windows)
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Or use different port
pnpm dev -- -p 3001
```

---

**END OF STEP-BY-STEP INSTRUCTIONS (Part 1)**

This document continues with Weeks 4-8 in the same detailed format. Would you like me to continue with the remaining weeks?
