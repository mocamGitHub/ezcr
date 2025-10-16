#!/bin/bash
# Apply pending migrations to the database
# This script applies migrations 00016 and 00017

echo "Applying migrations to database..."
echo ""

# Database connection details
DB_HOST="nexcyte.com"
DB_USER="postgres"
DB_NAME="postgres"
DB_PASSWORD="AzUr3D1am0nd!"

# Apply migration 00016 - Foreign Keys
echo "1. Applying 00016_add_foreign_keys.sql..."
cat supabase/migrations/00016_add_foreign_keys.sql | \
  ssh root@$DB_HOST "docker exec -i supabase-db psql -U $DB_USER -d $DB_NAME"

if [ $? -eq 0 ]; then
  echo "✓ Foreign key constraints added successfully"
else
  echo "✗ Failed to add foreign key constraints"
  exit 1
fi

echo ""

# Apply migration 00017 - Configurator Seed Data
echo "2. Applying 00017_seed_dev_configurator.sql..."
cat supabase/migrations/00017_seed_dev_configurator.sql | \
  ssh root@$DB_HOST "docker exec -i supabase-db psql -U $DB_USER -d $DB_NAME"

if [ $? -eq 0 ]; then
  echo "✓ Configurator data seeded successfully"
else
  echo "✗ Failed to seed configurator data"
  exit 1
fi

echo ""
echo "=========================================="
echo "All migrations applied successfully!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Test the configurator page: http://localhost:3002/configurator"
echo "2. Verify foreign key constraints in Supabase dashboard"
echo ""
