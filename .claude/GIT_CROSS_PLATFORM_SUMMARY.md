# Git Cross-Platform Quick Reference

**Working from:** Windows Desktop + iPhone 16 Pro Max (Linux container)

---

## ✅ You're Protected!

The `.gitattributes` file is now configured to **prevent line ending issues** between Windows and Linux.

---

## 🚦 Issues & Severity

| Issue | Severity | Status |
|-------|----------|--------|
| **Line endings (CRLF vs LF)** | 🔴 HIGH | ✅ **FIXED** with `.gitattributes` |
| **Different git identities** | 🟡 MEDIUM | ✅ OK (helpful for tracking) |
| **Merge conflicts** | 🔴 HIGH | ⚠️ **Avoid with workflow** |
| **File permissions** | 🟢 LOW | ✅ OK (minimal impact) |
| **Case sensitivity** | 🟡 MEDIUM | ⚠️ **Use lowercase filenames** |
| **Branch naming** | 🟢 LOW | ✅ OK (Claude Code handles) |
| **Path separators** | 🟢 LOW | ✅ OK (Git handles) |

---

## 📋 Daily Workflow

### Before Starting Work (CRITICAL!)

```bash
# 1. Check what branch you're on
git branch

# 2. Pull latest changes
git pull --rebase origin <your-branch>
```

### During Work

```bash
# Commit frequently
git add .
git commit -m "feat: Your message"

# Push regularly
git push origin <your-branch>
```

### When Switching Environments

```bash
# === On Current Environment (before switching) ===
git add .
git commit -m "wip: Work in progress"
git push origin <your-branch>

# === On New Environment (after switching) ===
git pull origin <your-branch>
# Continue work...
```

---

## ⚠️ Common Mistakes to Avoid

### ❌ DON'T: Work on same file on both platforms simultaneously

```bash
# Bad:
Windows: Edit file.ts
iPhone: Edit file.ts (without pulling first)
Result: MERGE CONFLICT 💥
```

### ✅ DO: Always pull before editing

```bash
# Good:
Windows: Edit file.ts, commit, push
iPhone: Pull first, then edit file.ts
Result: Clean merge ✅
```

### ❌ DON'T: Commit to `main` branch directly

```bash
# Bad:
git checkout main
# Make changes
git commit
git push origin main  # ❌ Bypasses review
```

### ✅ DO: Use feature branches

```bash
# Good:
git checkout -b feature/my-work
# Make changes
git commit
git push origin feature/my-work
# Create PR for review ✅
```

### ❌ DON'T: Use `git pull` without rebase

```bash
# Bad (creates unnecessary merge commits):
git pull origin main

# Good (linear history):
git pull --rebase origin main
```

---

## 🆘 Emergency: "I Have a Merge Conflict"

```bash
# 1. Don't panic! See what files have conflicts:
git status

# 2. Open each conflicted file, look for:
<<<<<<< HEAD
Your changes (current branch)
=======
Incoming changes (other branch)
>>>>>>> branch-name

# 3. Fix the conflict (keep what you want, delete the markers)

# 4. Mark as resolved:
git add <fixed-file>

# 5. Complete the merge:
git commit -m "chore: Resolve merge conflict between Windows and iPhone edits"

# 6. Push:
git push origin <your-branch>
```

---

## 🔧 Windows-Specific Setup (Recommended)

Run these **once** on your Windows Git Bash:

```bash
# 1. Respect case sensitivity
git config core.ignorecase false

# 2. Auto-convert line endings (already done by .gitattributes, but doesn't hurt)
git config core.autocrlf true

# 3. Set your identity (optional - see full guide)
git config user.name "mocamGitHub"
git config user.email "51081515+mocamGitHub@users.noreply.github.com"
```

---

## 📱 iPhone/Linux Notes

- **Ephemeral container** - Git config may reset between Claude Code sessions
- **Auto-commits** - Claude Code commits automatically when tasks complete
- **No working directory state** - Everything must be synced via Git
- **Identity:** Commits show as `Claude <noreply@anthropic.com>` (this is fine!)

---

## 🎯 Quick Checklist

Before switching environments:

- [ ] All changes committed
- [ ] All commits pushed to remote
- [ ] No uncommitted files (`git status` clean)
- [ ] On correct branch (not `main` directly)

After switching environments:

- [ ] Pull latest changes first
- [ ] Verify you're on correct branch
- [ ] Check no conflicts (`git status`)

---

## 📚 Full Documentation

For complete details, see:
- **`GIT_CROSS_PLATFORM_GUIDE.md`** - Comprehensive guide (65+ pages)
- **`.gitattributes`** - Line ending configuration (automatically applied)

---

## 🎉 Bottom Line

**You're safe!** With the `.gitattributes` file in place:

✅ Line endings will automatically normalize
✅ Files won't show as "changed" when they're not
✅ Binary files won't be corrupted
✅ Cross-platform development will be smooth

**Just remember:**
1. Pull before starting work
2. Push when done
3. Don't work on same files simultaneously without pulling first

---

**Created:** 2025-10-21
**Environment:** Linux (iPhone via Claude Code)
**Status:** ✅ Ready for cross-platform development
