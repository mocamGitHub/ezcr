#!/bin/bash
# EZ Cycle Ramp - Git Commit & Push Script (Linux/Mac)
# Usage: bash .claude/commit-push.sh "Your commit message"

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get current branch
BRANCH=$(git branch --show-current)

# Validate branch name (must start with 'claude/')
if [[ ! "$BRANCH" =~ ^claude/.* ]]; then
    echo -e "${RED}Error: Branch must start with 'claude/' for push to work${NC}"
    echo -e "${YELLOW}Current branch: $BRANCH${NC}"
    exit 1
fi

# Get commit message from argument or prompt
if [ -z "$1" ]; then
    echo -e "${BLUE}Enter commit message:${NC}"
    read -r COMMIT_MSG
else
    COMMIT_MSG="$1"
fi

# Check if there are changes to commit
if [[ -z $(git status -s) ]]; then
    echo -e "${YELLOW}No changes to commit${NC}"
    git status
    exit 0
fi

echo -e "${BLUE}=== EZ Cycle Ramp - Commit & Push ===${NC}"
echo -e "${YELLOW}Branch: $BRANCH${NC}"
echo ""

# Show status
echo -e "${BLUE}Changes to commit:${NC}"
git status -s
echo ""

# Stage all changes
echo -e "${BLUE}Staging all changes...${NC}"
git add -A

# Create commit with standard footer
echo -e "${BLUE}Creating commit...${NC}"
git commit -m "$(cat <<EOF
$COMMIT_MSG

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"

# Push to remote
echo -e "${BLUE}Pushing to origin/$BRANCH...${NC}"
git push -u origin "$BRANCH"

# Show final status
echo ""
echo -e "${GREEN}✓ Success!${NC}"
echo -e "${GREEN}Commit and push completed${NC}"
echo ""
git log -1 --oneline
echo ""
git status
