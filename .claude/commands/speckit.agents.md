---
description: Generate optimal orchestration prompt for sub-agents based on project requirements
argument-hint: [optional-context]
allowed-tools: Write(*), Read(*), TodoWrite(*)
model: claude-sonnet-4-5-20250929
---

# 🤖 Spec-Kit Agents Orchestrator

Generate optimal orchestration prompt for sub-agents based on project complexity, tech stack, and tasks.

**Output:** Optimized prompt for `/implement` with agent selection, MCP strategy, and validation workflow.

**Purpose:** Maximize parallel execution, minimize context waste, ensure quality gates.

---

## Instructions

**Context:** $ARGUMENTS (optional - leave empty for auto-detection)

### Step 1: Analyze Project Requirements

Read these files:
- `.specify/memory/constitution.md` (features, scope, timeline)
- `specs/001-mvp/spec.md` (tech stack, architecture)
- `specs/001-mvp/tasks.md` (task count, complexity)
- `design/design-tokens.json` (design system ready?)

Extract:
- **Tech Stack:** Frontend framework, backend runtime, database
- **Task Count:** Total tasks from tasks.md
- **Complexity:** Simple (≤30 tasks) / Medium (31-70) / Complex (71+)
- **Special Requirements:** Auth, payments, real-time, AI features

### Step 2: Select Sub-Agents

**Base Agents (Always Needed):**

1. **backend-specialist**
   - Triggers: API endpoints, database, server logic
   - Tools: Write, Edit, Read, Bash
   - Context size: 150K tokens

2. **frontend-specialist**
   - Triggers: UI components, pages, client logic
   - Tools: Write, Edit, Read
   - Context size: 150K tokens
   - Must read: `design/design-tokens.json`

3. **testing-specialist**
   - Triggers: ALWAYS (E2E + unit tests required)
   - Tools: Write, Edit, Read, Bash
   - Context size: 100K tokens

**Optional Agents (Conditional):**

4. **devops-specialist**
   - Triggers: Custom deploy needs, CI/CD complex
   - Skip if: Vercel/Railway simple deploy
   - Context size: 80K tokens

5. **data-specialist**
   - Triggers: Complex data models (>10 tables), migrations
   - Skip if: Simple CRUD (<5 tables)
   - Context size: 100K tokens

**NOT Needed (Integrated in base agents):**
- ❌ security-specialist (in backend-specialist)
- ❌ scout-specialist (200K context sufficient)

### Step 3: Determine MCP Strategy

**Context7 (docs on-demand):**
```
Use for: Latest API docs, breaking changes
When: Agent needs specific library documentation
How: Just-in-time (lazy load), not upfront

Example:
- frontend-specialist needs Next.js 15 App Router docs → MCP call
- backend-specialist needs Supabase RLS syntax → MCP call
```

**ESLint (quality gates):**
```
Use for: Inline code quality validation
When: After each code generation batch
How: Automatic checkpoints every 10 tasks

Example:
- After T001-T010 completed → Run ESLint
- If errors → Fix before continuing
```

**Basic Memory (cross-project knowledge):**
```
Use for: Reusable patterns, lessons learned
When: Similar problem solved before
How: Query at planning phase, write at completion

Example:
- Query: "Supabase Auth patterns" → Read existing solutions
- Write: New patterns discovered → Save for future projects
```

### Step 4: Generate Orchestration Prompt

**Template Structure:**

```markdown
# [PROJECT_NAME] - Implementation Orchestration

**Generated:** [DATE] via /speckit.agents
**Total Tasks:** [COUNT] tasks
**Estimated Duration:** [X-Y hours]

---

## 🎯 MISSION

Implement [PROJECT_NAME] MVP following spec:
- Constitution: .specify/memory/constitution.md
- Technical Spec: specs/001-mvp/spec.md
- Task Breakdown: specs/001-mvp/tasks.md
- Design System: design/design-tokens.json

**Success Criteria:**
- ✅ All P0 tasks completed (must-have features)
- ✅ Build passes (pnpm build successful)
- ✅ Tests pass (E2E + unit >80% coverage)
- ✅ ESLint clean (no errors, warnings acceptable)
- ✅ Design tokens used (no hardcoded colors)

---

## 🤖 SUB-AGENTS ORCHESTRATION

### Agent 1: backend-specialist

**Focus:** API + Database + Authentication

**Scope:**
- Tasks: T001-T[BACKEND_COUNT] ([X]% of total)
- Files: src/server/, prisma/, api/
- Duration: [X-Y hours]

**MCP Tools Allowed:**
- context7 (Supabase docs, Prisma docs)
- eslint (code quality validation)

**Validation:**
- After every 10 tasks: Run `pnpm build` (API must compile)
- After database changes: Run `prisma generate` (types sync)
- Final: Run `pnpm test:api` (backend tests pass)

**Key Responsibilities:**
1. Database schema (Prisma/Drizzle)
2. API endpoints (REST or tRPC)
3. Authentication (Supabase Auth / NextAuth)
4. Business logic + validation (Zod schemas)

**Critical Rules:**
- ✅ Use design tokens for ANY UI (if admin panel)
- ✅ TypeScript strict mode (no `any` without justification)
- ✅ Validate ALL inputs with Zod
- ❌ NO hardcoded secrets (use env variables)
- ❌ NO SQL injection risks (use parameterized queries)

---

### Agent 2: frontend-specialist

**Focus:** UI Components + Pages + Client Logic

**Scope:**
- Tasks: T[BACKEND_COUNT+1]-T[FRONTEND_END] ([X]% of total)
- Files: pages/, components/, app/, styles/
- Duration: [X-Y hours]

**MCP Tools Allowed:**
- context7 (Next.js docs, shadcn/ui docs)
- eslint (code quality validation)

**Validation:**
- After every 10 tasks: Run `pnpm build` (frontend must compile)
- After component creation: Visual check (pnpm dev)
- Final: Run `pnpm test:e2e` (Playwright tests pass)

**Key Responsibilities:**
1. shadcn/ui components (install + customize)
2. Pages + routing (App Router / Pages Router)
3. Forms + validation (React Hook Form + Zod)
4. State management (TanStack Query / Zustand if needed)
5. Responsive design (mobile-first, Tailwind breakpoints)

**Critical Rules:**
- ✅ **ALWAYS use design-tokens.json** (read this file first!)
- ✅ CSS variables ONLY (e.g., `bg-primary-500`, NOT `bg-blue-600`)
- ✅ Accessible components (aria-labels, keyboard navigation)
- ❌ **NO hardcoded colors** (this breaks Design/Dev Decoupling)
- ❌ NO inline styles (use Tailwind classes)

**Design System:**
```typescript
// ✅ CORRECT (uses tokens)
<button className="bg-primary-500 text-neutral-50 font-heading rounded-md">
  Submit
</button>

// ❌ WRONG (hardcoded color)
<button className="bg-blue-600 text-white font-sans rounded-md">
  Submit
</button>
```

**Before you start:**
```bash
# 1. Read design tokens
cat design/design-tokens.json

# 2. Install shadcn/ui components (from components-list.md)
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card input form label ...

# 3. Verify tokens synced with Tailwind
cat tailwind.config.ts | grep "primary-500"
```

---

### Agent 3: testing-specialist

**Focus:** E2E Tests (Playwright) + Unit Tests (Vitest/Jest)

**Scope:**
- Tasks: T[TESTING_START]-T[TESTING_END] ([X]% of total)
- Files: tests/, e2e/, *.test.ts, playwright.config.ts
- Duration: [X-Y hours]

**MCP Tools Allowed:**
- context7 (Playwright docs, Vitest docs)

**Validation:**
- After each test suite: Run tests (pnpm test)
- Coverage check: >80% for backend, >60% for frontend
- Final: Run all tests (pnpm test:all)

**Key Responsibilities:**
1. E2E tests (user flows: signup, login, core features)
2. Unit tests (business logic, utilities, hooks)
3. Integration tests (API endpoints, database)
4. Test fixtures + mocks

**Critical Rules:**
- ✅ Test user flows, not implementation details
- ✅ Use realistic test data (not "test123")
- ✅ Clean up after tests (database, files)
- ❌ NO flaky tests (add waits if needed)
- ❌ NO skipped tests without justification

---

[IF devops-specialist NEEDED]
### Agent 4: devops-specialist

**Focus:** Deployment + CI/CD + Monitoring

**Scope:**
- Tasks: T[DEVOPS_START]-T[DEVOPS_END] ([X]% of total)
- Files: .github/workflows/, docker/, scripts/
- Duration: [X-Y hours]

**MCP Tools Allowed:**
- context7 (GitHub Actions docs, Docker docs)

**Key Responsibilities:**
1. CI/CD pipeline (GitHub Actions / GitLab CI)
2. Environment setup (dev, staging, prod)
3. Secrets management (GitHub Secrets)
4. Monitoring (Sentry, Vercel Analytics)

[END IF]

---

## 📋 EXECUTION STRATEGY

### Parallel Execution (Maximize Speed)

**Phase 1: Foundation (Sequential - 30 min)**
```
backend-specialist: Database schema + migrations
↓ (wait for completion)
ALL agents: Can start parallel work
```

**Phase 2: Parallel Development (3-4h)**
```
backend-specialist:     T001-T[X] (API endpoints)
    ║
    ╠══ frontend-specialist: T[Y]-T[Z] (UI components)
    ║
    ╚══ testing-specialist: T[W]-T[V] (test suites)

(All work simultaneously, no blocking)
```

**Phase 3: Integration (Sequential - 30 min)**
```
ALL agents complete → Integration testing → Final validation
```

### Context Management

**Preserve Memory:**
- Read `project-memory.md` at start (understand WHY)
- Call `/update-memory` when making significant decisions
- Reference patterns from GOLDEN-PATTERNS.md

**Avoid Context Bloat:**
- Don't read ALL files upfront (lazy load)
- Use MCP Context7 just-in-time (not preemptively)
- Focus on current task, not entire codebase

### Quality Gates (ESLint Checkpoints)

**Every 10 tasks:**
```bash
# 1. Build check
pnpm build
# If fails → Fix immediately before continuing

# 2. Lint check
pnpm lint
# If errors → Fix immediately
# Warnings → Document, fix later

# 3. Quick test
pnpm test:quick
# If fails → Fix immediately
```

**Final Gate (Before PR):**
```bash
pnpm build && pnpm lint && pnpm test
# All must pass (no exceptions)
```

---

## 🚨 ERROR HANDLING

### 3-Strike Rule

**Strike 1:** Error occurs
- Agent analyzes error
- Attempts fix
- Retries task

**Strike 2:** Same error persists
- Agent documents error in project-memory.md
- Tries alternative approach
- Retries task

**Strike 3:** Still failing
- **ESCALATE TO HUMAN**
- Create GitHub Issue with:
  - Error log
  - Context (what was attempted)
  - Attempted fixes
  - Recommendation
- STOP work on this task (don't waste tokens)

### Rollback Strategy

If critical error breaks build:
```bash
# 1. Identify last working commit
git log --oneline

# 2. Rollback breaking changes
git revert [commit-hash]

# 3. Document in project-memory.md
/update-memory
Section: Issues Encountered
Entry: "Rolled back [feature] due to [error]. Will retry with [alternative approach]."

# 4. Retry with different approach
```

---

## 📝 DOCUMENTATION REQUIREMENTS

### During Implementation

**Call `/update-memory` when:**
- Architecture decision made (state management choice, auth strategy)
- Performance optimization implemented (caching, indexing)
- Trade-off accepted (simplicity over performance for MVP)
- Alternative rejected (why option B chosen over option A)

**Example:**
```markdown
#### 2025-10-14 State Management Strategy

**Agent:** frontend-specialist

**Decision:** TanStack Query + Zustand (not Redux)

**Reason:**
- TanStack Query handles server state (caching, refetch)
- Zustand handles UI state (modals, theme)
- -70% boilerplate vs Redux

**Trade-offs:**
- ✅ Pros: Simpler, less code, better performance
- ❌ Cons: Less ecosystem (but sufficient for MVP)

**Alternatives:**
- Redux (rejected: overkill, too verbose for MVP)
- Context (rejected: performance issues with many re-renders)

**Validation:**
- Tested 100 concurrent users: no performance issues
- Bundle size: +12KB vs +45KB for Redux
```

### After Implementation

**Update `project-memory.md` Session Notes:**
```markdown
### Session [DATE] - Phase 3: Implementation

**Duration:** [X hours]
**Tasks Completed:** [COUNT]/[TOTAL] ([%]%)
**Outcome:** ✅ SUCCESS / ⚠️ PARTIAL / ❌ BLOCKED

**Key Achievements:**
- [Achievement 1]
- [Achievement 2]

**Issues Encountered:**
- [Issue 1] → Resolved via [solution]
- [Issue 2] → Escalated (GitHub Issue #123)

**Next Steps:**
- [Next step 1]
- [Next step 2]
```

---

## ✅ COMPLETION CRITERIA

**Definition of Done:**

**Code:**
- [ ] All P0 tasks completed (must-have features)
- [ ] Build passes (pnpm build → exit 0)
- [ ] No TypeScript errors (strict mode)
- [ ] ESLint clean (no errors)

**Tests:**
- [ ] E2E tests pass (core user flows)
- [ ] Unit tests pass (business logic)
- [ ] Coverage ≥80% backend, ≥60% frontend

**Design:**
- [ ] Design tokens used (no hardcoded colors)
- [ ] Responsive (mobile + desktop)
- [ ] Accessible (WCAG AA minimum)

**Documentation:**
- [ ] README.md updated (setup instructions)
- [ ] project-memory.md updated (decisions documented)
- [ ] API docs generated (if backend)

**Quality:**
- [ ] No console.errors in production build
- [ ] No TODO comments without GitHub issues
- [ ] Lighthouse score >90 (if applicable)

**When ALL criteria met:**
```bash
# Create PR
gh pr create --title "feat: implement MVP" --body "$(cat PR_TEMPLATE.md)"

# Tag completion
git tag v1.0-mvp
git push origin v1.0-mvp

echo "✅ MVP IMPLEMENTATION COMPLETE"
```

---

## 🎯 FINAL PROMPT FOR /IMPLEMENT

**Copy-paste this into `/implement`:**

```
[PASTE ENTIRE ORCHESTRATION PROMPT ABOVE]

Context:
- Constitution: .specify/memory/constitution.md
- Spec: specs/001-mvp/spec.md
- Tasks: specs/001-mvp/tasks.md
- Design: design/design-tokens.json
- Memory: project-memory.md

Execute orchestration with sub-agents as described.
Report progress every 30 min.
Escalate blockers immediately.

GO! 🚀
```

---

## Step 5: Write Orchestration Files (V5.2.1)

**CRITICAL PATH REQUIREMENT:**
- All 3 files MUST be created at the PROJECT ROOT
- Use Write tool with relative path from root: `./ORCHESTRATION.md`, `./implementation-prompt.md`, `./observability-pulse.jsonl`
- DO NOT create in specs/001-mvp/ or any subdirectory
- If current directory is not project root, files will still be created at root via relative path

After generating the orchestration prompt above, create these files:

### File 1: ORCHESTRATION.md (Documentation & Strategy)

**Path:** `./ORCHESTRATION.md` (project root, NOT specs/001-mvp/)

Write comprehensive orchestration documentation:

```markdown
# Orchestration Strategy - [PROJECT_NAME]

**Generated:** [DATE]
**Workflow Version:** V5.2.1 (Auto-detected from CHANGELOG)
**Sub-Agents:** [COUNT] (Haiku 4.5 recommended for speed)
**Total Tasks:** [TASK_COUNT]

## Sub-Agents Configuration

[Copy sub-agents sections from prompt above]

### backend-specialist
**Responsibilities:** [from prompt]
**Tasks:** T[X]-T[Y]
**Duration:** [X-Y hours]

**Filesystem Périmètres (V6 Foundation):**
- **Allowed:** src/lib/, src/services/, src/app/api/, supabase/, scripts/
- **Forbidden:** src/components/, src/app/(dashboard)/, design/, public/
- **Violation Handling:** STOP + request coordination

### frontend-specialist
**Responsibilities:** [from prompt]
**Tasks:** T[Y]-T[Z]
**Duration:** [X-Y hours]

**Filesystem Périmètres:**
- **Allowed:** src/components/, src/app/(dashboard)/, src/hooks/, public/, styles/, design/
- **Forbidden:** src/lib/event-store/, src/services/, src/app/api/, supabase/
- **Violation Handling:** STOP + request coordination

### testing-specialist
**Responsibilities:** [from prompt]
**Tasks:** T[Z]-T[W]
**Duration:** [X-Y hours]

**Filesystem Périmètres:**
- **Allowed:** tests/, __tests__/, cypress/, scripts/
- **READ-ONLY:** src/ (for analysis only)
- **Forbidden:** WRITE to src/ (except __tests__/ subdirectories)
- **Violation Handling:** Tests go in tests/, never modify source

## MCP Tools Strategy

[Copy MCP strategy from prompt above]

## Quality Gates

[Copy quality gates from prompt above]

## Parallel Execution Plan

[Copy execution strategy from prompt above]

**Generated by:** /speckit.agents (V5.2.1)
```

### File 2: implementation-prompt.md (Ready for /implement)

**Path:** `./implementation-prompt.md` (project root)

Write ready-to-paste prompt for `/implement`:

```markdown
# Implementation Prompt

**Generated:** [DATE] by /speckit.agents V5.2.1
**Project:** [PROJECT_NAME]
**Agents:** [COUNT] sub-agents

---

## Instructions for User

Copy-paste the content below into `/implement` command:

---

[PASTE ENTIRE ORCHESTRATION PROMPT from Step 4 above]

Context files to read:
- ORCHESTRATION.md (this file - sub-agents, MCP tools, périmètres)
- .specify/memory/constitution.md (5 principles)
- specs/001-mvp/spec.md (user stories, architecture)
- specs/001-mvp/tasks.md (233 tasks breakdown)
- specs/001-mvp/plan.md (technical decisions, file structure)
- design/design-tokens.json (design system tokens)
- project-memory.md (existing decisions WHY)

Execute orchestration with sub-agents as described in ORCHESTRATION.md.
Report progress every 30 min.
Escalate blockers immediately.

GO! 🚀

---

**Note:** Edit this prompt if needed before pasting into `/implement`.
```

### File 3: observability-pulse.jsonl (V6 Foundation)

**Path:** `./observability-pulse.jsonl` (project root)

Create empty JSONL file for V6 Live Pulse Observability:

```jsonl
# V6 Live Pulse Observability - Ready
# This file will log real-time agent activity in V6
# Format: {"timestamp": "ISO-8601", "agent": "name", "action": "type", "status": "state", "details": {}}
```

---

## Confirmation Message

Return confirmation:

```
✅ Orchestration files created (V5.2.1):

Files generated:
- ORCHESTRATION.md ([X] lines, [Y] agents configured)
- implementation-prompt.md (ready for /implement)
- observability-pulse.jsonl (V6 foundation ready)

**Workflow Version:** V5.2.1 (detected from CHANGELOG-V5.2.1-QUICK-WINS.md)

**Filesystem Périmètres:** ✅ Auto-generated
  - backend: src/lib/, src/services/, src/app/api/, supabase/
  - frontend: src/components/, src/app/(dashboard)/, src/hooks/, public/
  - testing: tests/ (READ-ONLY: src/)

**Next Steps:**
1. Review ORCHESTRATION.md (verify strategy)
2. Review implementation-prompt.md (edit if needed)
3. Run: /implement
4. Paste content from implementation-prompt.md
5. Agents execute in parallel with quality gates

**Time Saved:** ~15 min (vs manual prompt crafting) ✅
**V6 Ready:** observability-pulse.jsonl foundation created ✅

Workflow: V5.2.1 = Safe improvements without breaking Spec-Kit base 🚀
```

---

## Step 6: Verify Files Created ✅

**After generating all files, verify they exist:**

```bash
ls -lh ORCHESTRATION.md
ls -lh implementation-prompt.md
ls -lh observability-pulse.jsonl
```

**Expected output:**
```
-rw-r--r--  1 user  staff  [size] [date] ORCHESTRATION.md
-rw-r--r--  1 user  staff  [size] [date] implementation-prompt.md
-rw-r--r--  1 user  staff  [size] [date] observability-pulse.jsonl
```

**If ANY file missing:**
- Display error: "❌ File generation incomplete"
- List which files are missing
- Suggest: "Re-run /speckit.agents to regenerate missing files"
- STOP

**If all files exist:**
- Display: "✅ All 3 files verified"
- Show file sizes
- Continue to Summary

---

## Summary

✅ **Orchestration prompt generated + 3 files created**

**Selected Agents:** [LIST]
**Total Tasks:** [COUNT]
**Estimated Duration:** [X-Y hours]
**MCP Strategy:** Context7 (just-in-time) + ESLint (checkpoints)

**Files Verified:**
- ✅ ORCHESTRATION.md ([X] KB)
- ✅ implementation-prompt.md ([Y] KB)
- ✅ observability-pulse.jsonl ([Z] bytes)

**Next Step:** Review implementation-prompt.md → `/implement` (paste content)

**Note:** Agents will self-document via `/update-memory` during implementation (Dynamic Memory V5).
