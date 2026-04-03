---
description: 'End-to-end: fetch GitHub issue, propose fix, implement, archive, and create PR — with user approval at each step'
---

issue_url_or_number = $ARGUMENTS

If issue_url_or_number is not provided, ask for it.

This command runs the full issue-to-PR pipeline with user confirmation gates between each phase.

**Steps**

## Phase 1: Fetch and analyze the GitHub issue

1. Fetch the issue using `gh issue view <issue_url_or_number>`.
2. Extract the issue number, title, body, and labels.
3. Analyze the issue to understand what needs to be done.
4. Present a brief summary to the user:

```
## Issue #<number>: <title>

<1-3 sentence summary of what needs to be done>
```

5. Use **AskUserQuestion** to ask:
   > "Ready to proceed to the proposal phase? You can also provide additional context or constraints."
   - Options: "Proceed to proposal", "Cancel"
   - If cancelled, stop and explain how to resume manually.

## Phase 2: Propose the fix with /opsx:propose

1. Use the **Skill tool** to invoke `opsx:propose` with a description derived from the issue analysis. Include the issue number, title, problem description, and any suggested approach from the issue body.

2. After the proposal is complete, use **AskUserQuestion** to ask:
   > "Proposal artifacts created. Review them and confirm to proceed to implementation."
   - Options: "Proceed to implementation", "Let me review first (pause)", "Cancel"
   - If "Let me review first", stop and tell the user to run `/fix-issue continue` or `/opsx:apply` when ready.
   - If cancelled, stop.

## Phase 3: Implement with /opsx:apply

1. Use the **Skill tool** to invoke `opsx:apply`. The change name should be inferred from the proposal phase context.

2. After implementation is complete, use **AskUserQuestion** to ask:
   > "Implementation complete. Ready to archive and create a PR?"
   - Options: "Proceed to archive + PR", "Let me test first (pause)", "Cancel"
   - If "Let me test first", stop and tell the user to run `/fix-issue finalize <issue_number>` or manually run `/opsx:archive` then `/create-pr`.
   - If cancelled, stop.

## Phase 4: Archive with /opsx:archive

1. Use the **Skill tool** to invoke `opsx:archive`. The change name should be inferred from context.

## Phase 5: Create PR that closes the issue

1. Analyze all current changes (staged, unstaged, and untracked).
2. Generate a short kebab-case branch slug from the change.
3. Create and checkout a new branch named `TRACK-<issue_number>/<branch-slug>`.
4. Stage ALL changes (modified, deleted, and untracked files).
5. Generate a conventional commit message referencing the issue: include `(#<issue_number>)` in the commit message.
6. Commit with the generated message.
7. Push the branch to origin with `-u` flag.
8. Create a PR using `gh pr create` with:
   - Title: the commit message
   - Body format:

```
Closes #<issue_number>

## Summary
<bullet points summarizing the changes>

## Test plan
<checklist of testing steps>
```

9. Return the PR URL.

**Output on completion**

```
## Pipeline Complete

**Issue:** #<number> — <title>
**Change:** <change-name>
**PR:** <pr-url>

The PR references and will auto-close issue #<number> on merge.
```

**Guardrails**

- Always gate each phase with user confirmation before proceeding
- If any phase fails, stop and report the error — do not skip phases
- The user can interrupt at any confirmation gate to review, test, or adjust
- Pass context between phases naturally (issue details, change name, etc.)
- Do not proceed past a "Cancel" or "pause" response
