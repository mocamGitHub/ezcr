#!/bin/bash
# EZ Cycle Ramp - Session Startup Script (Linux/Mac)
# Usage: bash .claude/session-start.sh

set -e  # Exit on error

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

clear

echo -e "${CYAN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                                                        ║${NC}"
echo -e "${CYAN}║           EZ Cycle Ramp - Session Startup             ║${NC}"
echo -e "${CYAN}║                                                        ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Get current branch
BRANCH=$(git branch --show-current)
echo -e "${BLUE}Current Branch:${NC} $BRANCH"
echo ""

# Check if on a claude/ branch
if [[ ! "$BRANCH" =~ ^claude/.* ]]; then
    echo -e "${YELLOW}⚠️  Warning: Not on a 'claude/' branch${NC}"
    echo -e "${YELLOW}   Push operations may fail${NC}"
    echo ""
fi

# Step 1: Clear Claude Code context
echo -e "${BLUE}Step 1: Clearing Claude Code context...${NC}"
echo -e "${YELLOW}   (Run '/clear' command in Claude Code)${NC}"
echo ""
read -p "Press Enter after running /clear in Claude Code..."
echo ""

# Step 2: Pull latest changes
echo -e "${BLUE}Step 2: Pulling latest changes from remote...${NC}"
git fetch origin
if git diff --quiet HEAD origin/$BRANCH; then
    echo -e "${GREEN}✓ Already up to date${NC}"
else
    echo -e "${YELLOW}Pulling changes...${NC}"
    git pull origin "$BRANCH"
    echo -e "${GREEN}✓ Changes pulled successfully${NC}"
fi
echo ""

# Step 3: Show repository status
echo -e "${BLUE}Step 3: Repository Status${NC}"
echo -e "${YELLOW}Branch:${NC} $BRANCH"
echo ""

# Check working tree status
if [[ -z $(git status -s) ]]; then
    echo -e "${GREEN}✓ Working tree clean${NC}"
else
    echo -e "${YELLOW}⚠️  Uncommitted changes:${NC}"
    git status -s
fi
echo ""

# Show recent commits
echo -e "${BLUE}Recent commits:${NC}"
git log -5 --oneline --decorate
echo ""

# Step 4: Display session handoff
echo -e "${BLUE}Step 4: Loading session handoff...${NC}"
echo ""
echo -e "${CYAN}════════════════════════════════════════════════════════${NC}"
echo ""

# Check if handoff file exists
if [ -f ".claude/SESSION-HANDOFF.md" ]; then
    # Display key sections from handoff
    echo -e "${GREEN}📊 SESSION HANDOFF SUMMARY${NC}"
    echo ""

    # Extract and display "Current Session Status" section
    echo -e "${YELLOW}Current Status:${NC}"
    echo -e "${YELLOW}─────────────${NC}"
    sed -n '/## 📊 Current Session Status/,/## 📁 What Was Created/p' .claude/SESSION-HANDOFF.md | head -n -1 | tail -n +2
    echo ""

    # Extract and display "Recommended Next Steps" section
    echo -e "${YELLOW}Next Steps:${NC}"
    echo -e "${YELLOW}───────────${NC}"
    sed -n '/## 🎯 Recommended Next Steps/,/## 📚 Documentation Reference/p' .claude/SESSION-HANDOFF.md | head -n -1 | tail -n +2 | head -n 30
    echo ""

    echo -e "${CYAN}════════════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "${BLUE}📖 Full handoff document:${NC} .claude/SESSION-HANDOFF.md"
    echo ""

    # Offer to open full handoff
    read -p "Open full SESSION-HANDOFF.md? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        if command -v code &> /dev/null; then
            code .claude/SESSION-HANDOFF.md
        elif command -v cat &> /dev/null; then
            cat .claude/SESSION-HANDOFF.md | less
        else
            echo "Please open .claude/SESSION-HANDOFF.md manually"
        fi
    fi
else
    echo -e "${RED}✗ SESSION-HANDOFF.md not found${NC}"
    echo -e "${YELLOW}  Create it with session handoff content${NC}"
fi

echo ""
echo -e "${CYAN}════════════════════════════════════════════════════════${NC}"
echo ""

# Step 5: Show quick commands
echo -e "${GREEN}Quick Commands:${NC}"
echo ""
echo -e "${YELLOW}Commit & Push:${NC}"
echo -e "  bash .claude/commit-push.sh \"Your message\""
echo ""
echo -e "${YELLOW}Start Next Session:${NC}"
echo -e "  bash .claude/session-start.sh"
echo ""
echo -e "${YELLOW}View Handoff:${NC}"
echo -e "  cat .claude/SESSION-HANDOFF.md"
echo ""
echo -e "${YELLOW}Integration Priorities:${NC}"
echo -e "  cat docs/INTEGRATION-PRIORITIES.md"
echo ""

echo -e "${CYAN}════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${GREEN}✓ Session startup complete!${NC}"
echo ""
echo -e "${BLUE}Now run in Claude Code:${NC}"
echo -e "${YELLOW}/startup .claude/SESSION-HANDOFF.md${NC}"
echo ""
