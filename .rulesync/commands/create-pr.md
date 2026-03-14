---
description: Create a branch, commit all changes, push, and create a PR
---

ticket_number = $ARGUMENTS

If ticket_number is not provided, ask for it.

Follow these steps in order:

1. Analyze all current changes (staged, unstaged, and untracked) to understand what was done.
2. Generate a short kebab-case branch slug summarizing the changes (e.g. `setup-ci-cd`, `add-auth-module`).
3. Create and checkout a new branch named `TRACK-<ticket_number>/<branch-slug>`.
4. Stage ALL changes (modified, deleted, and untracked files).
5. Generate an appropriate conventional commit message based on the changes.
6. Commit with the generated message.
7. Push the branch to origin with `-u` flag.
8. Create a pull request against `main` using GitHub MCP tools or `gh` CLI:
   - Title: the commit message
   - Body: generate a summary of changes with a test plan, using this format:

```
## Summary
<bullet points summarizing the changes>

## Test plan
<checklist of testing steps>
```

Return the PR URL when done.
