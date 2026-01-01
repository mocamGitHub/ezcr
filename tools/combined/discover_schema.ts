/**
 * Schema Discovery Tool for EZCR
 *
 * Scans supabase/migrations and code references to build a schema map.
 * Run: npx tsx tools/combined/discover_schema.ts
 */

import { readFileSync, readdirSync, writeFileSync, existsSync } from 'fs';
import { join, resolve } from 'path';

interface TableInfo {
  name: string;
  columns: string[];
  primaryKey?: string;
  tenantScoped: boolean;
  tenantColumn?: string;
}

interface FunctionInfo {
  name: string;
  signature: string;
  exists: boolean;
}

interface SchemaMap {
  version: string;
  generated_at: string;
  tables: Record<string, TableInfo>;
  functions: Record<string, FunctionInfo>;
  revenue_source: {
    table: string;
    amount_column: string;
    filter: string;
  };
  expense_source: {
    table: string;
    amount_column: string;
    filter: string;
  };
}

const REPO_ROOT = resolve(__dirname, '../..');
const MIGRATIONS_DIR = join(REPO_ROOT, 'supabase/migrations');
const OUTPUT_PATH = join(REPO_ROOT, 'docs/combined/SCHEMA_MAP_AUTO.json');

function extractTables(sql: string): TableInfo[] {
  const tables: TableInfo[] = [];
  const tableRegex = /CREATE TABLE(?:\s+IF NOT EXISTS)?\s+(?:public\.)?(\w+)\s*\(([\s\S]*?)\);/gi;

  let match;
  while ((match = tableRegex.exec(sql)) !== null) {
    const tableName = match[1];
    const body = match[2];

    // Extract columns
    const columnRegex = /^\s*(\w+)\s+(UUID|TEXT|VARCHAR|INTEGER|BOOLEAN|DECIMAL|NUMERIC|TIMESTAMPTZ|DATE|JSONB|BIGINT)/gmi;
    const columns: string[] = [];
    let colMatch;
    while ((colMatch = columnRegex.exec(body)) !== null) {
      columns.push(colMatch[1].toLowerCase());
    }

    // Check for tenant_id
    const hasTenantId = columns.includes('tenant_id');

    // Find primary key
    let primaryKey: string | undefined;
    const pkMatch = body.match(/(\w+)\s+UUID\s+PRIMARY KEY/i) || body.match(/PRIMARY KEY\s*\((\w+)\)/i);
    if (pkMatch) {
      primaryKey = pkMatch[1].toLowerCase();
    }

    tables.push({
      name: tableName,
      columns,
      primaryKey,
      tenantScoped: hasTenantId,
      tenantColumn: hasTenantId ? 'tenant_id' : undefined,
    });
  }

  return tables;
}

function extractFunctions(sql: string): FunctionInfo[] {
  const functions: FunctionInfo[] = [];
  const funcRegex = /CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+(?:public\.)?(\w+)\s*\(([^)]*)\)\s*RETURNS\s+(\w+)/gi;

  let match;
  while ((match = funcRegex.exec(sql)) !== null) {
    functions.push({
      name: match[1],
      signature: `${match[1]}(${match[2]}) RETURNS ${match[3]}`,
      exists: true,
    });
  }

  return functions;
}

async function main() {
  console.log('📋 EZCR Schema Discovery Tool');
  console.log('==============================\n');

  if (!existsSync(MIGRATIONS_DIR)) {
    console.error(`❌ Migrations directory not found: ${MIGRATIONS_DIR}`);
    process.exit(1);
  }

  const allTables: Record<string, TableInfo> = {};
  const allFunctions: Record<string, FunctionInfo> = {};

  // Read all migration files
  const files = readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort();

  console.log(`Found ${files.length} migration files\n`);

  for (const file of files) {
    const filePath = join(MIGRATIONS_DIR, file);
    const content = readFileSync(filePath, 'utf-8');

    const tables = extractTables(content);
    const functions = extractFunctions(content);

    for (const table of tables) {
      allTables[table.name] = table;
    }

    for (const func of functions) {
      allFunctions[func.name] = func;
    }

    if (tables.length > 0 || functions.length > 0) {
      console.log(`📁 ${file}: ${tables.length} tables, ${functions.length} functions`);
    }
  }

  // Also check db/migrations
  const dbMigrationsDir = join(REPO_ROOT, 'db/migrations');
  if (existsSync(dbMigrationsDir)) {
    const dbFiles = readdirSync(dbMigrationsDir).filter(f => f.endsWith('.sql'));
    for (const file of dbFiles) {
      const content = readFileSync(join(dbMigrationsDir, file), 'utf-8');
      const tables = extractTables(content);
      const functions = extractFunctions(content);

      for (const table of tables) {
        allTables[table.name] = table;
      }
      for (const func of functions) {
        allFunctions[func.name] = func;
      }

      if (tables.length > 0 || functions.length > 0) {
        console.log(`📁 db/${file}: ${tables.length} tables, ${functions.length} functions`);
      }
    }
  }

  console.log('\n📊 Summary');
  console.log('==========');
  console.log(`Total tables: ${Object.keys(allTables).length}`);
  console.log(`Total functions: ${Object.keys(allFunctions).length}`);

  // Key tables check
  const keyTables = ['orders', 'user_profiles', 'books_bank_transactions', 'nx_scheduler_booking'];
  console.log('\n🔑 Key Tables:');
  for (const t of keyTables) {
    const found = allTables[t];
    console.log(`  ${found ? '✅' : '❌'} ${t}${found ? ` (${found.columns.length} columns)` : ''}`);
  }

  // Key functions check
  const keyFunctions = ['has_role', 'update_updated_at_column', 'nexcyte_tenant_id'];
  console.log('\n🔧 Key Functions:');
  for (const f of keyFunctions) {
    const found = allFunctions[f];
    console.log(`  ${found ? '✅' : '❌'} ${f}`);
  }

  // Build schema map
  const schemaMap: SchemaMap = {
    version: '1.0.0',
    generated_at: new Date().toISOString(),
    tables: allTables,
    functions: allFunctions,
    revenue_source: {
      table: 'orders',
      amount_column: 'total_amount',
      filter: "payment_status = 'paid'",
    },
    expense_source: {
      table: 'books_bank_transactions',
      amount_column: 'amount',
      filter: 'amount < 0 AND cleared = true',
    },
  };

  writeFileSync(OUTPUT_PATH, JSON.stringify(schemaMap, null, 2));
  console.log(`\n✅ Schema map written to: ${OUTPUT_PATH}`);
}

main().catch(console.error);
