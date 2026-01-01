# Ralph Installation Guide

Ralph is a Claude Code loop orchestrator that helps manage multi-step implementations.

## Prerequisites

- Git Bash, WSL, or a Unix-like shell environment
- Claude Code CLI installed

## Installation Steps

### Option 1: WSL (Windows Subsystem for Linux)

```bash
# In WSL terminal
git clone https://github.com/frankbria/ralph-claude-code /tmp/ralph-install
cd /tmp/ralph-install
./install.sh
```

### Option 2: Git Bash (Windows)

```bash
# In Git Bash
git clone https://github.com/frankbria/ralph-claude-code /tmp/ralph-install
cd /tmp/ralph-install
./install.sh
```

### Option 3: Manual Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/frankbria/ralph-claude-code ~/ralph
   ```

2. Add to PATH in your shell profile (`~/.bashrc`, `~/.zshrc`, etc.):
   ```bash
   export PATH="$HOME/ralph:$PATH"
   ```

3. Reload shell:
   ```bash
   source ~/.bashrc  # or ~/.zshrc
   ```

## Verification

```bash
ralph --version
```

## Usage

See `docs/combined/RALPH_RUN.md` for recommended commands and thrash-prevention rules.
