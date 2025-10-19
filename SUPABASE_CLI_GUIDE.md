# Supabase CLI Guide - Self-Hosted Instance

This project uses a **self-hosted Supabase instance** at `https://supabase.nexcyte.com`.

## ⚠️ Important: Self-Hosted Instance Limitations

Your Supabase instance is **self-hosted via Coolify** on a VPS. For security reasons, the PostgreSQL database port (5432) is **NOT exposed** to external connections. This is the correct security configuration.

**This means:**
- ❌ Direct database connections from your local machine won't work
- ❌ `npx supabase db push` won't work from local environment
- ✅ Use Supabase Dashboard SQL Editor instead (recommended)
- ✅ Or use SSH tunneling (advanced)

---

## Recommended Method: Supabase Dashboard

### Apply Migrations via Dashboard (Easy & Secure)

1. **Go to Supabase Dashboard**
   - URL: https://supabase.nexcyte.com
   - Navigate to: **SQL Editor**

2. **Open Migration File**
   - Browse to: `supabase/migrations/00021_testimonials.sql` (or latest migration)
   - Copy the entire SQL content

3. **Paste and Run**
   - Paste into SQL Editor
   - Click **Run** or **Execute**
   - Verify success in the output

4. **Done!** ✅

This is the **easiest and most secure** method for self-hosted instances.

---

## Alternative Method: SSH Tunnel (Advanced)

If you prefer CLI access, you can set up an SSH tunnel:

### 1. Create SSH Tunnel

```bash
# On your local machine
ssh -L 5433:localhost:5432 root@5.161.84.153
```

This forwards local port 5433 to the remote PostgreSQL port 5432.

### 2. Update DATABASE_URL

```bash
# In .env.local (temporary, for tunnel use)
DATABASE_URL=postgresql://postgres:wuX8wn5yzmXvGMesb48bA0lWY0tPsUE1@localhost:5433/postgres
```

### 3. Apply Migrations

```bash
npx supabase db push --db-url "postgresql://postgres:wuX8wn5yzmXvGMesb48bA0lWY0tPsUE1@localhost:5433/postgres"
```

### 4. Close Tunnel

```bash
# Press Ctrl+C in the SSH tunnel terminal
```

⚠️ **Note:** You must keep the SSH tunnel open while running migrations.

---

## Alternative Method: Run on VPS (Advanced)

You can also run migrations directly on your VPS:

### 1. SSH into VPS

```bash
ssh root@5.161.84.153
```

### 2. Navigate to Supabase Directory

```bash
cd /path/to/supabase  # Find with: docker ps | grep postgres
```

### 3. Run Migration via Docker

```bash
docker exec -i supabase-db psql -U postgres -d postgres < /path/to/migration.sql
```

---

## Setup (For Documentation)

### 1. Get Your Database Connection String

The connection string is stored in your `.env.local`:

**Format:**
```
postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres
```

**Your Configuration:**
```
DATABASE_URL=postgresql://postgres:wuX8wn5yzmXvGMesb48bA0lWY0tPsUE1@5.161.84.153:5432/postgres
```

⚠️ **Important:**
- This is already configured in your `.env.local`
- Never commit this to git! It contains your database password
- Direct connections won't work (port not exposed)

---

## Usage

### ✅ Recommended: Apply Migrations via Dashboard

**Steps:**
1. Go to https://supabase.nexcyte.com → SQL Editor
2. Copy migration SQL from `supabase/migrations/`
3. Paste and click "Run"

**Advantages:**
- ✅ No setup required
- ✅ Works from anywhere
- ✅ Secure (uses HTTPS)
- ✅ Visual feedback

### ⚠️ Advanced: Apply via SSH Tunnel

```bash
# Terminal 1: Create tunnel
ssh -L 5433:localhost:5432 root@5.161.84.153

# Terminal 2: Run migration
npx supabase db push --db-url "postgresql://postgres:wuX8wn5yzmXvGMesb48bA0lWY0tPsUE1@localhost:5433/postgres"
```

### ❌ Won't Work: Direct Connection

```bash
# This will timeout - port not exposed
npm run db:push
```

---

## Creating New Migrations

### 1. Create Migration File

Create a new file in `supabase/migrations/` with format:
```
00022_your_feature_name.sql
```

**Naming Convention:**
- Start with next sequential number (00022, 00023, etc.)
- Use descriptive snake_case name
- Always use `.sql` extension

**Example:**
```
supabase/migrations/00022_add_wishlist_table.sql
```

### 2. Write Your SQL

```sql
-- Migration: Wishlist Feature
-- Description: Creates wishlist table for saving favorite products
-- Created: 2025-10-19

CREATE TABLE IF NOT EXISTS wishlists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- Enable RLS
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;

-- Users can only see their own wishlist
CREATE POLICY wishlists_view ON wishlists
  FOR SELECT
  USING (auth.uid() = user_id);
```

### 3. Apply Migration

```bash
npm run db:push
```

---

## Common Commands

| Command | Description |
|---------|-------------|
| `npm run db:push` | Apply pending migrations |
| `npm run db:diff` | Show differences between local and remote |
| `npm run db:reset` | Reset database (⚠️ DANGER - deletes all data) |
| `npx supabase db push --db-url "$DATABASE_URL" --dry-run` | Preview what would be applied |

---

## Troubleshooting

### Error: "Cannot find project ref"

✅ **Solution:** Make sure `DATABASE_URL` is set in `.env.local`

### Error: "Connection refused"

Check:
1. Is your VPS/database running?
2. Is the host/port correct?
3. Is your IP whitelisted (if applicable)?
4. Can you ping the database server?

### Error: "Password authentication failed"

Check:
1. Is the password correct in `DATABASE_URL`?
2. Is the password URL-encoded (if it contains special characters)?

**URL Encoding Special Characters:**
- `@` → `%40`
- `#` → `%23`
- `$` → `%24`
- `%` → `%25`
- `&` → `%26`

**Example:**
```bash
# Password: p@ssw0rd#123
# Encoded: p%40ssw0rd%23123
DATABASE_URL=postgresql://postgres:p%40ssw0rd%23123@5.161.84.153:5432/postgres
```

### Error: "Migration already applied"

This is normal! It means the migration has already been run. Supabase CLI tracks which migrations have been applied.

---

## Migration Best Practices

### ✅ DO:
- Always use `IF NOT EXISTS` for CREATE TABLE
- Always use `OR REPLACE` for CREATE FUNCTION
- Test migrations in development first
- Use descriptive migration names
- Add comments explaining what the migration does
- Include rollback instructions in comments

### ❌ DON'T:
- Don't modify existing migration files after they've been applied
- Don't delete migration files
- Don't skip migration numbers
- Don't commit sensitive data in migrations
- Don't run migrations directly on production without testing

---

## Example Workflow

### Adding a New Feature

1. **Create migration file:**
   ```bash
   touch supabase/migrations/00022_add_reviews_table.sql
   ```

2. **Write SQL:**
   ```sql
   CREATE TABLE IF NOT EXISTS reviews (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     product_id UUID NOT NULL REFERENCES products(id),
     user_id UUID NOT NULL REFERENCES auth.users(id),
     rating INTEGER CHECK (rating >= 1 AND rating <= 5),
     comment TEXT,
     created_at TIMESTAMPTZ DEFAULT NOW()
   );
   ```

3. **Test locally (dry run):**
   ```bash
   npx supabase db push --db-url "$DATABASE_URL" --dry-run
   ```

4. **Apply migration:**
   ```bash
   npm run db:push
   ```

5. **Verify in dashboard:**
   - Go to Supabase Dashboard → Table Editor
   - Check that the table was created

6. **Commit to git:**
   ```bash
   git add supabase/migrations/00022_add_reviews_table.sql
   git commit -m "feat: Add reviews table migration"
   git push
   ```

---

## Files Created

- ✅ `supabase/config.toml` - Supabase CLI configuration
- ✅ `.env.local` - Added DATABASE_URL field
- ✅ `.env.example` - Added DATABASE_URL example
- ✅ `package.json` - Added npm scripts (db:push, db:diff, db:reset)

---

## Quick Reference

```bash
# Apply migrations
npm run db:push

# View pending changes
npm run db:diff

# Dry run (preview only)
npx supabase db push --db-url "$DATABASE_URL" --dry-run
```

---

**Your Supabase Instance:**
- **URL:** https://supabase.nexcyte.com
- **Host:** 5.161.84.153
- **Migrations Folder:** `supabase/migrations/`
- **CLI Version:** 2.51.0 (via npx)

For more help, see: https://supabase.com/docs/reference/cli
