# GitHub MCP Setup for EZ Cycle Ramp

**Complete guide to setting up GitHub Model Context Protocol integration with Claude Code**

---

## 🎯 What You'll Achieve

After setup, you can manage your GitHub repository using natural language:

```
You: "Create an issue for adding 3D ramp configurator"
Claude: ✓ Created issue #47: "Add 3D ramp configurator"

You: "List all open PRs"
Claude: [Shows list of open pull requests]

You: "Add label 'enhancement' to issue #47"
Claude: ✓ Label added

You: "Show commits from the last week"
Claude: [Displays recent commits]
```

No more switching to browser, navigating GitHub UI!

---

## 📋 Prerequisites

- [ ] Claude Code installed and running
- [ ] GitHub account with access to EZ Cycle Ramp repository
- [ ] Repository: `mocamGitHub/ezcr`

---

## 🔑 Step 1: Create GitHub Personal Access Token

### Navigate to GitHub Settings

1. Go to GitHub.com
2. Click your profile picture (top right)
3. Select **Settings**
4. Scroll to **Developer settings** (bottom left)
5. Click **Personal access tokens** → **Tokens (classic)**
6. Click **Generate new token** → **Generate new token (classic)**

### Configure Token

**Note/Description:**
```
Claude Code MCP - EZ Cycle Ramp
```

**Expiration:**
- Choose 90 days or custom
- Set calendar reminder to regenerate before expiration

**Select Scopes:**

Required scopes for full functionality:

- [x] `repo` - Full control of private repositories
  - [x] repo:status
  - [x] repo_deployment
  - [x] public_repo
  - [x] repo:invite
  - [x] security_events

- [x] `workflow` - Update GitHub Action workflows

- [x] `write:packages` - Upload packages to GitHub Package Registry (optional)

- [x] `read:org` - Read org and team membership (if using org)

- [x] `project` - Full control of projects (optional)

### Generate and Copy Token

1. Click **Generate token** (bottom)
2. **IMMEDIATELY COPY THE TOKEN** (you can't see it again!)
3. Store securely (password manager recommended)

**Example token format:**
```
ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## 🛠️ Step 2: Install GitHub MCP Server

### Method 1: Using Claude Code CLI (Recommended)

Open your terminal and run:

```bash
# Replace YOUR_GITHUB_TOKEN with your actual token
claude mcp add-json '{
  "name": "ezcr-github",
  "description": "EZ Cycle Ramp GitHub Repository",
  "command": "npx",
  "args": [
    "-y",
    "@modelcontextprotocol/server-github"
  ],
  "env": {
    "GITHUB_TOKEN": "ghp_YOUR_TOKEN_HERE",
    "GITHUB_OWNER": "mocamGitHub",
    "GITHUB_REPO": "ezcr"
  }
}'
```

### Method 2: Manual Configuration

Edit Claude Code's configuration file:

**Linux/Mac:** `~/.config/claude/config.json`
**Windows:** `%APPDATA%\Claude\config.json`

Add to the `mcpServers` section:

```json
{
  "mcpServers": {
    "ezcr-github": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-github"
      ],
      "env": {
        "GITHUB_TOKEN": "ghp_YOUR_TOKEN_HERE",
        "GITHUB_OWNER": "mocamGitHub",
        "GITHUB_REPO": "ezcr"
      }
    }
  }
}
```

---

## ✅ Step 3: Verify Installation

### Check MCP is Installed

```bash
claude mcp list
```

You should see:
```
✓ ezcr-github - EZ Cycle Ramp GitHub Repository
```

### Test Connection

Start Claude Code and ask:

```
"Show me the repository information for EZ Cycle Ramp"
```

Expected response should include:
- Repository name
- Description
- Default branch
- Visibility (public/private)

---

## 💡 Practical Use Cases

### Use Case 1: Issue Management

**Create Issue:**
```
You: "Create an issue titled 'Add animation examples' with label 'documentation'"
Claude: ✓ Created issue #48
```

**List Issues:**
```
You: "Show me all open issues"
Claude: [Lists open issues with numbers and titles]
```

**Update Issue:**
```
You: "Add label 'high-priority' to issue #48"
Claude: ✓ Label added
```

**Close Issue:**
```
You: "Close issue #48"
Claude: ✓ Issue #48 closed
```

### Use Case 2: Pull Request Management

**List PRs:**
```
You: "Show all open pull requests"
Claude: [Lists PRs with numbers, titles, authors]
```

**PR Details:**
```
You: "Show me details of PR #12"
Claude: [Shows PR description, files changed, status]
```

**Review PR:**
```
You: "Show me the diff for PR #12"
Claude: [Shows code changes]
```

**Comment on PR:**
```
You: "Add comment to PR #12: 'LGTM, ready to merge'"
Claude: ✓ Comment added
```

### Use Case 3: Repository Insights

**Recent Commits:**
```
You: "Show commits from the last 7 days"
Claude: [Lists recent commits with messages]
```

**Branch Information:**
```
You: "List all branches"
Claude: [Shows all branches and their status]
```

**Contributors:**
```
You: "Who are the top contributors this month?"
Claude: [Shows commit statistics by author]
```

### Use Case 4: Labels and Milestones

**Create Label:**
```
You: "Create label 'animation' with color blue"
Claude: ✓ Label created
```

**List Labels:**
```
You: "Show me all repository labels"
Claude: [Lists all labels with colors]
```

**Create Milestone:**
```
You: "Create milestone 'v2.0 Release' due Dec 31, 2025"
Claude: ✓ Milestone created
```

### Use Case 5: Workflow Automation

**Trigger Workflow:**
```
You: "Trigger the deploy-staging workflow"
Claude: ✓ Workflow triggered
```

**Check Workflow Status:**
```
You: "Show status of latest workflow runs"
Claude: [Shows recent workflow executions]
```

---

## 🎯 EZ Cycle Specific Workflows

### Feature Development Workflow

**Start Feature:**
```
You: "Create issue for 3D configurator feature"
Claude: ✓ Created issue #50

You: "Add labels 'enhancement' and 'high-priority' to issue #50"
Claude: ✓ Labels added
```

**During Development:**
```
You: "Show commits on claude/3d-configurator branch"
Claude: [Lists commits on feature branch]
```

**Ready for Review:**
```
You: "Create PR from claude/3d-configurator to main"
Claude: ✓ Created PR #51

You: "Add reviewer @teamlead to PR #51"
Claude: ✓ Reviewer added
```

### Bug Fix Workflow

**Report Bug:**
```
You: "Create issue: Cart not updating quantity, add label 'bug'"
Claude: ✓ Created issue #52 with bug label
```

**Track Fix:**
```
You: "Show all open bugs"
Claude: [Lists issues with 'bug' label]
```

**Verify Fix:**
```
You: "Show files changed in PR #53"
Claude: [Shows modified files]

You: "Close issue #52 with comment 'Fixed in PR #53'"
Claude: ✓ Issue closed with comment
```

### Release Workflow

**Pre-Release:**
```
You: "Show all issues in milestone 'v2.0 Release'"
Claude: [Lists milestone issues]

You: "Create issue checklist for v2.0 release tasks"
Claude: ✓ Issue created with checklist
```

**Release Day:**
```
You: "Show diff between main and release-v2.0 branch"
Claude: [Shows changes to be released]

You: "Create release tag v2.0.0 from main branch"
Claude: ✓ Release created
```

---

## 🔒 Security Best Practices

### 1. Token Storage

**❌ Never:**
- Commit token to git
- Share token in public channels
- Use same token for multiple services

**✅ Always:**
- Store in secure location (password manager)
- Use environment variables
- Rotate tokens regularly
- Set expiration dates

### 2. Token Permissions

**Principle of Least Privilege:**
- Only grant necessary scopes
- Use read-only tokens when possible
- Create separate tokens for different purposes

**Example:**
```bash
# Read-only token for analysis
Scopes: repo:status, public_repo, read:org

# Full access token for automation
Scopes: repo, workflow, project
```

### 3. Token Rotation

Set calendar reminders to:
- Regenerate tokens before expiration
- Review token usage
- Revoke unused tokens

---

## 🧪 Testing Your Setup

### Test 1: Repository Info

```
Ask Claude: "Show me the EZ Cycle repository details"
```

Expected: Repository name, description, stars, forks

### Test 2: Issue Creation

```
Ask Claude: "Create a test issue titled 'MCP Testing'"
```

Expected: Issue created successfully (then delete it)

### Test 3: List Operations

```
Ask Claude: "List all branches in the repository"
```

Expected: List of all branches

### Test 4: Read Operations

```
Ask Claude: "Show me the README file content"
```

Expected: README content displayed

---

## 🐛 Troubleshooting

### Error: "Authentication failed"

**Cause:** Invalid or expired token

**Solution:**
1. Generate new GitHub token
2. Update MCP configuration
3. Restart Claude Code

### Error: "Resource not found"

**Cause:** Incorrect repository owner/name

**Solution:**
Verify in MCP config:
```json
"GITHUB_OWNER": "mocamGitHub",  // ✓ Correct
"GITHUB_REPO": "ezcr"           // ✓ Correct
```

### Error: "Permission denied"

**Cause:** Token lacks required scope

**Solution:**
1. Check token scopes on GitHub
2. Regenerate token with correct scopes
3. Update MCP configuration

### Error: "Rate limit exceeded"

**Cause:** Too many API requests

**Solution:**
- Wait for rate limit reset (shown in error)
- Use authenticated requests (token should help)
- Reduce frequency of requests

---

## 📊 GitHub API Limits

### Rate Limits

**With Token:**
- 5,000 requests per hour
- Resets every hour

**Monitor Usage:**
```
You: "Show my current GitHub API rate limit status"
Claude: [Shows remaining requests and reset time]
```

### Best Practices

- Batch related operations
- Cache results when possible
- Use specific queries (not broad searches)

---

## 🎯 Advanced Usage

### Working with Multiple Repositories

Add separate MCPs for each repository:

```bash
# EZ Cycle main repo
claude mcp add-json '{
  "name": "ezcr-main",
  "env": {
    "GITHUB_OWNER": "mocamGitHub",
    "GITHUB_REPO": "ezcr"
  }
}'

# Documentation repo (if separate)
claude mcp add-json '{
  "name": "ezcr-docs",
  "env": {
    "GITHUB_OWNER": "mocamGitHub",
    "GITHUB_REPO": "ezcr-docs"
  }
}'
```

### Organization-Wide Operations

If you're part of an organization:

```
You: "Show all repositories in mocamGitHub organization"
Claude: [Lists all org repositories]

You: "Show my assigned issues across all repos"
Claude: [Lists issues assigned to you]
```

### Advanced Queries

**Find stale PRs:**
```
You: "Show PRs that haven't been updated in 30 days"
```

**Code frequency analysis:**
```
You: "Show commit activity by day of week"
```

**Contributor insights:**
```
You: "Who has the most commits this quarter?"
```

---

## 🔄 Updating Your Setup

### Change Token

```bash
# Remove old MCP
claude mcp remove ezcr-github

# Add with new token
claude mcp add-json '{
  "name": "ezcr-github",
  "env": {
    "GITHUB_TOKEN": "ghp_NEW_TOKEN_HERE",
    ...
  }
}'
```

### Add Additional Repositories

```bash
claude mcp add-json '{
  "name": "ezcr-docs",
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-github"],
  "env": {
    "GITHUB_TOKEN": "ghp_YOUR_TOKEN",
    "GITHUB_OWNER": "mocamGitHub",
    "GITHUB_REPO": "ezcr-docs"
  }
}'
```

---

## 📈 Measuring Impact

### Before GitHub MCP

**To create an issue:**
1. Open browser
2. Navigate to GitHub
3. Go to repository
4. Click Issues tab
5. Click New Issue
6. Fill form
7. Add labels manually
8. Submit
9. Switch back to IDE

**Time: ~2-3 minutes**

### After GitHub MCP

**To create an issue:**
```
You: "Create issue: Add feature X, labels: enhancement, high-priority"
```

**Time: ~10 seconds**

**Time saved: 90%+ on GitHub operations!**

---

## ✅ Setup Checklist

- [ ] Created GitHub personal access token
- [ ] Granted necessary scopes (repo, workflow)
- [ ] Stored token securely
- [ ] Installed GitHub MCP server
- [ ] Verified installation with `claude mcp list`
- [ ] Tested connection with sample query
- [ ] Tested issue creation
- [ ] Tested PR operations
- [ ] Set token expiration reminder
- [ ] Documented team workflows

---

## 🎉 You're All Set!

Your Claude Code can now interact with GitHub repositories using natural language.

**Next steps:**
1. Try the example workflows above
2. Create your own common operations
3. Automate repetitive GitHub tasks
4. Share useful commands with your team

---

## 📚 Common Commands Reference

### Issues

```
"Create issue: [title]"
"List open issues"
"Show issue #N"
"Close issue #N"
"Add label [label] to issue #N"
"Assign issue #N to @username"
"Add comment to issue #N: [comment]"
```

### Pull Requests

```
"List open PRs"
"Show PR #N"
"Create PR from [branch] to [branch]"
"Add reviewer @username to PR #N"
"Merge PR #N"
"Show files changed in PR #N"
```

### Repository

```
"List all branches"
"Show commits from [timeframe]"
"Show repository statistics"
"List contributors"
"Show recent activity"
```

### Labels & Milestones

```
"Create label [name] with color [color]"
"List all labels"
"Create milestone [name] due [date]"
"Show milestone [name] progress"
```

---

## 📞 Support

**GitHub MCP Issues:**
- Check MCP server docs: https://github.com/modelcontextprotocol/servers
- Review GitHub API docs: https://docs.github.com/en/rest

**Token Issues:**
- GitHub token settings: https://github.com/settings/tokens
- Regenerate if expired or compromised

**EZ Cycle Specific:**
- Review repository permissions
- Check organization settings
- Verify team access

---

*Happy automating! 🚀*

*EZ Cycle Ramp • GitHub MCP Setup Guide • 2025*
