# Git Cross-Platform Development Guide

**Project:** EZCR
**Environments:** Windows Desktop + iPhone (Linux container via Claude Code)
**Date:** 2025-10-21

---

## ⚠️ Potential Issues & Solutions

Working with Git across Windows and Linux can cause several issues. Here's what to watch for:

---

## 1. Line Endings (CRLF vs LF) 🔴 **HIGH PRIORITY**

### The Problem

- **Windows:** Uses `CRLF` (Carriage Return + Line Feed: `\r\n`)
- **Linux/Mac:** Uses `LF` (Line Feed only: `\n`)

When you commit from Windows and then edit on Linux (or vice versa), Git may see every line as changed even though only line endings differ.

### Current Status

```bash
# Linux environment (iPhone/Claude Code):
core.autocrlf = NOT SET (defaults to false)

# Windows environment:
# Unknown - needs to be checked
```

**⚠️ No `.gitattributes` file found** - This is the root cause of potential issues!

### Solution: Create `.gitattributes`

This file tells Git how to handle line endings for each file type, ensuring consistency across platforms.

**Recommended `.gitattributes`:**

```gitattributes
# Auto detect text files and normalize line endings to LF on checkin
* text=auto

# Explicitly declare text files to always use LF
*.js text eol=lf
*.jsx text eol=lf
*.ts text eol=lf
*.tsx text eol=lf
*.json text eol=lf
*.md text eol=lf
*.css text eol=lf
*.scss text eol=lf
*.html text eol=lf
*.xml text eol=lf
*.yml text eol=lf
*.yaml text eol=lf
*.sh text eol=lf
*.sql text eol=lf

# Scripts should always have LF endings
*.sh text eol=lf

# Windows batch files should have CRLF
*.bat text eol=crlf
*.cmd text eol=crlf
*.ps1 text eol=crlf

# Binary files (don't try to normalize)
*.png binary
*.jpg binary
*.jpeg binary
*.gif binary
*.ico binary
*.mov binary
*.mp4 binary
*.mp3 binary
*.flv binary
*.fla binary
*.swf binary
*.gz binary
*.zip binary
*.7z binary
*.ttf binary
*.woff binary
*.woff2 binary
*.eot binary
*.otf binary
*.pdf binary

# Package manager lock files - keep exact as-is
package-lock.json -diff
pnpm-lock.yaml -diff
```

### Action Required

**Create this file NOW:**

```bash
# Add the .gitattributes file
# (I'll create it for you below)

# Refresh all files to apply new rules (AFTER committing .gitattributes)
git add --renormalize .
git commit -m "chore: Normalize line endings"
```

---

## 2. Different Git User Identities 🟡 **MEDIUM PRIORITY**

### The Problem

```bash
# Linux (iPhone/Claude Code):
user.name=Claude
user.email=noreply@anthropic.com

# Windows (from commit history):
user.name=mocamGitHub
user.email=51081515+mocamGitHub@users.noreply.github.com
```

Commits from different environments will show different authors. This is actually **fine** for tracking purposes, but can look inconsistent.

### Current Behavior

- Commits from iPhone: `Claude <noreply@anthropic.com>`
- Commits from Windows: `mocamGitHub <51081515+mocamGitHub@users.noreply.github.com>`

### Solution Options

#### Option 1: Keep As-Is (Recommended)

**Pros:**
- Clear which environment made each commit
- Helpful for debugging environment-specific issues
- No action needed

**Cons:**
- Looks inconsistent in git history

#### Option 2: Standardize to Your GitHub Identity

**On iPhone/Linux, set:**
```bash
git config user.name "mocamGitHub"
git config user.email "51081515+mocamGitHub@users.noreply.github.com"
```

**Pros:**
- Consistent authorship across all commits
- Better for contribution graphs

**Cons:**
- Can't easily tell which environment made a commit

#### Option 3: Use Co-Authored-By (Current)

Keep different authors but use `Co-Authored-By` in commit messages:

```
feat: Add new feature

Co-Authored-By: Claude <noreply@anthropic.com>
```

This is what you're currently doing (automatically added by Claude Code).

### Recommendation

**Keep as-is** - It's actually beneficial to see which environment made each commit.

---

## 3. File Permissions 🟢 **LOW PRIORITY**

### The Problem

```bash
# Linux:
core.filemode=true  # Git tracks file permissions (755, 644, etc.)

# Windows:
core.filemode=false  # Windows doesn't have Unix permissions
```

If you make a file executable on Linux (`chmod +x script.sh`), Windows might not preserve that when it commits.

### Current Impact

**Minimal** - Your project is mostly JavaScript/TypeScript files that don't need execute permissions.

### Files That Need Execute Permissions

```bash
# Check current executable scripts
find . -name "*.sh" -type f 2>/dev/null
```

If you have shell scripts, ensure they're committed with execute permissions from Linux.

### Solution

**On Windows:** Set `core.filemode=false` (probably already set)
```bash
git config core.filemode false
```

**On Linux:** Keep `core.filemode=true` (current setting is correct)

---

## 4. Case Sensitivity 🟡 **MEDIUM PRIORITY**

### The Problem

- **Windows:** Case-insensitive filesystem (`file.txt` = `FILE.TXT`)
- **Linux:** Case-sensitive filesystem (`file.txt` ≠ `FILE.TXT`)

If you rename `Component.tsx` to `component.tsx` on Windows, Git might not detect the change. On Linux, these are two different files.

### Potential Issues

1. **Rename detection fails on Windows**
2. **Merge conflicts** when renaming files with different cases
3. **Build failures** when importing with wrong case

### Solution

```bash
# On Windows, force Git to respect case
git config core.ignorecase false

# When renaming files, use git mv:
git mv Component.tsx component.tsx

# NOT just:
mv Component.tsx component.tsx  # ❌ Git won't detect this on Windows
```

### Best Practice

**Always use lowercase for file/folder names** to avoid issues entirely.

---

## 5. Branch Naming Convention 🟢 **LOW PRIORITY**

### Current System

Claude Code creates branches like:
```
claude/list-available-mcps-011CULRL348GMBihRrg4EWHG
```

**This is fine!** The branch naming is:
- ✅ Same on both platforms
- ✅ Automatically generated by Claude Code
- ✅ No platform-specific issues

### Best Practice

When creating manual branches:
```bash
# Good (works everywhere):
git checkout -b feature/add-login
git checkout -b fix/header-bug

# Avoid (special chars can cause issues):
git checkout -b feature\new-thing  # ❌ Backslash
git checkout -b "feature with spaces"  # ❌ Spaces
```

---

## 6. Merge Conflicts 🔴 **HIGH PRIORITY**

### The Scenario

1. You edit a file on **Windows**
2. You also edit the same file on **iPhone/Linux**
3. Both try to commit/push
4. **MERGE CONFLICT** 💥

### How to Avoid

#### Option A: Always Pull Before Starting Work

```bash
# On BOTH environments, before starting work:
git pull origin main  # Or your current branch
```

#### Option B: Use Different Branches per Environment

```bash
# Windows:
git checkout -b feature/windows-work

# iPhone/Linux:
git checkout -b feature/mobile-work

# Merge when done
```

#### Option C: Always Work on Latest Changes

```bash
# Before making changes:
git status
git pull --rebase origin <your-branch>

# After making changes:
git pull --rebase origin <your-branch>  # Rebase instead of merge
git push origin <your-branch>
```

### If Conflict Occurs

```bash
# Git will mark conflicts like:
<<<<<<< HEAD
Your Windows changes
=======
Your iPhone/Linux changes
>>>>>>> branch-name

# Fix manually, then:
git add <fixed-files>
git commit -m "chore: Resolve merge conflict"
git push
```

---

## 7. Git Hooks 🟢 **LOW PRIORITY**

### Current Hooks

You have a `stop-hook-git-check.sh` that checks for uncommitted changes.

### Potential Issue

- **Windows:** Git Bash runs hooks via Bash
- **Linux:** Runs hooks natively

**This is fine** - Your hook uses `#!/bin/bash` which works on both.

### Best Practice

Test hooks on both platforms after creating them.

---

## 8. Path Separators 🟢 **LOW PRIORITY**

### The Issue

- **Windows:** Uses backslashes `C:\Users\morri\...`
- **Linux:** Uses forward slashes `/home/user/...`

### Git Handles This

Git **always uses forward slashes** internally, even on Windows:

```bash
# Both of these work on Windows:
git add C:/Users/morri/file.txt  # ✅
git add C:\Users\morri\file.txt  # ✅ (Git converts)

# Linux only accepts:
git add /home/user/file.txt  # ✅
```

### No Action Needed

Git automatically handles path separator conversion.

---

## 9. Working with Large Files 🟢 **LOW PRIORITY**

### Current Status

Your project uses:
- Images in `public/images/`
- Possibly videos/assets

### Recommendation

If you have files >50MB, consider **Git LFS** (Large File Storage):

```bash
# Install Git LFS (once per machine)
git lfs install

# Track large files
git lfs track "*.mp4"
git lfs track "*.zip"
git lfs track "*.pdf"

# Commit .gitattributes
git add .gitattributes
git commit -m "chore: Track large files with Git LFS"
```

**Current project:** Probably doesn't need this (mostly code and small images).

---

## 10. Claude Code Branch Management 🟡 **MEDIUM PRIORITY**

### How It Works

When you use Claude Code on iPhone, it:
1. Creates a branch: `claude/task-name-SESSIONID`
2. Commits changes
3. Pushes to that branch
4. You create PR manually

### Potential Issue

If you work on Windows Desktop **while** an iPhone session is active:

```
Windows Desktop          iPhone/Claude Code
     ↓                          ↓
main branch              claude/xyz branch
     ↓                          ↓
Makes changes           Makes changes
     ↓                          ↓
Commits to main        Commits to claude/xyz
     ↓                          ↓
   DIVERGED! 🚨
```

### Solution

**Always check what branch you're on:**

```bash
# On Windows:
git branch  # Shows current branch

# If you're on a Claude branch, switch to main:
git checkout main
git pull origin main

# Create your own branch:
git checkout -b feature/my-work
```

### Best Practice

**Never commit directly to `main`** - always use feature branches.

---

## Summary: Action Items

### 🔴 **CRITICAL - Do These Now**

1. **Create `.gitattributes` file** (I'll do this below)
2. **Pull before starting work** on either platform
3. **Always use `git pull --rebase`** to avoid unnecessary merge commits

### 🟡 **RECOMMENDED - Do Soon**

4. **Set `core.ignorecase=false` on Windows**
5. **Test file renames** across platforms
6. **Document your branch strategy**

### 🟢 **OPTIONAL - Nice to Have**

7. **Standardize git user identity** (or keep as-is)
8. **Consider Git LFS** for large files (if any)
9. **Set up Git aliases** for common commands

---

## Git Workflow Best Practices

### Daily Workflow

```bash
# === MORNING (Start of Work Session) ===

# 1. Check current branch
git branch

# 2. Pull latest changes
git pull --rebase origin <your-branch>

# 3. Start working...

# === DURING WORK ===

# 4. Commit frequently
git add .
git commit -m "feat: Add login form"

# 5. Push regularly
git push origin <your-branch>

# === END OF DAY ===

# 6. Final push
git push origin <your-branch>

# 7. If switching environments, note where you stopped
```

### Switching Between Environments

```bash
# === On Windows (before switching to iPhone) ===
git add .
git commit -m "wip: Work in progress"
git push origin <your-branch>

# === On iPhone (after Windows session) ===
git pull origin <your-branch>
# Continue work...

# === Back to Windows ===
git pull origin <your-branch>
# Continue work...
```

### Creating Pull Requests

```bash
# 1. Ensure branch is up to date
git pull origin main
git rebase main  # Or: git merge main

# 2. Push final changes
git push origin <your-branch>

# 3. Create PR on GitHub
# Visit: https://github.com/mocamGitHub/ezcr/pulls

# 4. Merge PR

# 5. On both environments, update main:
git checkout main
git pull origin main
```

---

## Troubleshooting

### Issue: "Your branch has diverged"

```bash
# Option 1: Rebase (preferred)
git pull --rebase origin <your-branch>

# Option 2: Merge (creates merge commit)
git pull origin <your-branch>

# Option 3: Force push (DANGEROUS - only if you're sure)
git push --force origin <your-branch>
```

### Issue: Line endings changed on every file

```bash
# 1. Create/update .gitattributes (done below)
# 2. Refresh all files
git add --renormalize .
git status  # Should show all files modified
git commit -m "chore: Normalize line endings"
git push
```

### Issue: File rename not detected on Windows

```bash
# Use git mv instead of regular mv
git mv OldName.tsx NewName.tsx
git commit -m "refactor: Rename component"
```

### Issue: Merge conflict

```bash
# 1. See conflicted files
git status

# 2. Open each file and fix conflicts
# Look for: <<<<<<< ======= >>>>>>>

# 3. Mark as resolved
git add <fixed-file>

# 4. Complete merge
git commit -m "chore: Resolve merge conflict"
git push
```

---

## Quick Reference

### Check Configuration

```bash
# View all config
git config --list

# View specific setting
git config user.name
git config core.autocrlf

# Set config (current repo only)
git config user.name "Your Name"

# Set config (global - all repos)
git config --global user.name "Your Name"
```

### Branch Management

```bash
# List branches
git branch -a

# Create branch
git checkout -b feature/new-thing

# Switch branch
git checkout main

# Delete branch (local)
git branch -d feature/old-thing

# Delete branch (remote)
git push origin --delete feature/old-thing
```

### Rebase vs Merge

```bash
# Rebase (cleaner history, linear)
git pull --rebase origin main

# Merge (keeps branch history)
git pull origin main

# When in doubt, use rebase
```

---

## Platform-Specific Notes

### Windows Desktop

**Git Bash recommended** over PowerShell for consistency with Linux.

**Check these settings:**
```bash
git config core.autocrlf  # Should be: true or input
git config core.ignorecase  # Should be: false
```

### iPhone (Claude Code / Linux)

**Container-based** - Git config is ephemeral (may reset between sessions).

**Important:**
- Changes made in Claude Code are immediately committed
- No local "working directory" state persists
- Always sync via Git, not local files

---

## Conclusion

**Main Takeaways:**

1. ✅ **Cross-platform Git is safe** with proper configuration
2. ⚠️ **Line endings** are the #1 issue (`.gitattributes` fixes this)
3. ✅ **Always pull before starting work**
4. ✅ **Use feature branches**, never commit directly to `main`
5. ✅ **Different git identities are OK** (helps track environment)

**With the `.gitattributes` file below, you're 90% protected from cross-platform issues!**

---

**Last Updated:** 2025-10-21
**Next Review:** When issues occur (hopefully never! 😄)
