# Model Context Protocol (MCP) Integration for EZ Cycle Ramp

**Last Updated:** 2025-10-22

This guide covers MCP (Model Context Protocol) server integration with Claude Code to enhance development productivity for the EZ Cycle Ramp project.

---

## 🎯 What is MCP?

**Model Context Protocol (MCP)** is an open standard that enables Claude Code to connect to external tools, databases, and services. Think of it as "USB-C for AI" - a universal way to extend Claude Code's capabilities.

**Released:** November 2024 (open-source)
**Adoption:** OpenAI, Google DeepMind, and other major AI providers

---

## 🚀 Why Use MCP with EZ Cycle?

### Without MCP
- Manual database queries
- Copy-paste between GitHub and terminal
- Context switching between tools
- Limited real-time data access

### With MCP
- Natural language database operations
- Automated GitHub workflows
- Direct API integrations
- Real-time documentation access
- Seamless tool integration

---

## 📊 Recommended MCPs for EZ Cycle

### Priority 1: Essential (Implement First)

| MCP Server | Purpose | EZ Cycle Use Case |
|------------|---------|-------------------|
| **Supabase** | Database access | Query/update products, orders, configurations |
| **GitHub** | Repository management | Automate PRs, issues, CI workflows |

### Priority 2: Enhanced Productivity

| MCP Server | Purpose | EZ Cycle Use Case |
|------------|---------|-------------------|
| **Postgres** | Direct DB access | Advanced database operations |
| **Fetch** | Web content | Access documentation, research |
| **Slack** | Team communication | Status updates, notifications |

### Priority 3: Nice-to-Have

| MCP Server | Purpose | EZ Cycle Use Case |
|------------|---------|-------------------|
| **Figma** | Design access | Import design specs |
| **Puppeteer** | Browser automation | E2E testing, screenshots |
| **Stripe** | Payment integration | Transaction queries |
| **Context7** | Documentation | Real-time docs access |

---

## 🛠️ Setup Instructions

### Prerequisites

1. Claude Code installed and running
2. EZ Cycle repository cloned
3. Terminal access

### General MCP Setup

MCP servers are configured through Claude Code's settings. There are two methods:

#### Method 1: Using `claude mcp` command (Recommended)

```bash
# Add MCP server with JSON configuration
claude mcp add-json '<server-config-json>'

# List installed MCP servers
claude mcp list

# Remove an MCP server
claude mcp remove <server-name>
```

#### Method 2: Manual Configuration

Edit your Claude Code configuration file:
- **Location:** `~/.config/claude/config.json` (Linux/Mac)
- **Windows:** `%APPDATA%\Claude\config.json`

---

## 🗄️ Supabase MCP Setup

### Why Supabase MCP?

Direct database access through natural language:
- Query products, orders, configurations
- Analyze customer data
- Generate reports
- Update schema
- No manual SQL needed

### Installation

```bash
# Install Supabase MCP server
claude mcp add-json '{
  "name": "supabase",
  "description": "Supabase database integration",
  "command": "npx",
  "args": [
    "-y",
    "@modelcontextprotocol/server-postgres",
    "postgresql://postgres:[password]@[host]:[port]/[database]"
  ]
}'
```

### Configuration for EZ Cycle

Your Supabase connection details (from `.env` or Supabase dashboard):

```bash
# Get from your .env file
SUPABASE_URL=https://[your-project].supabase.co
SUPABASE_ANON_KEY=[your-anon-key]
DATABASE_URL=postgresql://postgres:[password]@[host]:5432/postgres
```

**Example Configuration:**

```json
{
  "name": "ezcr-supabase",
  "description": "EZ Cycle Ramp Supabase Database",
  "command": "npx",
  "args": [
    "-y",
    "@modelcontextprotocol/server-postgres",
    "postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT.supabase.co:5432/postgres"
  ]
}
```

### Usage Examples

Once configured, you can ask Claude Code:

```
"Show me all orders from the last 30 days"
"What are the top 5 most configured ramp sizes?"
"Update the price of product ID 123 to $399.99"
"Show me the schema for the configurations table"
"How many users signed up this week?"
```

Claude Code will automatically query your Supabase database and return results.

---

## 🐙 GitHub MCP Setup

### Why GitHub MCP?

Streamline repository management:
- Create/update issues and PRs
- Manage labels and milestones
- Trigger CI workflows
- Review code
- Automate repetitive tasks

### Installation

```bash
# Install GitHub MCP server
claude mcp add-json '{
  "name": "github",
  "description": "GitHub repository integration",
  "command": "npx",
  "args": [
    "-y",
    "@modelcontextprotocol/server-github"
  ],
  "env": {
    "GITHUB_TOKEN": "YOUR_GITHUB_TOKEN"
  }
}'
```

### Get GitHub Token

1. Go to GitHub Settings → Developer settings → Personal access tokens
2. Generate new token (classic)
3. Select scopes:
   - `repo` (full repository access)
   - `workflow` (trigger workflows)
   - `read:org` (read organization data)
4. Copy token

### Configuration for EZ Cycle

```json
{
  "name": "ezcr-github",
  "description": "EZ Cycle GitHub Repository",
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
```

### Usage Examples

```
"Create an issue for implementing 3D ramp configurator"
"List all open PRs"
"Add label 'enhancement' to issue #42"
"Show recent commits on main branch"
"Trigger the deployment workflow"
```

---

## 🌐 Fetch MCP Setup (Web Content)

### Why Fetch MCP?

Access web documentation and resources:
- Read API documentation
- Research best practices
- Fetch library docs
- Access tutorials

### Installation

```bash
claude mcp add-json '{
  "name": "fetch",
  "description": "Web content fetcher",
  "command": "npx",
  "args": [
    "-y",
    "@modelcontextprotocol/server-fetch"
  ]
}'
```

### Usage Examples

```
"Fetch the latest Next.js 15 documentation on API routes"
"Get the Stripe API docs for creating payment intents"
"Read the Supabase Row Level Security guide"
```

---

## 💬 Slack MCP Setup (Team Communication)

### Why Slack MCP?

Integrate team communication:
- Send status updates
- Post deployment notifications
- Share progress with team
- Alert on errors

### Installation

```bash
claude mcp add-json '{
  "name": "slack",
  "description": "Slack team integration",
  "command": "npx",
  "args": [
    "-y",
    "@modelcontextprotocol/server-slack"
  ],
  "env": {
    "SLACK_BOT_TOKEN": "xoxb-YOUR-TOKEN",
    "SLACK_TEAM_ID": "YOUR_TEAM_ID"
  }
}'
```

### Get Slack Token

1. Go to api.slack.com/apps
2. Create new app (from scratch)
3. Add Bot Token Scopes:
   - `chat:write`
   - `channels:read`
   - `users:read`
4. Install app to workspace
5. Copy Bot User OAuth Token

### Usage Examples

```
"Post to #dev-channel: Deployed new configurator feature"
"Send message to @john: PR #123 is ready for review"
```

---

## 🎨 Figma MCP Setup (Design Integration)

### Why Figma MCP?

Access design specifications:
- Extract design tokens
- Get component specs
- Export assets
- Design-to-code workflow

### Installation

```bash
claude mcp add-json '{
  "name": "figma",
  "description": "Figma design integration",
  "command": "npx",
  "args": [
    "-y",
    "@modelcontextprotocol/server-figma"
  ],
  "env": {
    "FIGMA_TOKEN": "YOUR_FIGMA_TOKEN"
  }
}'
```

### Get Figma Token

1. Go to Figma Settings → Account
2. Generate personal access token
3. Copy token

---

## 🧪 Puppeteer MCP Setup (Browser Automation)

### Why Puppeteer MCP?

Automate browser tasks:
- E2E testing
- Screenshot generation
- Form testing
- Performance monitoring

### Installation

```bash
claude mcp add-json '{
  "name": "puppeteer",
  "description": "Browser automation",
  "command": "npx",
  "args": [
    "-y",
    "@modelcontextprotocol/server-puppeteer"
  ]
}'
```

### Usage Examples

```
"Take a screenshot of the configurator page"
"Test the checkout flow and report any errors"
"Check page load performance"
```

---

## 📋 Complete Setup Checklist

### Phase 1: Essential (Week 1)
- [ ] Install Supabase MCP
- [ ] Configure database connection
- [ ] Test database queries
- [ ] Install GitHub MCP
- [ ] Generate GitHub token
- [ ] Test repository operations

### Phase 2: Enhanced (Week 2)
- [ ] Install Fetch MCP for documentation
- [ ] Install Slack MCP (if using Slack)
- [ ] Configure team channels

### Phase 3: Advanced (Optional)
- [ ] Install Figma MCP (if using Figma)
- [ ] Install Puppeteer MCP for testing
- [ ] Explore additional MCPs

---

## 🎯 Practical Use Cases for EZ Cycle

### Use Case 1: Product Management

**Without MCP:**
1. Open Supabase dashboard
2. Navigate to table editor
3. Manually write SQL query
4. Copy results
5. Update code

**With Supabase MCP:**
```
You: "Show me all products with price > $500"
Claude: [Queries database and shows results]

You: "Update product 'Premium Ramp' to $449.99"
Claude: [Executes update and confirms]
```

### Use Case 2: GitHub Workflow

**Without MCP:**
1. Switch to browser
2. Navigate to GitHub
3. Create issue manually
4. Add labels
5. Assign team member
6. Switch back to IDE

**With GitHub MCP:**
```
You: "Create issue: Add 3D ramp configurator, label: enhancement, assign to @john"
Claude: [Creates issue with all details]
```

### Use Case 3: Database Analysis

```
You: "What's the most popular ramp configuration this month?"
Claude: [Analyzes configurations table and provides insights]

You: "Show me customer conversion rate by traffic source"
Claude: [Joins tables and calculates metrics]
```

### Use Case 4: Deployment Automation

```
You: "Check if all tests pass, then deploy to staging, and notify #dev channel"
Claude: [Runs tests, deploys if passing, posts to Slack]
```

---

## 🔒 Security Best Practices

### 1. Token Management
- **Never commit tokens** to git
- Store in environment variables or secure vaults
- Use read-only tokens when possible
- Rotate tokens regularly

### 2. Database Access
- Use connection strings with least privileges
- Enable Row Level Security (RLS)
- Monitor query logs
- Set query timeouts

### 3. GitHub Tokens
- Limit scope to necessary permissions
- Use separate tokens for different environments
- Enable SSO if available
- Audit token usage

---

## 🐛 Troubleshooting

### MCP Server Not Found

**Error:** `MCP server 'supabase' not found`

**Solution:**
```bash
# List installed MCPs
claude mcp list

# Re-add the MCP
claude mcp add-json '{...}'
```

### Connection Timeout

**Error:** `Connection to database timed out`

**Solution:**
- Check database URL is correct
- Verify network connectivity
- Check firewall settings
- Confirm Supabase project is running

### Authentication Failed

**Error:** `Authentication failed for GitHub MCP`

**Solution:**
- Regenerate GitHub token
- Check token has correct scopes
- Update MCP configuration
- Restart Claude Code

---

## 📊 Performance Considerations

### Database Queries
- Use indexes for frequently queried columns
- Limit result sets (add LIMIT clauses)
- Cache results when appropriate
- Monitor query execution time

### MCP Response Times
- Typical response: 500ms - 2s
- Network latency can affect performance
- Consider using MCP for async operations
- Don't use MCP for time-critical operations

---

## 🎓 Learning Resources

### Official Documentation
- MCP Specification: https://modelcontextprotocol.io
- Claude Code MCP Guide: https://docs.claude.com/claude-code/mcp

### Community Resources
- Claude MCP Community: https://www.claudemcp.com
- MCP Server Registry: https://github.com/modelcontextprotocol/servers
- Example Implementations: https://github.com/topics/mcp-server

---

## 🔄 Updates and Maintenance

### Check for Updates

```bash
# Update MCP server packages
npx -y @modelcontextprotocol/server-postgres@latest
npx -y @modelcontextprotocol/server-github@latest
```

### Monitor Usage

Track how MCPs improve your workflow:
- Time saved on database queries
- Reduction in context switching
- Faster issue/PR creation
- Improved code analysis

---

## 🎉 Next Steps

1. **Start with Supabase MCP** - Immediate productivity boost
2. **Add GitHub MCP** - Streamline repository management
3. **Experiment with natural language queries** - Find your workflow
4. **Share with team** - Document team-specific use cases
5. **Iterate** - Add more MCPs as needs arise

---

## 📞 Support

For MCP-related questions:
- Check official MCP documentation
- Review troubleshooting section above
- Search GitHub issues for specific servers
- Ask in Claude Code community

For EZ Cycle-specific integration:
- Review this guide's use cases
- Test with non-production databases first
- Document your team's MCP workflows

---

**Ready to supercharge your development workflow?** Start with the Supabase MCP setup above! 🚀

---

*Created for EZ Cycle Ramp project • 2025*
*Model Context Protocol integration guide*
