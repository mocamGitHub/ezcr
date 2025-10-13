# Complete Git Commit, Handoff, Clear, and Resume

Please perform the following sequence:

1. **Git Status Check**: Show me what files have changed

2. **Create Git Commit**: 
   - Stage all changes
   - Create a descriptive commit message summarizing the Native CRM frontend implementation
   - Include the Claude Code generated message footer

3. **Create Session Handoff Document**: Create or update `SESSION_HANDOFF.md` with:
   - Current date and time
   - Summary of what was completed in this session
   - Current status of all work
   - Git commit hash
   - Dev server status
   - Next recommended actions
   - How to resume work after /clear

4. **Push to Remote**: Push the commit to the remote repository

5. **Show Resume Instructions**: Display the exact commands needed to resume work after running /clear:
   - How to read the handoff document
   - How to restart the dev server if needed
   - Which file to review first

Do not actually run /clear - just prepare everything so I can manually run /clear and then resume using the instructions you provide.
