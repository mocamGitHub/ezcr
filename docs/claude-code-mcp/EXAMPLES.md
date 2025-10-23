# MCP Practical Examples for EZ Cycle Ramp

**Real-world examples combining Supabase and GitHub MCPs to supercharge your development workflow**

---

## 🎯 Overview

This guide shows practical examples of using MCPs together to:
- Analyze product performance
- Track customer behavior
- Automate issue creation from data insights
- Generate reports
- Monitor application health

---

## 📊 Example 1: Product Performance Analysis

### Scenario
You want to identify which products need attention based on sales data.

### Using Supabase MCP

```
You: "Show me products with zero orders in the last 30 days"

Claude: [Queries database]

Results:
- Standard Folding Ramp (SKU: RAMP-003)
- Premium Telescoping Ramp (SKU: RAMP-007)
```

### Using GitHub MCP

```
You: "Create issue: Low sales for RAMP-003 and RAMP-007, add label 'analysis-needed'"

Claude: ✓ Created issue #54: "Low sales for RAMP-003 and RAMP-007"
       Added labels: analysis-needed, product
```

### Result
Data insight → Actionable issue in seconds!

---

## 📈 Example 2: Customer Retention Report

### Scenario
Identify customers at risk of churning.

### Step 1: Query Database

```
You: "Show me customers who haven't placed an order in 60 days but were previously active"

Claude: [Analyzes orders and users tables]

Results:
- john@example.com - Last order: 65 days ago
- sarah@example.com - Last order: 72 days ago
- mike@example.com - Last order: 81 days ago
```

### Step 2: Create Action Items

```
You: "Create issue: Re-engagement campaign for inactive customers, assign to @marketing"

Claude: ✓ Created issue #55
       ✓ Assigned to @marketing
       ✓ Added label: marketing
```

### Step 3: Add Details

```
You: "Add comment to issue #55 with the list of inactive customers"

Claude: ✓ Comment added with customer details
```

---

## 🛒 Example 3: Abandoned Cart Analysis

### Scenario
Find out why customers abandon their configurations.

### Query Abandoned Configurations

```
You: "How many ramp configurations were created but never resulted in an order?"

Claude: [Queries configurations and orders tables]

Result: 147 configurations without corresponding orders
```

### Analyze Patterns

```
You: "What are the most common configuration lengths for abandoned carts?"

Claude: [Groups configurations by length]

Results:
- 96 inches: 42 abandoned
- 120 inches: 38 abandoned
- 84 inches: 31 abandoned
```

### Create Product Issue

```
You: "Create issue: High abandonment rate for extra-long ramps (96+ inches), add label 'product-insight'"

Claude: ✓ Created issue #56
```

---

## 💰 Example 4: Revenue Analysis & Reporting

### Scenario
Generate monthly revenue report and share with team.

### Step 1: Get Revenue Data

```
You: "What was the total revenue for October 2025?"

Claude: [Queries orders table]

Result: $45,287.50
```

### Step 2: Compare to Previous Month

```
You: "What was the revenue for September 2025?"

Claude: Result: $38,942.00
```

### Step 3: Calculate Growth

```
You: "Calculate the percentage increase"

Claude: Revenue increased by 16.3% ($6,345.50)
```

### Step 4: Document Findings

```
You: "Create issue titled 'October 2025 Revenue Report' with this data"

Claude: ✓ Created issue #57 with revenue analysis
```

---

## 🐛 Example 5: Error Monitoring to Issue Creation

### Scenario
Database shows spike in failed orders - automatically create tracking issue.

### Step 1: Check Failed Orders

```
You: "How many orders have status 'failed' in the last 24 hours?"

Claude: [Queries orders table]

Result: 12 failed orders (unusual spike)
```

### Step 2: Analyze Failure Reasons

```
You: "Show me the failure reasons for these orders"

Claude: [Queries order details]

Results:
- Payment gateway timeout: 8 orders
- Inventory unavailable: 3 orders
- Address validation failed: 1 order
```

### Step 3: Create Bug Report

```
You: "Create issue: Payment gateway timeouts causing order failures, add labels 'bug' and 'high-priority'"

Claude: ✓ Created issue #58
       ✓ Added labels: bug, high-priority
       ✓ Description includes failure analysis
```

---

## 📊 Example 6: Customer Lifetime Value Analysis

### Scenario
Identify your most valuable customers for VIP program.

### Query High-Value Customers

```
You: "Show me customers with total order value > $2000"

Claude: [Aggregates orders by customer]

Results:
- customer_001: $3,247.50 (7 orders)
- customer_042: $2,895.00 (5 orders)
- customer_138: $2,456.00 (4 orders)
```

### Track VIP Customers

```
You: "Create issue: VIP customer program setup, add these high-value customers to description"

Claude: ✓ Created issue #59 with customer list
```

---

## 🔍 Example 7: Product Configuration Trends

### Scenario
Understand what customers are looking for.

### Analyze Configuration Data

```
You: "What's the average ramp angle being configured?"

Claude: [Queries configurations table]

Result: Average angle: 17.3 degrees
```

```
You: "What's the most common ramp length?"

Claude: Result: 72 inches (6 feet) - 34% of configurations
```

```
You: "Show me the distribution of ramp widths"

Claude: [Groups by width]

Results:
- 30 inches: 45%
- 36 inches: 32%
- 48 inches: 23%
```

### Create Product Development Issue

```
You: "Create issue: Consider offering more 72-inch x 30-inch ramp variations, add label 'product-development'"

Claude: ✓ Created issue #60 with trend data
```

---

## 🚀 Example 8: Feature Request from User Data

### Scenario
Database shows pattern suggesting need for new feature.

### Identify Pattern

```
You: "How many users have saved more than 3 different configurations?"

Claude: [Queries configurations table]

Result: 89 users have 3+ saved configurations
```

### User Behavior Insight

```
You: "Show me users with the most saved configurations"

Claude: Top users:
- user_245: 12 configurations
- user_789: 9 configurations
- user_456: 8 configurations
```

### Create Feature Request

```
You: "Create issue: Add configuration comparison feature - 89 users have multiple saved configs, add label 'feature-request'"

Claude: ✓ Created issue #61
       ✓ Includes data justification
       ✓ Tagged: feature-request, enhancement
```

---

## 📅 Example 9: Sprint Planning with Data

### Scenario
Plan next sprint based on actual usage data.

### Get Feature Usage Stats

```
You: "How many users have used the AI configurator chat vs manual configurator?"

Claude: [Queries configurations and activity logs]

Results:
- AI Chat: 342 users
- Manual: 1,247 users
- Both: 89 users
```

### Identify Pain Points

```
You: "Show me configurations that were started but never completed"

Claude: Result: 234 incomplete configurations
```

### Create Sprint Issues

```
You: "Create issue: Improve AI configurator adoption (only 21% usage), add to milestone 'Sprint 12'"

Claude: ✓ Created issue #62
       ✓ Added to Sprint 12 milestone

You: "Create issue: Reduce configuration abandonment rate, add to milestone 'Sprint 12'"

Claude: ✓ Created issue #63
       ✓ Added to Sprint 12 milestone
```

---

## 🎯 Example 10: CRM Integration Workflow

### Scenario
Sync CRM data with development priorities.

### Find High-Activity Customers

```
You: "Show me CRM customers with more than 5 activities this month"

Claude: [Queries crm_activities table]

Results:
- Acme Logistics: 12 activities
- ProRide Transport: 8 activities
- Swift Delivery: 7 activities
```

### Check Order History

```
You: "Show order history for Acme Logistics"

Claude: [Joins CRM and orders data]

Results: 3 orders, $8,450 total value
```

### Create Business Development Issue

```
You: "Create issue: Follow up with Acme Logistics for volume discount program, assign to @sales"

Claude: ✓ Created issue #64
       ✓ Assigned to @sales
       ✓ Included activity and order summary
```

---

## 🔄 Example 11: Automated Weekly Report

### Scenario
Every Monday, generate a weekly summary.

### Week in Review

```
You: "Generate a summary for the past 7 days including:
- Total orders
- Total revenue
- New user signups
- Top selling product"

Claude: Week of Oct 15-21, 2025:
- Orders: 87
- Revenue: $13,245.50
- New users: 34
- Top product: Standard Aluminum Ramp (23 sales)
```

### Create Weekly Summary Issue

```
You: "Create issue titled 'Week 42 Summary - Oct 15-21' with this data, add label 'weekly-report'"

Claude: ✓ Created issue #65
       ✓ Added formatted weekly summary
       ✓ Tagged: weekly-report
```

---

## 🚨 Example 12: Inventory Alert System

### Scenario
Low inventory detection and automated alerts.

### Check Inventory Levels

```
You: "Show me products with inventory < 10 units"

Claude: [Queries products/inventory table]

Results:
- Premium Carbon Fiber Ramp: 7 units
- Custom Extended Ramp: 4 units
```

### Create Restocking Issue

```
You: "Create issue: Restock low inventory items (Premium Carbon Fiber: 7, Custom Extended: 4), add label 'inventory' and 'urgent'"

Claude: ✓ Created issue #66
       ✓ Labels: inventory, urgent
       ✓ Assigned to @operations
```

---

## 🎨 Example 13: A/B Test Results Analysis

### Scenario
Analyze results of configurator UI test.

### Query Test Data

```
You: "How many users completed configurations with UI version A vs version B this week?"

Claude: [Queries configuration events]

Results:
- Version A: 156 completions (23% conversion)
- Version B: 189 completions (31% conversion)
```

### Document Findings

```
You: "Create issue: UI Version B shows 35% better conversion rate, recommend full rollout, add label 'ab-test-results'"

Claude: ✓ Created issue #67 with test results
```

---

## 💡 Example 14: Customer Support Insights

### Scenario
Identify common customer issues from database patterns.

### Analyze Support Patterns

```
You: "Show me the most common configuration changes (users who edited after initial save)"

Claude: [Queries configuration edit history]

Results:
- Angle adjustments: 67% of edits
- Width changes: 42% of edits
- Length changes: 28% of edits
```

### Create UX Improvement Issue

```
You: "Create issue: Add angle calculator helper - 67% of users adjust angle after initial config, add label 'ux-improvement'"

Claude: ✓ Created issue #68
       ✓ Includes usage data justification
```

---

## 🌟 Best Practices

### 1. Start with Data

Always query the database first to get facts:
```
✓ "Show me the data for..."
✗ "I think we should..."
```

### 2. Create Actionable Issues

Include data in issue descriptions:
```
✓ "Low conversion rate (12%) needs investigation"
✗ "Conversion seems low"
```

### 3. Use Labels Consistently

Develop a labeling system:
- `data-insight` - Issues created from analysis
- `customer-feedback` - Based on user behavior
- `bug` - Technical issues
- `feature-request` - New functionality

### 4. Link Related Items

```
You: "Add comment to issue #64 referencing data from issue #67"
Claude: ✓ Cross-reference added
```

### 5. Set Priorities from Data

```
You: "Add label 'high-priority' to issues about features used by 500+ users"
```

---

## 🎯 Quick Command Templates

### Weekly Review
```
"Show me:
1. Orders this week
2. Revenue this week
3. New users
4. Top 3 products
Then create a weekly summary issue"
```

### Product Health Check
```
"Analyze all products and create issues for:
1. Products with < 5 sales this month
2. Products with high return rates
3. Products with low inventory"
```

### Customer Engagement
```
"Find customers who:
1. Configured but didn't buy
2. Haven't ordered in 60+ days
3. Have high lifetime value
Create CRM follow-up issues for each group"
```

---

## ✅ Workflow Checklist

- [ ] Set up Supabase MCP
- [ ] Set up GitHub MCP
- [ ] Test both MCPs independently
- [ ] Try basic combined workflow
- [ ] Create your first data-driven issue
- [ ] Establish labeling conventions
- [ ] Document team-specific workflows
- [ ] Set up regular reporting cadence

---

## 🎉 Summary

With Supabase + GitHub MCPs working together:

**Before:**
- Manual database queries
- Copy-paste to issue tracker
- Context switching
- Data scattered across tools
- Time: 10-15 minutes per insight

**After:**
- Natural language queries
- Instant issue creation
- Seamless workflow
- Data drives decisions
- Time: 1-2 minutes per insight

**Impact: 80-90% time savings!**

---

## 📞 Need More Examples?

Create your own workflows by combining:

1. **Database queries** (Supabase MCP)
   - Customer data
   - Order analytics
   - Product performance
   - Configuration trends

2. **GitHub actions** (GitHub MCP)
   - Issue creation
   - PR management
   - Label organization
   - Milestone tracking

Ask Claude Code to help you create custom workflows specific to your team's needs!

---

*EZ Cycle Ramp • MCP Practical Examples • 2025*

*Making data-driven development effortless*
