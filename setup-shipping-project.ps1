# ============================================
# EZ Cycle Ramp - T-Force Shipping Integration
# Project Setup Script (Windows PowerShell)
# ============================================
#
# Usage:
#   1. Open PowerShell
#   2. Navigate to where you want the project
#   3. Run: .\setup-shipping-project.ps1
#
# If you get an execution policy error, run:
#   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
#
# ============================================

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  EZ Cycle Ramp - Shipping Integration     " -ForegroundColor Cyan
Write-Host "  Project Setup Script (Windows)           " -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Ask for project location
$defaultPath = ".\ezcycleramp-shipping"
$projectDir = Read-Host "Enter project directory path (default: $defaultPath)"
if ([string]::IsNullOrWhiteSpace($projectDir)) {
    $projectDir = $defaultPath
}

Write-Host ""
Write-Host "Creating project structure at: $projectDir" -ForegroundColor Yellow
Write-Host ""

# Create directory structure
$directories = @(
    "$projectDir\docs",
    "$projectDir\supabase\migrations",
    "$projectDir\supabase\functions\get-shipping-quote",
    "$projectDir\supabase\functions\stripe-webhook",
    "$projectDir\supabase\functions\trigger-post-purchase-emails",
    "$projectDir\src\components\shipping",
    "$projectDir\src\hooks",
    "$projectDir\src\types",
    "$projectDir\n8n-workflows",
    "$projectDir\scripts"
)

foreach ($dir in $directories) {
    New-Item -ItemType Directory -Force -Path $dir | Out-Null
}

Write-Host "[OK] Directory structure created" -ForegroundColor Green

# Create docs README
$docsReadme = @"
# Documentation

Place these files here (download from Claude outputs):

1. **MASTER-PLANNING-DOCUMENT.md** - Complete project plan for Claude Code review
2. **CLAUDE-CODE-EXECUTION-GUIDE.md** - Step-by-step prompts for Claude Code
3. **TFORCE-SHIPPING-SETUP.md** - T-Force API setup guide
4. **PLATFORM-CHECKOUT-INTEGRATION.md** - Platform integration specification

## Quick Start

1. Download all .md files from Claude outputs to this folder
2. Open terminal in project root
3. Run: ``claude``
4. Say: ``Read ./docs/MASTER-PLANNING-DOCUMENT.md and review the project``
"@
Set-Content -Path "$projectDir\docs\README.md" -Value $docsReadme

# Create migrations README
$migrationsReadme = @"
# Database Migrations

Run these in Supabase SQL Editor in order:

1. **001_shipping_tables.sql** (from: database-migrations.sql)
2. **002_orders_table.sql** (from: database-orders-migration.sql)
3. **003_scheduled_emails.sql** (Claude Code will create)
4. **004_analytics_views.sql** (Claude Code will create)
5. **005_test_data.sql** (Claude Code will create)

## Files to Download

From Claude outputs, download and rename:
- ``database-migrations.sql`` -> ``001_shipping_tables.sql``
- ``database-orders-migration.sql`` -> ``002_orders_table.sql``
"@
Set-Content -Path "$projectDir\supabase\migrations\README.md" -Value $migrationsReadme

# Create placeholder Edge Function files
$edgeFnPlaceholder = "// Download the corresponding .ts file from Claude outputs`n// and replace this file with its contents"
Set-Content -Path "$projectDir\supabase\functions\get-shipping-quote\index.ts" -Value $edgeFnPlaceholder
Set-Content -Path "$projectDir\supabase\functions\stripe-webhook\index.ts" -Value $edgeFnPlaceholder
Set-Content -Path "$projectDir\supabase\functions\trigger-post-purchase-emails\index.ts" -Value $edgeFnPlaceholder

# Create components README
$componentsReadme = @"
# Shipping Components

Place these files here (download from Claude outputs):

1. **ConfiguratorShippingStep.tsx** (from: configurator-shipping-step.tsx)
2. **CheckoutShippingSection.tsx** (from: checkout-shipping-section.tsx)
3. **AnalyticsDashboard.tsx** (Claude Code will create)
"@
Set-Content -Path "$projectDir\src\components\shipping\README.md" -Value $componentsReadme

# Create hooks README
$hooksReadme = @"
# Hooks

Place this file here (download from Claude outputs):

1. **useShippingQuote.ts** (from: use-shipping-quote.ts)
"@
Set-Content -Path "$projectDir\src\hooks\README.md" -Value $hooksReadme

# Create types file
$typesFile = @"
// Shared TypeScript types for shipping integration

export interface ShippingQuote {
  quoteId: string;
  baseRate: number;
  residentialSurcharge: number;
  totalRate: number;
  destinationTerminal?: {
    code: string;
    name: string;
  };
  transitDays?: number;
  validUntil: string;
}

export interface ShippingAddress {
  streetAddress: string;
  apartment?: string;
  city: string;
  state: string;
  zipCode: string;
  isResidential: boolean;
}

export type DeliveryMethod = 'shipping' | 'pickup';

export type ProductSku = 'AUN200' | 'AUN250';

export interface Product {
  sku: ProductSku;
  name: string;
  price: number;
  weight: number;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  freightClass: string;
}

export const PRODUCTS: Record<ProductSku, Product> = {
  AUN200: {
    sku: 'AUN200',
    name: 'EZ Cycle Ramp AUN 200',
    price: 2495,
    weight: 300,
    dimensions: { length: 96, width: 48, height: 12 },
    freightClass: '125',
  },
  AUN250: {
    sku: 'AUN250',
    name: 'EZ Cycle Ramp AUN 250',
    price: 2795,
    weight: 350,
    dimensions: { length: 84, width: 48, height: 14 },
    freightClass: '125',
  },
};

export const PICKUP_LOCATION = {
  name: 'EZ Cycle Ramp Warehouse',
  address: '2500 Continental Blvd',
  city: 'Woodstock',
  state: 'GA',
  zip: '30188',
  hours: 'Mon-Fri 8am-5pm',
  phone: '(937) 725-6790',
};

export const RESIDENTIAL_SURCHARGE = 150;
"@
Set-Content -Path "$projectDir\src\types\shipping.ts" -Value $typesFile

# Create n8n README
$n8nReadme = @"
# n8n Workflows

Optional alternative to Edge Functions.

Place this file here (download from Claude outputs):

1. **shipping-quote-workflow.json** (from: n8n-workflow-shipping-quote.json)

Import into n8n via: Settings -> Import Workflow
"@
Set-Content -Path "$projectDir\n8n-workflows\README.md" -Value $n8nReadme

# Create .env.example
$envExample = @"
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxx

# T-Force Freight (for Edge Functions)
TFORCE_CLIENT_ID=your_oauth_client_id
TFORCE_CLIENT_SECRET=your_oauth_client_secret
TFORCE_ACCOUNT_NUMBER=your_account_number

# Stripe
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx

# SendGrid
SENDGRID_API_KEY=SG.xxx
SENDGRID_TEMPLATE_ORDER_CONFIRMATION=d-xxx
SENDGRID_TEMPLATE_SHIPPING=d-xxx
SENDGRID_TEMPLATE_DELIVERED=d-xxx
SENDGRID_TEMPLATE_PICKUP_READY=d-xxx
SENDGRID_TEMPLATE_REVIEW_REQUEST=d-xxx
SENDGRID_TEMPLATE_INSTALLATION=d-xxx

# Twilio
TWILIO_ACCOUNT_SID=ACxxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_FROM_NUMBER=+1234567890

# Support
SUPPORT_PHONE=+19377256790
SUPPORT_EMAIL=support@ezcycleramp.com

# Optional
SLACK_WEBHOOK_URL=https://hooks.slack.com/xxx
N8N_ORDER_WEBHOOK_URL=https://n8n.example.com/webhook/order
"@
Set-Content -Path "$projectDir\.env.example" -Value $envExample

# Create Claude Code starter prompt
$claudeStart = @"
# Claude Code Starter Prompt

Copy and paste this into Claude Code to begin:

---

I'm implementing the T-Force Freight shipping integration for EZ Cycle Ramp (motorcycle loading ramps e-commerce).

Please read the planning document at ./docs/MASTER-PLANNING-DOCUMENT.md

**Project Context:**
- Multi-tenant platform (NexCyte), EZ Cycle Ramp is tenant
- Products: AUN200 (`$2,495) and AUN250 (`$2,795)
- LTL freight via T-Force Freight from Woodstock, GA 30188
- Stack: Supabase + React/Next.js + Stripe + SendGrid + Twilio

**Files Already Created (in this project):**
- ./supabase/migrations/001_shipping_tables.sql
- ./supabase/migrations/002_orders_table.sql
- ./supabase/functions/get-shipping-quote/index.ts
- ./supabase/functions/stripe-webhook/index.ts
- ./supabase/functions/trigger-post-purchase-emails/index.ts
- ./src/components/shipping/ (React components)
- ./src/hooks/useShippingQuote.ts
- ./src/types/shipping.ts

**Files Needed (please create):**
1. ./supabase/migrations/003_scheduled_emails.sql
2. ./supabase/migrations/004_analytics_views.sql
3. ./supabase/migrations/005_test_data.sql
4. ./src/components/shipping/AnalyticsDashboard.tsx (optional)

After reviewing the planning document, confirm your understanding and we'll create each file.

---
"@
Set-Content -Path "$projectDir\CLAUDE-CODE-START.md" -Value $claudeStart

# Create download checklist
$downloadChecklist = @"
# File Download Checklist

Download these files from Claude outputs and place in the correct locations:

## Documentation (-> .\docs\)
- [ ] MASTER-PLANNING-DOCUMENT.md
- [ ] CLAUDE-CODE-EXECUTION-GUIDE.md
- [ ] TFORCE-SHIPPING-SETUP.md
- [ ] PLATFORM-CHECKOUT-INTEGRATION.md

## Database Migrations (-> .\supabase\migrations\)
- [ ] database-migrations.sql -> rename to 001_shipping_tables.sql
- [ ] database-orders-migration.sql -> rename to 002_orders_table.sql

## Edge Functions
- [ ] supabase-get-shipping-quote.ts -> .\supabase\functions\get-shipping-quote\index.ts
- [ ] supabase-stripe-webhook.ts -> .\supabase\functions\stripe-webhook\index.ts
- [ ] supabase-post-purchase-emails.ts -> .\supabase\functions\trigger-post-purchase-emails\index.ts

## React Components (-> .\src\components\shipping\)
- [ ] configurator-shipping-step.tsx -> ConfiguratorShippingStep.tsx
- [ ] checkout-shipping-section.tsx -> CheckoutShippingSection.tsx

## Hooks (-> .\src\hooks\)
- [ ] use-shipping-quote.ts -> useShippingQuote.ts

## n8n (-> .\n8n-workflows\)
- [ ] n8n-workflow-shipping-quote.json -> shipping-quote-workflow.json

---

After downloading all files, run Claude Code:

``````powershell
cd $projectDir
claude
``````

Then paste the contents of CLAUDE-CODE-START.md
"@
Set-Content -Path "$projectDir\DOWNLOAD-CHECKLIST.md" -Value $downloadChecklist

# Create .gitignore
$gitignore = @"
# Dependencies
node_modules/

# Environment
.env
.env.local
.env.*.local

# Build
.next/
dist/
build/

# Supabase
.supabase/

# IDE
.idea/
.vscode/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*

# Test data (do not commit to prod)
supabase/migrations/005_test_data.sql
"@
Set-Content -Path "$projectDir\.gitignore" -Value $gitignore

Write-Host "[OK] Template files created" -ForegroundColor Green
Write-Host ""

# Print summary
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Setup Complete!                          " -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Project created at: $projectDir" -ForegroundColor Green
Write-Host ""
Write-Host "Directory structure:"
Get-ChildItem -Path $projectDir -Recurse -File | Select-Object -First 15 | ForEach-Object { Write-Host "  $($_.FullName.Replace((Get-Location).Path + '\', ''))" }
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  1. Download files from Claude outputs"
Write-Host "     See: $projectDir\DOWNLOAD-CHECKLIST.md"
Write-Host ""
Write-Host "  2. Place files in correct locations"
Write-Host "     (follow the checklist)"
Write-Host ""
Write-Host "  3. Copy .env.example to .env and fill in values"
Write-Host "     Copy-Item $projectDir\.env.example $projectDir\.env"
Write-Host ""
Write-Host "  4. Start Claude Code"
Write-Host "     cd $projectDir"
Write-Host "     claude"
Write-Host ""
Write-Host "  5. Paste the starter prompt"
Write-Host "     See: $projectDir\CLAUDE-CODE-START.md"
Write-Host ""
Write-Host "Good luck with your shipping integration!" -ForegroundColor Green
Write-Host ""
