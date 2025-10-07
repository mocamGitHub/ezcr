#!/bin/bash

# EZCR Documentation Structure Investigation
# Phase 1: INVESTIGATION ONLY - NO CHANGES
# Purpose: Verify current directory structure and identify what needs to be created
# Environment: Windows 11 with Git Bash

set -euo pipefail

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Start investigation
log "Starting EZCR Documentation Structure Investigation"
echo "=============================================="
echo ""

# Project root (Windows path in Git Bash format)
PROJECT_ROOT="/c/Users/morri/Dropbox/Websites/ezcr"

if [ ! -d "${PROJECT_ROOT}" ]; then
    error "Project root does not exist: ${PROJECT_ROOT}"
    exit 1
fi

log "Project root: ${PROJECT_ROOT}"
cd "${PROJECT_ROOT}" || exit 1
echo ""

# Required directory structure
REQUIRED_DIRS=(
    ".claude"
    ".claude/agents"
    ".claude/context"
    ".notebooklm"
    "docs"
    "docs/architecture"
    "docs/api"
    "docs/guides"
    "docs/decisions"
    "email-templates"
    "email-templates/orders"
    "email-templates/cart"
    "email-templates/support"
    "n8n"
    "n8n/workflows"
    "scripts"
    "supabase"
    "supabase/migrations"
    "supabase/functions"
)

# Required files
REQUIRED_FILES=(
    ".claude/coordinator.md"
    ".claude/project.md"
    ".claude/tasks.md"
    ".claude/agents/01-database-agent.md"
    ".claude/agents/02-ui-component-agent.md"
    ".claude/agents/03-ecommerce-agent.md"
    ".claude/agents/04-ai-rag-agent.md"
    ".claude/agents/05-automation-agent.md"
    ".claude/agents/06-testing-agent.md"
    ".claude/agents/07-devops-agent.md"
    ".claude/agents/08-documentation-agent.md"
    ".claude/agents/09-security-agent.md"
    ".claude/agents/10-notebooklm-agent.md"
    ".claude/agents/11-customer-success-agent.md"
    ".claude/agents/12-configurator-agent.md"
    ".claude/context/database-schema.md"
    ".claude/context/api-routes.md"
    ".claude/context/business-rules.md"
    ".claude/context/component-library.md"
)

# Investigation results
MISSING_DIRS=()
EXISTING_DIRS=()
MISSING_FILES=()
EXISTING_FILES=()

log "Checking directory structure..."
echo ""

# Check directories
for dir in "${REQUIRED_DIRS[@]}"; do
    if [ -d "${PROJECT_ROOT}/${dir}" ]; then
        success "✓ Directory exists: ${dir}"
        EXISTING_DIRS+=("${dir}")
    else
        warn "✗ Directory missing: ${dir}"
        MISSING_DIRS+=("${dir}")
    fi
done

echo ""
log "Checking required files..."
echo ""

# Check files
for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "${PROJECT_ROOT}/${file}" ]; then
        success "✓ File exists: ${file}"
        EXISTING_FILES+=("${file}")
    else
        warn "✗ File missing: ${file}"
        MISSING_FILES+=("${file}")
    fi
done

echo ""
echo "=============================================="
log "Investigation Summary"
echo "=============================================="
echo ""

# Summary
echo -e "${BLUE}Directories:${NC}"
echo "  Total Required: ${#REQUIRED_DIRS[@]}"
echo -e "  Existing: ${GREEN}${#EXISTING_DIRS[@]}${NC}"
echo -e "  Missing: ${YELLOW}${#MISSING_DIRS[@]}${NC}"
echo ""

echo -e "${BLUE}Files:${NC}"
echo "  Total Required: ${#REQUIRED_FILES[@]}"
echo -e "  Existing: ${GREEN}${#EXISTING_FILES[@]}${NC}"
echo -e "  Missing: ${YELLOW}${#MISSING_FILES[@]}${NC}"
echo ""

# List missing items
if [ ${#MISSING_DIRS[@]} -gt 0 ]; then
    echo -e "${YELLOW}Missing Directories:${NC}"
    for dir in "${MISSING_DIRS[@]}"; do
        echo "  - ${dir}"
    done
    echo ""
fi

if [ ${#MISSING_FILES[@]} -gt 0 ]; then
    echo -e "${YELLOW}Missing Files:${NC}"
    for file in "${MISSING_FILES[@]}"; do
        echo "  - ${file}"
    done
    echo ""
fi

# Check for existing knowledge base files
log "Checking for existing knowledge base documents..."
echo ""

KB_FILES=(
    "EZCR Complete Knowledge Base - Master Document.md"
    "EZCR - Complete Step-by-Step Project Instructions.md"
    "EZCR - Complete Agent Specification Files.md"
)

for kb_file in "${KB_FILES[@]}"; do
    if [ -f "${PROJECT_ROOT}/${kb_file}" ]; then
        success "✓ Knowledge base exists: ${kb_file}"
    else
        warn "✗ Knowledge base missing: ${kb_file}"
    fi
done

echo ""
echo "=============================================="
log "Next Steps"
echo "=============================================="
echo ""

if [ ${#MISSING_DIRS[@]} -gt 0 ] || [ ${#MISSING_FILES[@]} -gt 0 ]; then
    echo "Phase 2 will analyze the structure and determine creation strategy."
    echo "Phase 3 will create all missing directories and files."
else
    success "All required directories and files already exist!"
    echo "No action needed."
fi

echo ""
log "Investigation complete. Review findings and confirm to proceed to Phase 2."
echo "=============================================="

# Generate JSON report
cat > "${PROJECT_ROOT}/ezcr-docs-investigation-report.json" <<EOF
{
  "timestamp": "$(date -Iseconds)",
  "project_root": "${PROJECT_ROOT}",
  "directories": {
    "total": ${#REQUIRED_DIRS[@]},
    "existing": ${#EXISTING_DIRS[@]},
    "missing": ${#MISSING_DIRS[@]}
  },
  "files": {
    "total": ${#REQUIRED_FILES[@]},
    "existing": ${#EXISTING_FILES[@]},
    "missing": ${#MISSING_FILES[@]}
  }
}
EOF

success "Investigation report saved to: ezcr-docs-investigation-report.json"
