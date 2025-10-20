---
description: Execute implementation plan by launching sub-agents automatically (V6.1 Production)
allowed-tools: Task(*), Read(*), Bash(*), TodoWrite(*), Write(*), Edit(*)
model: claude-sonnet-4-5-20250929
---

# 🚀 Spec-Kit Final - Automated Implementation (V6.1 Production)

**Version:** V6.1 Production (Real Agent Execution)
**Purpose:** Automate implementation by reading ORCHESTRATION.md and launching agents sequentially

**Context:** $ARGUMENTS (project path, default: current directory)

---

## Instructions

### Step 1: Parse Project Path

**Context:** $ARGUMENTS

If $ARGUMENTS provided:
- Use as PROJECT_PATH (e.g., "test1710/")

If $ARGUMENTS empty:
- Use current directory: PROJECT_PATH="."

Display:
```
📍 Project: $PROJECT_PATH
```

---

### Step 2: Verify Prerequisites

Check 8 required files exist:

```bash
# Run verification
cd $PROJECT_PATH

# Check each file
if [ ! -f "ORCHESTRATION.md" ]; then echo "❌ ORCHESTRATION.md missing (run /speckit.agents)"; exit 1; fi
if [ ! -f ".specify/memory/constitution.md" ]; then echo "❌ constitution.md missing (run /speckit.constitution)"; exit 1; fi

# Detect Spec-Kit feature directory (usually specs/001-*)
SPEC_DIR=$(find specs -type d -name "001-*" 2>/dev/null | head -1)

# Check spec.md (3 possible locations)
if [ -n "$SPEC_DIR" ] && [ -f "$SPEC_DIR/spec.md" ]; then
  SPEC_PATH="$SPEC_DIR/spec.md"
elif [ -f ".specify/memory/spec.md" ]; then
  SPEC_PATH=".specify/memory/spec.md"
else
  echo "❌ spec.md missing (run /speckit.specify)"
  exit 1
fi

# Check tasks.md (3 possible locations)
if [ -n "$SPEC_DIR" ] && [ -f "$SPEC_DIR/tasks.md" ]; then
  TASKS_PATH="$SPEC_DIR/tasks.md"
elif [ -f ".specify/memory/tasks.md" ]; then
  TASKS_PATH=".specify/memory/tasks.md"
else
  echo "❌ tasks.md missing (run /speckit.tasks)"
  exit 1
fi

# Check plan.md (3 possible locations)
if [ -n "$SPEC_DIR" ] && [ -f "$SPEC_DIR/plan.md" ]; then
  PLAN_PATH="$SPEC_DIR/plan.md"
elif [ -f ".specify/memory/plan.md" ]; then
  PLAN_PATH=".specify/memory/plan.md"
else
  echo "❌ plan.md missing (run /speckit.plan)"
  exit 1
fi
if [ ! -f "design/design-tokens.json" ]; then echo "❌ design-tokens.json missing (run /speckit.design)"; exit 1; fi

# Check project-memory.md (2 possible locations)
if [ -f "project-memory.md" ]; then
  MEMORY_PATH="project-memory.md"
elif [ -f ".specify/memory/project-memory.md" ]; then
  MEMORY_PATH=".specify/memory/project-memory.md"
else
  echo "❌ project-memory.md missing (run /speckit.init)"
  exit 1
fi

# Create observability-pulse.jsonl if missing
if [ ! -f "observability-pulse.jsonl" ]; then
  echo "" > observability-pulse.jsonl
fi

echo "✅ Prerequisites verified (8 files)"
```

If any prerequisite missing:
- Display error message with missing files
- STOP execution
- Return error

---

### Step 3: Read ORCHESTRATION.md

Use Read tool to load:
```
$PROJECT_PATH/ORCHESTRATION.md
```

**Parse agent sections:**

Look for lines starting with `### Agent X:` or `### ` followed by `-specialist`

For each agent found, extract:
- **Agent name** (e.g., "backend-specialist")
- **Tasks range** (look for "Tasks: ~25-35 tasks" or similar)
- **Focus** (what this agent does)
- **Files** (list of files to create/modify)
- **Duration** (estimated time)

Store parsed agents in order (typically: backend → frontend → testing)

Display:
```
🔍 Found X agents in ORCHESTRATION.md:
1. backend-specialist (25-35 tasks)
2. frontend-specialist (20-30 tasks)
3. testing-specialist (10-15 tasks)
```

---

### Step 4: Load Context Files

Read all context files using Read tool:

1. `.specify/memory/constitution.md`
2. `$SPEC_PATH` (from Step 2)
3. `$TASKS_PATH` (from Step 2)
4. `$PLAN_PATH` (from Step 2)
5. `design/design-tokens.json`
6. `$MEMORY_PATH` (from Step 2)
7. `CLAUDE.md` (brief summary only, don't read entirely)

Extract metadata:
- Project name (from spec.md first # header)
- Total tasks (count `- [ ]` in tasks.md)
- Tech stack (from spec.md)

Display:
```
📚 Context loaded:
   Project: [Name]
   Tasks: [Count]
   Stack: [Tech summary]
```

---

### Step 5: Execute Agents Sequentially

**For each agent parsed in Step 3**, execute in order:

#### Per-Agent Execution

**Display agent start:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🤖 Agent [N/Total]: [agent-name]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Tasks: [range]
Focus: [description]
Duration: [estimate]
```

**Check context buffer before agent launch:**

Before launching this agent, verify context is not approaching limit to prevent mid-agent overflow:

```bash
# Context Buffer Check (Pattern: Compound Engineering)
# Estimates current context size and auto-saves bundle if approaching limit

# Simple heuristic estimate:
# - Each context file ≈ 2-3K tokens (constitution, spec, tasks, plan)
# - Conversation baseline ≈ 20-30K tokens
# - Each agent prompt ≈ 10-15K tokens
# - Safety threshold: 150K tokens (75% of 200K limit)

CONTEXT_FILES=(
  "$PROJECT_PATH/ORCHESTRATION.md"
  "$PROJECT_PATH/.specify/memory/constitution.md"
  "$PROJECT_PATH/$SPEC_PATH"
  "$PROJECT_PATH/$TASKS_PATH"
  "$PROJECT_PATH/$PLAN_PATH"
  "$PROJECT_PATH/design/design-tokens.json"
  "$PROJECT_PATH/$MEMORY_PATH"
)

# Count total lines in context files (rough size estimate)
TOTAL_LINES=0
for file in "${CONTEXT_FILES[@]}"; do
  if [ -f "$file" ]; then
    LINES=$(wc -l < "$file" 2>/dev/null || echo 0)
    TOTAL_LINES=$((TOTAL_LINES + LINES))
  fi
done

# Estimate tokens: ~4 lines per 100 tokens (conservative)
# Add baseline (conversation + agent prompts already sent)
BASELINE_TOKENS=50000  # Conservative estimate
FILE_TOKENS=$((TOTAL_LINES * 25))  # 25 tokens per line average
ESTIMATED_TOKENS=$((BASELINE_TOKENS + FILE_TOKENS))

echo "📊 Context estimate: ~${ESTIMATED_TOKENS} tokens (threshold: 150K)"

# If approaching limit (150K+), auto-save bundle as insurance
if [ "$ESTIMATED_TOKENS" -gt 150000 ]; then
  echo ""
  echo "⚠️  WARNING: Context approaching limit (${ESTIMATED_TOKENS} tokens)"
  echo "📦 Auto-saving context bundle before launching [agent-name]..."
  echo ""

  # Generate emergency bundle via contextBundler
  BUNDLE_NAME="checkpoint-before-${AGENT_NAME}-$(date +%Y%m%d-%H%M%S)"

  # Check if contextBundler exists
  if [ -f "$PROJECT_PATH/scripts/contextBundler.cjs" ]; then
    node "$PROJECT_PATH/scripts/contextBundler.cjs" generate "$BUNDLE_NAME" 2>/dev/null || {
      echo "⚠️  contextBundler.cjs not found or failed"
      echo "💡 Manual save recommended: /savebundle $BUNDLE_NAME"
    }

    echo "✅ Bundle saved: .agents/context-bundles/${BUNDLE_NAME}.md"
    echo "💡 Recovery command (if overflow): /loadbundle .agents/context-bundles/${BUNDLE_NAME}.md"
  else
    echo "💡 Recommended: /savebundle $BUNDLE_NAME (contextBundler.cjs not in project)"
  fi

  echo ""
fi
```

**Purpose:**
- **Prevention:** Auto-save bundle before agent if context approaching limit
- **Insurance:** If context overflow mid-agent, bundle enables 60-70% recovery in 15 min
- **Pattern:** Compound Engineering context management (AI Labs framework)
- **Non-blocking:** Warning only, agent execution continues
- **Recovery:** Bundle contains files read, edits, commands, decisions (ADV2 pattern)

---

**Build agent prompt:**

Construct complete prompt for agent by combining:
- Mission from ORCHESTRATION.md (agent's section)
- Context files paths
- Quality gates requirements
- Critical rules from ORCHESTRATION.md

**Prompt template:**
```
You are [agent-name] for [PROJECT_NAME].

## Mission
[Extract from ORCHESTRATION.md agent section]

## Context Files (READ ALL)
1. Constitution: .specify/memory/constitution.md
2. Spec: [SPEC_PATH]
3. Tasks: [TASKS_PATH] (focus on your allocated tasks)
4. Plan: [PLAN_PATH]
5. Design: design/design-tokens.json
6. Memory: [MEMORY_PATH]
7. Workflow: CLAUDE.md
8. Orchestration: ORCHESTRATION.md (YOUR SECTION)

## Your Allocated Tasks
[Extract task range from ORCHESTRATION.md]

## Files You'll Create/Modify
[Extract from ORCHESTRATION.md agent section]

## Critical Rules
[Extract "Key Responsibilities" from ORCHESTRATION.md agent section]

## Execution Strategy (Spec-Kit Standard)

### Task Format in tasks.md
Each task follows: `- [ ] [TaskID] [P?] [Story?] Description with file path`

**[P] Marker = Parallelizable:**
- Different files + no dependencies = execute in parallel
- Same file = sequential (wait for completion)

**Parallel Execution:**
When you see consecutive tasks marked [P] that are independent:
- Execute them in PARALLEL using multiple tool calls in ONE message
- Example: T012[P] Create user.ts + T013[P] Create post.ts → 2 Write calls in same message
- File-based coordination: Tasks touching same file MUST run sequentially

**Sequential Execution:**
- Tasks without [P] = wait for previous task completion
- Tasks with dependencies = respect execution order

### TDD Approach (If Tests Present)
If tasks.md includes test tasks (e.g., "Contract test", "Integration test"):

**MANDATORY TDD Workflow:**
1. **Write test FIRST** (e.g., T023 Contract test POST /auth)
2. **Run test** → Expect FAIL (red phase)
3. **Implement minimum code** to pass (e.g., T031 Auth service)
4. **Run test again** → Expect PASS (green phase)
5. **Refactor** if needed (keep tests green)

**Test-First Rule:**
- Contract tests → implement BEFORE endpoints
- Integration tests → implement BEFORE services
- Unit tests → implement BEFORE core logic

**Checkpoint After Tests:**
```bash
pnpm test [test-file]
# Exit 1 if fails - FIX before continuing
```

### Phase Structure (Respect Order)
Tasks.md is organized in phases:

**Phase 1: Setup** (project initialization)
- Complete ALL setup tasks before Phase 2

**Phase 2: Foundational** (blocking prerequisites)
- Database schema, auth framework, base configs
- MUST complete 100% before user stories

**Phase 3+: User Stories** (P1, P2, P3...)
- Each story = independently testable increment
- Within story: Tests → Models → Services → Endpoints
- Story checkpoint: Verify story works standalone

**Final Phase: Polish**
- Cross-cutting concerns, optimization, docs

### Progress Tracking
- Mark completed tasks: `- [x]` in tasks.md
- Update after EACH task completion (not batched)
- Use Edit tool: replace `- [ ] T001` with `- [x] T001`

## Quality Gates (MANDATORY Every 10 Tasks)

1. **Gate P0: Build (BLOCKER)**
   ```bash
   pnpm build
   # Exit 1 if fails
   ```

2. **Gate P1: ESLint (BLOCKER)**
   Use `mcp__eslint__lint-files` on modified files
   - If errors → fix before continuing
   - If warnings → document, continue

3. **Gate P2: Context7 (IF new library)**
   If using new library:
   - `mcp__context7__resolve-library-id` → get ID
   - `mcp__context7__get-library-docs` → get docs
   - Don't guess APIs, get official docs

4. **Gate P3: Memory (VERIFICATION)**
   If significant decision made:
   - Document WHY in project-memory.md
   - Include trade-offs, alternatives, validation

5. **Gate P4: Observability (TIMELINE)**
   Log agent progress to observability-pulse.jsonl:
   ```bash
   # At agent start (ONCE):
   node scripts/pulseLogger.cjs start [agent-name] '{"tasks":[task-count],"focus":"[description]"}'

   # At each checkpoint (P0/P1/P2/P3):
   node scripts/pulseLogger.cjs checkpoint [gate-name] [pass|fail] '{"details":"[info]"}'

   # Examples:
   node scripts/pulseLogger.cjs checkpoint build pass '{"exit_code":0,"duration_ms":2340}'
   node scripts/pulseLogger.cjs checkpoint lint pass '{"warnings":3,"errors":0}'
   node scripts/pulseLogger.cjs checkpoint context7 skip '{"reason":"no new libraries"}'

   # At agent end (ONCE):
   node scripts/pulseLogger.cjs end [agent-name] '{"duration_s":[seconds],"tasks_completed":[count],"files_modified":[count]}'
   ```

   **Purpose:**
   - Timeline tracking (when each agent started/ended)
   - Checkpoint history (which gates passed/failed)
   - Metrics collection (duration, files, tasks)
   - Debugging aid (last checkpoint before crash)
   - Agent coordination (Agent B reads pulse → knows Agent A finished)

## Design/Dev Decoupling (CRITICAL)
- ✅ ALWAYS use CSS variables: `bg-primary-500`
- ❌ NEVER hardcode colors: `bg-blue-600`
- Read design-tokens.json for available tokens
- Constitution Principle IV: Design tokens mandatory

## Success Criteria
- ✅ All allocated tasks completed
- ✅ Build passes (pnpm build → exit 0)
- ✅ ESLint clean (0 errors)
- ✅ Tests pass (pnpm test)
- ✅ No hardcoded colors (constitution compliance)

## Error Handling: 3-Strike Rule
- Strike 1: Analyze + fix + retry
- Strike 2: Document + alternative + retry
- Strike 3: ESCALATE (create issue + STOP)

## Execution Workflow

1. **Log Start**: `node scripts/pulseLogger.cjs start [agent-name] '{"tasks":[count]}'`
2. **Read Context**: Load all context files (constitution, spec, tasks, plan, design, memory, CLAUDE.md, ORCHESTRATION.md)
3. **Parse Tasks**: Identify your allocated tasks, detect [P] markers, understand phases
4. **Implement Phase-by-Phase**:
   - Respect phase order (Setup → Foundational → User Stories → Polish)
   - Execute [P] tasks in parallel when possible (multiple tool calls in ONE message)
   - Follow TDD if tests present (test FIRST → fail → implement → pass)
   - Mark tasks completed: `- [x]` after EACH task
5. **Run Checkpoints**: Every 10 tasks → Build (P0) + Lint (P1) + Context7 (P2) + Memory (P3) + **Observability (P4)**
   - Log checkpoint: `node scripts/pulseLogger.cjs checkpoint [gate] [status] '{"details":"..."}'`
6. **Document Decisions**: Significant choices → project-memory.md (WHY + trade-offs)
7. **Log End**: `node scripts/pulseLogger.cjs end [agent-name] '{"duration_s":[s],"tasks_completed":[n]}'`
8. **Report Completion**: Summary of completed tasks, build status, test results

GO! 🚀
```

**Launch agent via Task tool:**

```
Use Task tool with:
  subagent_type: [agent-name]
  description: "Execute [agent-name] implementation"
  prompt: [constructed prompt above]
```

**Wait for agent completion** before proceeding to next agent.

**After agent completes:**

Display:
```
✅ [agent-name] completed

Running post-agent validation...
```

**Run validation checks:**

1. **Build check:**
   ```bash
   cd $PROJECT_PATH && pnpm build
   ```
   If fails: Display error, STOP execution

2. **Lint check:**
   ```bash
   cd $PROJECT_PATH && pnpm lint
   ```
   If errors: Display warnings, continue (non-blocking)

3. **Task progress:**
   ```bash
   grep "^\- \[x\]" $PROJECT_PATH/$TASKS_PATH | wc -l
   ```
   Display: "Tasks completed: X"

Display:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ [agent-name] validation passed
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Repeat for all agents** (backend → frontend → testing → devops if present)

---

### Step 6: Final Validation

After all agents complete:

```
🔍 Running final validation...
```

**Run final checks:**

1. **Final build:**
   ```bash
   cd $PROJECT_PATH && pnpm build
   ```

2. **Final lint:**
   ```bash
   cd $PROJECT_PATH && pnpm lint
   ```

3. **Final tests:**
   ```bash
   cd $PROJECT_PATH && pnpm test
   ```

4. **Design tokens compliance:**
   ```bash
   # Check for hardcoded colors (should be 0)
   grep -r "bg-blue-\|bg-red-\|bg-green-\|text-blue-\|text-red-" $PROJECT_PATH/src/ | wc -l
   ```

Display results:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 FINAL VALIDATION RESULTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Build: PASS
✅ Lint: PASS (X warnings)
✅ Tests: PASS (X tests)
✅ Design Tokens: 100% compliance (0 hardcoded colors)
```

---

### Step 7: Generate Summary

Display completion summary:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ IMPLEMENTATION COMPLETE - V6.1
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 SUMMARY:
   Project: [Name]
   Agents Executed: [Count]
   Tasks Completed: [X/Total]
   Duration: [calculated from start]

✅ QUALITY GATES:
   Build: PASS
   Lint: PASS ([X] warnings)
   Tests: PASS ([X] tests)
   Design Tokens: 100% compliance

📁 FILES CREATED:
   [List key files from agents]

🎯 NEXT STEPS:
   1. Review implementation: git diff
   2. Manual testing: pnpm dev
   3. Optional design import: /import-design custom-tokens.json
   4. Create PR: gh pr create
   5. Merge: gh pr merge --squash

📚 DOCUMENTATION:
   - Observability: observability-pulse.jsonl
   - Memory: [MEMORY_PATH] (WHY documented)
   - Timeline: ./scripts/viewPulse.sh (if available)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 V6.1 Production - Full Automation Achieved!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Error Handling

### If Prerequisites Missing

Display:
```
❌ Prerequisites missing:

Missing files:
- [file1] (run /speckit.[command])
- [file2] (run /speckit.[command])

STOP: Cannot proceed without prerequisites.
Fix: Run missing commands above, then retry /speckit.final
```

STOP execution immediately.

---

### If Agent Fails

Display:
```
❌ Agent [name] failed

Error: [error message from Task tool]

Action: Review logs and fix manually, then re-run /speckit.final

Logs:
- Agent output: [shown above]
- Observability: observability-pulse.jsonl

STOP: Manual intervention required.
```

STOP execution, do not proceed to next agent.

---

### If Build Fails

Display:
```
❌ Build failed after [agent-name]

Error output:
[build error from bash]

Action: Fix build errors manually, then re-run /speckit.final

Troubleshooting:
1. Check TypeScript errors in output above
2. Verify imports are correct
3. Check for missing dependencies: pnpm install
4. Review [agent-name] output for issues

STOP: Build must pass before continuing.
```

STOP execution.

---

## Implementation Notes

**V6.1 = Sequential Execution (Production-Safe):**
- Agents run one after another (backend → frontend → testing)
- Each agent completes fully before next starts
- Build validation between agents catches errors early
- Duration: 3-4h (same as manual) but 0 overhead
- Reliability: High (validated workflow)

**V6.2 Future = Parallel Execution:**
- Agents run simultaneously (backend || frontend || testing)
- 2× faster (~1.5-2h) but requires coordination
- Decision: After V6.1 validation in production

**Why Sequential:**
- ✅ Proven reliable (V5.2.1 pattern)
- ✅ Easy debugging (one agent at a time)
- ✅ Early error detection (build between agents)
- ✅ Rollback safe (git history clean)

---

## Success Metrics

**Must-Have (P0):**
- ✅ Reads ORCHESTRATION.md correctly
- ✅ Launches all agents sequentially via Task tool
- ✅ Validates build/lint/tests between agents
- ✅ Zero manual intervention required
- ✅ Displays clear summary at end

**Should-Have (P1):**
- ✅ Duration comparable to manual workflow
- ✅ Error messages actionable
- ✅ Design tokens compliance verified

**Nice-to-Have (P2):**
- ⏳ Observability pulse logging (optional)
- ⏳ Timeline viewer integration
- ⏳ Memory auto-updates from agents

---

**Version:** V6.1 Production
**Status:** ✅ Real Agent Execution
**ROI:** -5 to -10 minutes overhead + 0 copy-paste errors = 100% automation
