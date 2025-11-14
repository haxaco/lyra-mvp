#!/bin/bash
# Script to run onboarding migrations
# 
# Usage:
#   ./scripts/run-onboarding-migrations.sh
#   OR
#   bash scripts/run-onboarding-migrations.sh

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Running onboarding migrations...${NC}"

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo -e "${RED}Error: DATABASE_URL environment variable is not set${NC}"
  echo ""
  echo "Please set it to your database connection string, for example:"
  echo "  export DATABASE_URL='postgresql://user:password@host:port/database'"
  echo ""
  echo "Or for Supabase:"
  echo "  export DATABASE_URL='postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres'"
  exit 1
fi

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"
MIGRATION_FILE="$PROJECT_ROOT/infra/migrations/run_onboarding_migrations.sql"

# Check if migration file exists
if [ ! -f "$MIGRATION_FILE" ]; then
  echo -e "${RED}Error: Migration file not found at $MIGRATION_FILE${NC}"
  exit 1
fi

# Check if psql is available
if ! command -v psql &> /dev/null; then
  echo -e "${RED}Error: psql command not found${NC}"
  echo ""
  echo "Please install PostgreSQL client tools:"
  echo "  macOS: brew install postgresql"
  echo "  Ubuntu: sudo apt-get install postgresql-client"
  exit 1
fi

# Run the migration
echo -e "${YELLOW}Executing migration: $MIGRATION_FILE${NC}"
psql "$DATABASE_URL" -f "$MIGRATION_FILE"

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Migrations completed successfully!${NC}"
else
  echo -e "${RED}❌ Migration failed. Please check the error messages above.${NC}"
  exit 1
fi

