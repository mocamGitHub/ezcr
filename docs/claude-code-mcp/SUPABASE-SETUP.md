# Supabase MCP Setup for EZ Cycle Ramp

**Complete guide to setting up Supabase Model Context Protocol integration with Claude Code**

---

## 🎯 What You'll Achieve

After setup, you can interact with your EZ Cycle Ramp database using natural language:

```
You: "Show me all orders from the last week"
Claude: [Queries orders table and displays results]

You: "What's the average ramp configuration length?"
Claude: [Analyzes configurations table]

You: "Update product SKU 'RAMP-001' price to $399.99"
Claude: [Executes update safely]
```

No manual SQL, no switching to Supabase dashboard!

---

## 📋 Prerequisites

- [ ] Claude Code installed and running
- [ ] EZ Cycle Ramp repository cloned
- [ ] Supabase project set up (already done ✅)
- [ ] Access to `.env` file with credentials

---

## 🔍 Step 1: Locate Your Database Credentials

### Option A: From .env File

Your EZ Cycle project should have a `.env.local` or `.env` file with:

```bash
# Supabase Connection
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_KEY

# Database URL (this is what we need for MCP)
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT.supabase.co:5432/postgres
```

### Option B: From Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **Project Settings** → **Database**
3. Find **Connection String** section
4. Copy the **URI** format connection string
5. Replace `[YOUR-PASSWORD]` with your actual database password

**Example Connection String:**
```
postgresql://postgres.YOUR_REF:YOUR_PASSWORD@aws-0-us-west-1.pooler.supabase.com:5432/postgres
```

---

## 🛠️ Step 2: Install Supabase MCP Server

### Method 1: Using Claude Code CLI (Recommended)

Open your terminal and run:

```bash
# Replace with your actual connection string
claude mcp add-json '{
  "name": "ezcr-supabase",
  "description": "EZ Cycle Ramp Supabase Database",
  "command": "npx",
  "args": [
    "-y",
    "@modelcontextprotocol/server-postgres",
    "postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT.supabase.co:5432/postgres"
  ]
}'
```

**Important:** Replace `YOUR_PASSWORD` and `YOUR_PROJECT` with your actual values!

### Method 2: Manual Configuration

Edit Claude Code's configuration file:

**Linux/Mac:** `~/.config/claude/config.json`
**Windows:** `%APPDATA%\Claude\config.json`

Add to the `mcpServers` section:

```json
{
  "mcpServers": {
    "ezcr-supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-postgres",
        "postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT.supabase.co:5432/postgres"
      ]
    }
  }
}
```

---

## ✅ Step 3: Verify Installation

### Check MCP is Installed

```bash
claude mcp list
```

You should see:
```
✓ ezcr-supabase - EZ Cycle Ramp Supabase Database
```

### Test Connection

Start Claude Code and ask:

```
"List all tables in the EZ Cycle database"
```

Expected response should include tables like:
- `products`
- `configurations`
- `orders`
- `users`
- `crm_customers`
- etc.

---

## 🗄️ EZ Cycle Database Schema Reference

Your Supabase database includes these main tables:

### Core Tables

| Table | Description | Key Columns |
|-------|-------------|-------------|
| `products` | Ramp products | id, name, price, sku |
| `configurations` | Customer ramp configs | id, user_id, length, width, angle |
| `orders` | Customer orders | id, user_id, total, status |
| `order_items` | Order line items | id, order_id, product_id, quantity |
| `users` | User accounts | id, email, created_at |

### CRM Tables

| Table | Description | Key Columns |
|-------|-------------|-------------|
| `crm_customers` | CRM customer records | id, name, email, status |
| `crm_activities` | Customer activities | id, customer_id, type, notes |
| `crm_team_members` | Team members | id, name, email, role |

### Knowledge Base

| Table | Description | Key Columns |
|-------|-------------|-------------|
| `knowledge_base` | Documentation | id, title, content, category |
| `embeddings` | Vector embeddings | id, content, embedding |

---

## 💡 Practical Use Cases

### Use Case 1: Product Analysis

**Query:**
```
"Show me the 5 most expensive products"
```

**What Claude Code does:**
```sql
SELECT name, price, sku
FROM products
ORDER BY price DESC
LIMIT 5;
```

### Use Case 2: Order Reports

**Query:**
```
"How many orders were placed this month?"
```

**What Claude Code does:**
```sql
SELECT COUNT(*) as total_orders
FROM orders
WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE);
```

### Use Case 3: Configuration Analysis

**Query:**
```
"What's the most popular ramp length configuration?"
```

**What Claude Code does:**
```sql
SELECT length, COUNT(*) as count
FROM configurations
GROUP BY length
ORDER BY count DESC
LIMIT 1;
```

### Use Case 4: Customer Insights

**Query:**
```
"Show me customers who haven't placed an order in the last 30 days"
```

**What Claude Code does:**
```sql
SELECT u.email, u.created_at, MAX(o.created_at) as last_order
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
GROUP BY u.id, u.email, u.created_at
HAVING MAX(o.created_at) < NOW() - INTERVAL '30 days'
OR MAX(o.created_at) IS NULL;
```

### Use Case 5: Revenue Analysis

**Query:**
```
"What's the total revenue this week?"
```

**What Claude Code does:**
```sql
SELECT SUM(total) as weekly_revenue
FROM orders
WHERE created_at >= DATE_TRUNC('week', CURRENT_DATE)
AND status = 'completed';
```

---

## 🔒 Security Best Practices

### 1. Use Read-Only Credentials (Recommended)

For safety, create a read-only database user:

```sql
-- Connect to Supabase SQL Editor
-- Create read-only role
CREATE ROLE claude_readonly WITH LOGIN PASSWORD 'secure_password_here';

-- Grant read access to all tables in public schema
GRANT USAGE ON SCHEMA public TO claude_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO claude_readonly;

-- Grant read access to future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT SELECT ON TABLES TO claude_readonly;
```

Then use this connection string instead:
```
postgresql://claude_readonly:secure_password_here@db.YOUR_PROJECT.supabase.co:5432/postgres
```

### 2. Never Commit Credentials

Add to `.gitignore`:
```
# Claude Code MCP config (if storing locally)
.claude/mcp-config.json
```

### 3. Use Environment Variables

Instead of hardcoding in config, reference environment variables:

```json
{
  "mcpServers": {
    "ezcr-supabase": {
      "command": "sh",
      "args": [
        "-c",
        "npx -y @modelcontextprotocol/server-postgres $DATABASE_URL"
      ]
    }
  }
}
```

---

## 🧪 Testing Your Setup

### Test Query 1: List Products

```
Ask Claude: "Show me all products in the database"
```

Expected: List of EZ Cycle ramp products

### Test Query 2: Count Records

```
Ask Claude: "How many users are registered?"
```

Expected: Total user count

### Test Query 3: Schema Exploration

```
Ask Claude: "Describe the structure of the configurations table"
```

Expected: Column names, types, constraints

### Test Query 4: Join Query

```
Ask Claude: "Show me the last 5 orders with customer emails"
```

Expected: Orders joined with user data

---

## 🐛 Troubleshooting

### Error: "Connection timeout"

**Cause:** Supabase project paused or network issue

**Solution:**
1. Check Supabase dashboard - is project active?
2. Verify connection string is correct
3. Test connection with `psql`:
   ```bash
   psql "postgresql://postgres:PASSWORD@db.PROJECT.supabase.co:5432/postgres"
   ```

### Error: "Authentication failed"

**Cause:** Incorrect password in connection string

**Solution:**
1. Go to Supabase Dashboard → Settings → Database
2. Reset database password if needed
3. Update connection string
4. Restart Claude Code

### Error: "MCP server not found"

**Cause:** MCP not properly installed

**Solution:**
```bash
# Remove old MCP
claude mcp remove ezcr-supabase

# Re-add with correct config
claude mcp add-json '{...}'

# Restart Claude Code
```

### Error: "Permission denied"

**Cause:** Database user lacks permissions

**Solution:**
- If using read-only user, grant necessary permissions
- If using postgres user, check RLS policies
- Verify user has access to schema

---

## 📊 Performance Tips

### 1. Use Specific Queries

❌ Bad: "Show me everything"
✅ Good: "Show me the last 10 orders"

### 2. Add Indexes for Common Queries

```sql
-- Index for order queries by date
CREATE INDEX idx_orders_created_at ON orders(created_at);

-- Index for configuration queries
CREATE INDEX idx_configurations_length ON configurations(length);

-- Index for user email lookups
CREATE INDEX idx_users_email ON users(email);
```

### 3. Limit Result Sets

Always ask for limited results:
```
"Show me the first 20 products"
```

Not:
```
"Show me all products" (could be thousands!)
```

---

## 🎯 Advanced Queries

### Complex Analysis

```
"Calculate the average order value for each month this year"
```

### Data Aggregation

```
"Group configurations by length and show the count for each"
```

### Multi-Table Queries

```
"Show me users who configured a ramp but haven't ordered yet"
```

### Filtering and Sorting

```
"Show premium products (price > $500) sorted by popularity"
```

---

## 🔄 Updating Your Setup

### Change Database Credentials

```bash
# Remove old configuration
claude mcp remove ezcr-supabase

# Add new configuration with updated credentials
claude mcp add-json '{
  "name": "ezcr-supabase",
  ...new config...
}'
```

### Switch Between Environments

Create separate MCPs for different environments:

```bash
# Development database
claude mcp add-json '{
  "name": "ezcr-dev",
  "command": "npx",
  "args": ["...", "DEV_DATABASE_URL"]
}'

# Production database (read-only!)
claude mcp add-json '{
  "name": "ezcr-prod",
  "command": "npx",
  "args": ["...", "PROD_DATABASE_URL"]
}'
```

---

## 📈 Measuring Impact

Track how Supabase MCP improves your workflow:

### Before MCP
- Open Supabase dashboard
- Navigate to SQL editor
- Write query manually
- Copy results
- Switch back to code
- **Time: ~2-5 minutes per query**

### After MCP
- Ask Claude in natural language
- Get instant results
- Continue coding
- **Time: ~10-30 seconds per query**

**Time saved: 80-90% on database operations!**

---

## 🎓 Learning More

### Natural Language → SQL Examples

| Natural Language | SQL Equivalent |
|------------------|----------------|
| "Show me all products" | `SELECT * FROM products` |
| "Count orders today" | `SELECT COUNT(*) FROM orders WHERE DATE(created_at) = CURRENT_DATE` |
| "Average ramp length" | `SELECT AVG(length) FROM configurations` |
| "Top 5 customers by orders" | `SELECT user_id, COUNT(*) FROM orders GROUP BY user_id ORDER BY COUNT(*) DESC LIMIT 5` |

### Try These Queries

1. "What's the total value of all pending orders?"
2. "Show me products that have never been ordered"
3. "Which day of the week has the most orders?"
4. "List customers who configured but didn't buy"
5. "What's the price range of our products?"

---

## ✅ Setup Checklist

- [ ] Located Supabase connection string
- [ ] Installed Supabase MCP server
- [ ] Verified installation with `claude mcp list`
- [ ] Tested connection with sample query
- [ ] Created read-only database user (recommended)
- [ ] Updated MCP config with read-only credentials
- [ ] Tested complex queries
- [ ] Documented team-specific queries
- [ ] Set up for both dev and prod (if needed)

---

## 🎉 You're All Set!

Your Claude Code can now interact directly with your EZ Cycle Ramp database using natural language.

**Next steps:**
1. Try the example queries above
2. Experiment with your own questions
3. Build custom analysis queries
4. Share useful queries with your team

---

## 📞 Support

**MCP Issues:**
- Check official MCP docs: https://modelcontextprotocol.io
- Review Postgres MCP server: https://github.com/modelcontextprotocol/servers

**Supabase Issues:**
- Supabase docs: https://supabase.com/docs
- Check project status in dashboard
- Review database logs

**EZ Cycle Specific:**
- Review database schema in Supabase
- Check RLS policies if permission errors
- Verify user roles and permissions

---

*Happy querying! 🚀*

*EZ Cycle Ramp • Supabase MCP Setup Guide • 2025*
