# Supabase CLI Guide - Self-Hosted Instance

This project uses a **self-hosted Supabase instance** at `https://supabase.nexcyte.com`.

## Setup (One-Time)

### 1. Get Your Database Connection String

Contact your VPS administrator or check your Supabase dashboard for the PostgreSQL connection URL.

**Format:**
```
postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres
```

**Example:**
```
postgresql://postgres:your-secure-password@5.161.84.153:5432/postgres
```

### 2. Add to .env.local

Open `.env.local` and add your database URL:

```bash
# SUPABASE DATABASE URL (for CLI migrations)
DATABASE_URL=postgresql://postgres:your-password@5.161.84.153:5432/postgres
```

⚠️ **Important:** Never commit this to git! It contains your database password.

---

## Usage

### Apply All Pending Migrations

```bash
npm run db:push
```

This runs all migrations in `supabase/migrations/` that haven't been applied yet.

### Check What Would Be Applied (Dry Run)

```bash
npx supabase db push --db-url "$DATABASE_URL" --dry-run
```

### View Differences Between Local and Remote

```bash
npm run db:diff
```

### Alternative: Manual Method

If you prefer, you can still apply migrations manually:

1. Go to Supabase Dashboard → SQL Editor
2. Open the migration file from `supabase/migrations/`
3. Copy and paste the SQL
4. Click "Run"

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
