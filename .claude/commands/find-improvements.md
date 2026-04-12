---
description: Audit the codebase with specialist agents to discover new improvements, then prioritize and add them to IMPROVEMENTS.md
---

focus_areas = $ARGUMENTS

## Phase 1: Understand current state

1. Read `IMPROVEMENTS.md` at the project root.
2. Read `CLAUDE.md` for project architecture rules.
3. Collect all existing findings: **Active Findings** items and **Completed Fixes (History)** items.
4. Determine the next available finding number (highest existing number + 1).
5. If `focus_areas` is provided, note it — agents will focus their investigation on those areas. Otherwise, agents perform a general audit.

## Phase 2: Spawn investigation agents

Spawn the following specialist agents **in parallel** using the **Agent** tool. Each agent gets a read-only investigation prompt — they must NOT edit any files, only report findings.

Split into three parallel batches to avoid overwhelming context:

### Batch 1 — Architecture, Security, Performance, Types

Spawn these 4 agents in a single message:

1. **architect-reviewer** (`subagent_type: "architect-reviewer"`)
   Focus: module boundaries, dependency flow between modules, controller/service/repository layering violations, shared code placement, unnecessary coupling, circular dependencies, NestJS module organization.

2. **security-auditor** (`subagent_type: "security-auditor"`)
   Focus: authentication/authorization patterns, JWT handling, guard coverage, input validation gaps, SQL injection via Drizzle misuse, CORS configuration, rate limiting, password hashing, cookie/token security, middleware patterns.

3. **performance-engineer** (`subagent_type: "performance-engineer"`)
   Focus: N+1 query patterns, missing database indexes, unnecessary eager loading, Redis cache strategy gaps, connection pool tuning, query optimization, pagination efficiency, memory leaks, response payload size.

4. **typescript-pro** (`subagent_type: "typescript-pro"`)
   Focus: `any` usage, missing strict checks, unsafe casts, untyped API boundaries, generic opportunities, discriminated union gaps, type coverage holes, `import type` violations, Drizzle schema type safety.

### Batch 2 — Database, NestJS, API Design

Spawn these 3 agents in a single message:

5. **postgres-pro** (`subagent_type: "postgres-pro"`)
   Focus: schema design issues, missing constraints, index optimization, migration safety, transaction usage, query performance, normalization problems, enum management, trigger usage, connection pooling.

6. **nestjs-expert** (`subagent_type: "nestjs-expert"`)
   Focus: module patterns, dependency injection issues, guard/interceptor/pipe usage, lifecycle hooks, exception filters, custom decorators, provider scopes, async configuration, testing patterns.

7. **api-designer** (`subagent_type: "api-designer"`)
   Focus: REST endpoint design, response shape consistency, error response format, pagination patterns, Swagger/Scalar documentation completeness, DTO validation coverage, HTTP status code correctness, API versioning.

### Batch 3 — Database Optimization, Dependencies, Refactoring

Spawn these 3 agents in a single message:

8. **database-optimizer** (`subagent_type: "database-optimizer"`)
   Focus: slow query patterns, missing indexes, join optimization, materialized view opportunities, query plan analysis, batch operation patterns, deadlock risks, vacuum/analyze needs.

9. **dependency-manager** (`subagent_type: "dependency-manager"`)
   Focus: outdated packages, duplicate dependencies, unused dependencies, version pinning compliance (no ^ or ~), security vulnerabilities, bundle size impact, peer dependency mismatches.

10. **refactoring-specialist** (`subagent_type: "refactoring-specialist"`)
    Focus: code duplication across modules, long functions, complex conditionals, dead code, naming issues (functions must start with verbs), module cohesion, repository method consolidation.

### Agent prompt template

Each agent receives this prompt (with its specific focus area inserted):

```text
You are investigating the tracker-backend-api NestJS project for improvement opportunities.

**Your role:** {agent_name}
**Focus areas:** {focus_description}
{if focus_areas: "**User-specified focus:** " + focus_areas}

**Project context:**
- NestJS 11, Drizzle ORM, PostgreSQL 15, Redis 7, TypeScript (strict), ESM
- JWT + Passport (auth), Zod (env validation), class-validator (DTO validation)
- Swagger + Scalar (API docs), Pino (logging), SWC (compilation)
- Architecture: Controllers -> Services -> Repositories (only repos touch DB via Drizzle)
- Path alias: @/* maps to src/*
- Shared enums derive from Drizzle schema enums as single source of truth

**Rules:**
- Do NOT edit any files. Read-only investigation.
- Do NOT report issues that are already tracked (see list below).
- Each finding must reference specific files and line numbers.
- Rate each finding: Impact (1-5, where 5 = critical), Effort (S/M/L).
- Be concrete — "improve performance" is not a finding. "Add composite index on (userId, createdAt) to transactions table in src/database/schemas/transactions.ts:15 to optimize dashboard query" is.

**Already tracked or completed — do NOT re-report these:**
{list of all existing finding titles from Active Findings and Completed Fixes}

**Output format (strictly follow this):**

For each finding, output:

### Finding: {short title}
**Impact:** {1-5} | **Effort:** {S/M/L} | **Agent:** {your agent name}
**Files:** {file paths with line numbers}
**Problem:** {1-2 sentence description}
**Action:** {concrete fix instruction}

If you find nothing new, respond with "No new findings."
```

## Phase 3: Collect and deduplicate

1. Wait for all agents to complete.
2. Collect all findings from all agent reports.
3. Deduplicate: if two agents report the same underlying issue, merge them — keep the more specific description and note both agents.
4. Remove any findings that match already-tracked items (double-check against Phase 1 list).

## Phase 4: Prioritize and organize

1. Sort findings by Impact (descending), then by Effort (S before M before L).
2. Assign sequential finding numbers starting from the next available number.
3. Group findings into suggested sprint batches:
   - Group by theme (security, performance, DX, etc.)
   - Within each group, order by impact \* effort efficiency
4. Present the findings to the user in a summary table:

```md
## New Findings: {count} improvements discovered

| #   | Task | Impact | Effort | Agent(s) |
| --- | ---- | ------ | ------ | -------- |
| ... | ...  | ...    | ...    | ...      |

Suggested sprint grouping:

- **Batch A — {theme}:** #n1, #n2, ...
- **Batch B — {theme}:** #n3, #n4, ...
```

5. Use **AskUserQuestion** to confirm:
   > "Found {count} new improvements. Add all to IMPROVEMENTS.md?"
   - Options: "Add all", "Let me pick", "Cancel"
   - If "Let me pick", ask which finding numbers to include.
   - If "Cancel", stop.

## Phase 5: Update IMPROVEMENTS.md

1. For each accepted finding, add a row to the **## Active Findings** table with Status = "Todo". The table columns are: `| # | Priority | Finding | Effort | Impact | Agent(s) | Status |`. Use priority labels (P1-P4) and textual impact (Critical/High/Medium/Low).
2. For each accepted finding, add a detailed entry under **## Active Findings (Detailed)**, grouped under the appropriate priority heading. Follow the existing format exactly:

   ```md
   ### P{n} -- {Impact}

   #### {number}. {title}

   **Effort:** {effort} | **Impact:** {impact} | **Reported by:** {agent_name}

   {problem description}

   **Fix:** {concrete fix instruction}

   **File:** `{file_path}:{line_number}`

   ---
   ```

   Priority mapping: Impact Critical = P0, High = P1, Medium = P2, Low = P3.
   If a priority group heading (e.g. `### P1 -- High`) already exists, append the entry under it rather than creating a duplicate heading.

3. Update the **Recommended Execution Order** section with new sprint groupings appended.
4. Update the `> Updated:` date at the top to today's date, and append any new agent names to the `Analyzed by:` list.
5. Run `pnpm format` to format the file.

## Phase 6: Wrap up

Present a summary:

```md
## Audit Complete

**Agents deployed:** {count}
**New findings added:** {count}
**Next step:** Run `/fix-improvements {numbers}` to implement.
```
