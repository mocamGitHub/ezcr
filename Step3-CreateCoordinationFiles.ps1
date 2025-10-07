# EZCR Step 3: Create Coordination Files
# Phase 3: SOLUTIONS
# Encoding: UTF-8

$ErrorActionPreference = "Stop"

function Log($msg) { Write-Host "[INFO] $msg" -ForegroundColor Cyan }
function Success($msg) { Write-Host "[SUCCESS] $msg" -ForegroundColor Green }

function New-UTF8File {
    param([string]$Path, [string]$Content)
    $utf8 = New-Object System.Text.UTF8Encoding $false
    [System.IO.File]::WriteAllText($Path, $Content, $utf8)
}

Log "Step 3: Creating Coordination Files"
Write-Host "=============================================="
Write-Host ""

$PROJECT_ROOT = "C:\Users\morri\Dropbox\Websites\ezcr"
Set-Location $PROJECT_ROOT

# Coordinator.md - Daily task tracking
$coordinator = @'
# EZCR Project Coordinator

**Last Updated**: [Current Date]  
**Project Phase**: Foundation & Setup  
**Current Week**: Week 0/8

---

## 🎯 Today's Focus

### Active Tasks
- [ ] Complete environment setup
- [ ] Verify Supabase connection
- [ ] Initialize Next.js project structure
- [ ] Create first database migration

### Blockers
*No blockers currently*

### Notes
*Initial project setup phase*

---

## 📊 Weekly Progress Tracker

### Week 0: Environment Setup (Current)
- [x] Create project directory structure
- [x] Install dependencies
- [x] Configure development environment
- [ ] Set up Supabase connection
- [ ] Create initial database schema

### Week 1: Foundation
- [ ] Database schema complete
- [ ] Core utilities implemented
- [ ] Layout components created
- [ ] Basic homepage built

### Week 2: Database & Core Components
- [ ] Product display components
- [ ] Database queries implemented
- [ ] Responsive design verified

### Week 3: E-Commerce Features
- [ ] Shopping cart implemented
- [ ] Checkout flow complete
- [ ] Stripe integration working

### Week 4: Product Configurator
- [ ] 5-step configurator built
- [ ] Validation logic complete
- [ ] Quote generation working

### Week 5: AI & Automation
- [ ] RAG chatbot functional
- [ ] N8N workflows deployed
- [ ] Email automation working

### Week 6: Advanced Features
- [ ] Waitlist system complete
- [ ] Analytics integrated
- [ ] Performance optimized

### Week 7: Testing & Integration
- [ ] E2E tests passing
- [ ] Unit tests >80% coverage
- [ ] Integration tests complete

### Week 8: Launch Preparation
- [ ] Production deployment
- [ ] DNS configuration
- [ ] Monitoring active

---

## 🤝 Agent Collaboration Log

### Recent Interactions
*No interactions yet - project initialization*

### Pending Handoffs
1. Database Agent → UI Agent: Schema types for components
2. Database Agent → E-Commerce Agent: Cart queries
3. UI Agent → Configurator Agent: Step component templates

---

## 📝 Daily Standup Notes

### [Date]
**Completed Yesterday:**
- Project setup initiated
- Documentation structure created

**Today's Plan:**
- Complete environment verification
- Set up Supabase connection
- Create first migration

**Blockers:**
- None

---

## 🔄 Context Preservation

### Last Session Summary
Project initialization complete. All agent files created. Ready to begin Week 0 implementation.

### Key Decisions Made
1. Using Next.js 15 with App Router
2. ShadCN UI for component library
3. Supabase for database
4. Multi-tenant architecture from day 1

### Open Questions
- [ ] Finalize product image storage strategy
- [ ] Confirm N8N hosting approach
- [ ] Determine staging environment URL

---

## 📚 Quick Links

- [Master Knowledge Base](./EZCR%20Complete%20Knowledge%20Base%20-%20Master%20Document.md)
- [Step-by-Step Instructions](./EZCR%20-%20Complete%20Step-by-Step%20Project%20Instructions.md)
- [Agent Specifications](./EZCR%20-%20Complete%20Agent%20Specification%20Files.md)

---

**Update this file daily to maintain context across sessions.**
'@

New-UTF8File ".claude\coordinator.md" $coordinator
Success "Created: coordinator.md"

# Project.md - High-level overview
$project = @'
# EZCR Project Overview

**Version**: 1.0  
**Start Date**: October 7, 2025  
**Estimated Completion**: 8 weeks  
**Status**: 🟡 In Progress - Week 0

---

## 🎯 Project Mission

Rebuild ezcycleramp.com as a modern, multi-tenant e-commerce platform using Next.js 15, increasing conversion rates by 25%+ through enhanced UX and automation.

---

## 🏗️ Architecture

### Technology Stack
- **Frontend**: Next.js 15, React 18, TypeScript, Tailwind CSS, ShadCN UI
- **Backend**: Next.js API Routes, Supabase (PostgreSQL + pgvector)
- **Payments**: Stripe
- **Email**: Resend
- **Automation**: N8N
- **AI**: OpenAI (GPT-4 + Ada-002)
- **Hosting**: Hetzner VPS with Coolify

### Infrastructure
```
Hetzner VPS (5.161.84.153)
├── Coolify (coolify31.com)
├── Supabase (supabase.nexcyte.com)
└── N8N (to be configured)
```

---

## 👥 Agent Team Structure

### 12 Specialized Agents

1. **Database Agent** - Schema, migrations, RLS policies
2. **UI/Component Agent** - React components, design system
3. **E-Commerce Agent** - Cart, checkout, payments
4. **AI/RAG Agent** - Chatbot, semantic search
5. **Automation Agent** - N8N workflows, emails
6. **Testing Agent** - E2E, unit, integration tests
7. **DevOps Agent** - Deployment, CI/CD
8. **Documentation Agent** - All docs maintenance
9. **Security Agent** - Security audits, compliance
10. **NotebookLM Agent** - Knowledge management
11. **Customer Success Agent** - User guides, support
12. **Configurator Agent** - 5-step product configurator

---

## 🎨 Brand Identity (EZCR Tenant)

### Colors
- **Primary**: #1a1a1a (Black)
- **Accent**: #ff6b35 (Orange)
- **Secondary**: #c0c0c0 (Silver)

### Typography
- **Font**: Inter
- **Base Size**: 16px (elderly-friendly)
- **Line Height**: 1.625

### Key Features
- Veteran-owned business
- A+ BBB rating
- Free shipping over $500
- 30-day money-back guarantee

---

## 📋 Feature Checklist

### Core E-Commerce ✅
- [ ] Product catalog with categories
- [ ] Shopping cart with persistence
- [ ] Checkout flow
- [ ] Stripe payment integration
- [ ] Order management
- [ ] Email confirmations

### Interactive Tools 🔧
- [ ] Vehicle compatibility checker
- [ ] ROI/savings calculator
- [ ] Price calculator with add-ons
- [ ] Financing calculator
- [ ] 5-step product configurator

### Conversion Optimization 📈
- [ ] Exit-intent popup
- [ ] Live chat widget (AI-powered)
- [ ] Enhanced testimonials
- [ ] Newsletter signup
- [ ] FAQ system

### Advanced Features 🚀
- [ ] RAG chatbot
- [ ] Semantic product search
- [ ] Waitlist/preorder system
- [ ] Abandoned cart recovery
- [ ] AI delivery scheduling
- [ ] Review request automation

### Multi-Tenant Support 🏢
- [ ] Tenant isolation (RLS)
- [ ] Per-tenant branding
- [ ] Domain routing
- [ ] Settings management

---

## 📊 Success Metrics

### Technical Targets
- Page load: <3 seconds
- Mobile score: >95
- Uptime: >99.9%
- Test coverage: >80%

### Business Targets
- Conversion rate: +25% improvement
- Lead generation: +50% increase
- Session duration: >3 minutes
- Order completion: >80%

---

## 🗓️ 8-Week Timeline

| Week | Focus | Key Deliverables |
|------|-------|------------------|
| 0 | Setup | Environment, dependencies, structure |
| 1 | Foundation | Database, layout, basic pages |
| 2 | Components | Product display, navigation |
| 3 | E-Commerce | Cart, checkout, Stripe |
| 4 | Configurator | 5-step product configurator |
| 5 | AI & Automation | Chatbot, N8N workflows |
| 6 | Advanced | Waitlist, analytics, optimization |
| 7 | Testing | E2E, unit, integration tests |
| 8 | Launch | Deployment, DNS, monitoring |

---

## 🔗 Important Links

### Documentation
- Master Knowledge Base
- Step-by-Step Instructions
- Agent Specifications

### Infrastructure
- Coolify: https://coolify31.com
- Supabase: https://supabase.nexcyte.com
- GitHub: github.com/mocamGitHub/ezcr

### Production
- Current Site: ezcycleramp.com (PHP - to be replaced)
- New Site: new.ezcycleramp.com (staging)

---

**This document provides the 30,000-foot view of the EZCR project.**
'@

New-UTF8File ".claude\project.md" $project
Success "Created: project.md"

# Tasks.md - Agent-specific task assignments
$tasks = @'
# EZCR Task Assignments

**Last Updated**: [Current Date]  
**Current Sprint**: Week 0 - Setup

---

## 🎯 Current Sprint Tasks

### Week 0: Environment Setup & Foundation

#### Database Agent 🗄️
- [x] Design multi-tenant schema
- [ ] Create initial migration
- [ ] Set up RLS policies
- [ ] Generate TypeScript types
- [ ] Seed test data

**Priority**: 🔴 Critical  
**Estimated Time**: 8 hours  
**Dependencies**: None

---

#### UI/Component Agent 🎨
- [ ] Configure Tailwind with brand colors
- [ ] Install ShadCN UI components
- [ ] Create Header component
- [ ] Create Footer component
- [ ] Set up responsive layout

**Priority**: 🟡 High  
**Estimated Time**: 6 hours  
**Dependencies**: Database types

---

#### E-Commerce Agent 💰
- [ ] Set up Zustand store for cart
- [ ] Design cart state structure
- [ ] Implement cart persistence
- [ ] Configure Stripe keys
- [ ] Create checkout API routes

**Priority**: 🟡 High  
**Estimated Time**: 8 hours  
**Dependencies**: Database schema, UI components

---

#### AI/RAG Agent 🤖
- [ ] Set up OpenAI client
- [ ] Create embedding generation function
- [ ] Design knowledge base schema
- [ ] Implement semantic search
- [ ] Create chatbot API route

**Priority**: 🟢 Medium  
**Estimated Time**: 10 hours  
**Dependencies**: Database pgvector setup

---

#### Automation Agent ⚙️
- [ ] Set up N8N instance
- [ ] Configure Resend API
- [ ] Create email templates
- [ ] Design order confirmation workflow
- [ ] Implement abandoned cart workflow

**Priority**: 🟢 Medium  
**Estimated Time**: 12 hours  
**Dependencies**: Order system complete

---

#### Testing Agent 🧪
- [ ] Configure Playwright
- [ ] Configure Vitest
- [ ] Create test utils
- [ ] Write first E2E test
- [ ] Set up CI/CD test pipeline

**Priority**: 🟢 Medium  
**Estimated Time**: 6 hours  
**Dependencies**: Basic app structure

---

#### DevOps Agent 🚀
- [ ] Configure Coolify project
- [ ] Set up environment variables
- [ ] Create Docker configuration
- [ ] Configure GitHub Actions
- [ ] Set up staging environment

**Priority**: 🔴 Critical  
**Estimated Time**: 8 hours  
**Dependencies**: None

---

#### Documentation Agent 📚
- [x] Create agent specification files
- [x] Create coordination files
- [ ] Write API documentation
- [ ] Create developer onboarding guide
- [ ] Set up changelog

**Priority**: 🟡 High  
**Estimated Time**: 4 hours  
**Dependencies**: None

---

#### Security Agent 🔒
- [ ] Configure security headers
- [ ] Set up rate limiting
- [ ] Create input validation schemas
- [ ] Implement CSRF protection
- [ ] Audit RLS policies

**Priority**: 🔴 Critical  
**Estimated Time**: 6 hours  
**Dependencies**: API routes created

---

#### NotebookLM Agent 📖
- [ ] Consolidate documentation
- [ ] Upload to NotebookLM
- [ ] Generate first audio summary
- [ ] Create searchable index
- [ ] Schedule weekly updates

**Priority**: 🔵 Low  
**Estimated Time**: 2 hours  
**Dependencies**: Documentation complete

---

#### Customer Success Agent 👥
- [ ] Write installation guide
- [ ] Create FAQ content
- [ ] Design support templates
- [ ] Create troubleshooting guide
- [ ] Prepare training materials

**Priority**: 🟢 Medium  
**Estimated Time**: 8 hours  
**Dependencies**: Product knowledge

---

#### Configurator Agent 🔧
- [ ] Design 5-step flow
- [ ] Create measurement validation
- [ ] Implement extension selection logic
- [ ] Build quote generation
- [ ] Create configurator UI

**Priority**: 🟡 High  
**Estimated Time**: 16 hours  
**Dependencies**: UI components, database

---

## 📝 Backlog

### Future Enhancements
- Advanced analytics dashboard
- Multi-language support
- Wholesale customer portal
- Inventory management system
- Dealer network platform

---

## ✅ Completed Tasks

### Week 0
- [x] Project structure created
- [x] Documentation files generated
- [x] Agent specifications written
- [x] Coordination system established

---

## 🚫 Blocked Tasks

*No blocked tasks currently*

---

**Update this file as tasks are completed or priorities change.**
'@

New-UTF8File ".claude\tasks.md" $tasks
Success "Created: tasks.md"

Write-Host ""
Success "Step 3 Complete! All coordination files created."
Write-Host ""
Write-Host "Next: Run Step4-CreateContextFiles.ps1"
