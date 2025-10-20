---
description: Save current agent session context to recoverable bundle
argument-hint: [optional-bundle-name]
allowed-tools: Write(*), Read(*), Bash(*), Grep(*)
model: claude-sonnet-4-5-20250929
---

# 💾 Save Context Bundle

Save current agent session state to `.agents/context-bundles/` for recovery after context overflow.

**Purpose:** Create "save point" for long-running sessions (2h+) to enable fast recovery if context explodes.

---

## Instructions

**Context:** $ARGUMENTS (optional - defaults to auto-generated name)

### What Context Bundles Save

**State Captured:**
1. **Files Read** - All files accessed during session (with line ranges)
2. **Commands Executed** - Bash, git, npm/pnpm commands run
3. **Edits Made** - Files modified (with context of changes)
4. **Decisions Documented** - Key architectural/implementation choices
5. **Current Understanding** - Agent's mental model of project state
6. **Tools Used** - MCP tools called (Context7, ESLint, Zen, etc.)
7. **Checkpoints Passed** - Quality gates executed (build, lint, tests)

**What's NOT Saved:**
- Full file contents (only paths + line ranges)
- Binary files or large outputs
- Conversation history verbatim (only key decisions)

---

### Step 1: Determine Bundle Name

```bash
# Default: YYYY-MM-DD_HH-MM_agent-type.md
BUNDLE_NAME="${ARGUMENTS:-$(date +%Y-%m-%d_%H-%M)_session.md}"
BUNDLE_PATH=".agents/context-bundles/$BUNDLE_NAME"

# Create directory if needed
mkdir -p .agents/context-bundles
```

**If argument provided:** Use it directly (e.g., `backend-specialist-auth-implementation`)

---

### Step 2: Gather Session Metadata

```bash
# Git info
GIT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "no-git")
GIT_COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo "no-commit")

# Session timing
SESSION_START=$(grep "session started" .agents/session.log 2>/dev/null | tail -1 | cut -d' ' -f1 || date +%H:%M:%S)
SESSION_NOW=$(date +%H:%M:%S)

# Files changed this session
FILES_CHANGED=$(git diff --name-only HEAD 2>/dev/null | wc -l)
```

---

### Step 3: Extract Recent Tool Calls

**Read observability-pulse.jsonl** (if exists) to extract tool calls:

```bash
# Last 50 events (covers typical 2h session)
tail -50 observability-pulse.jsonl 2>/dev/null > /tmp/recent-events.jsonl
```

**Parse events:**
- `type: "read"` → Files read
- `type: "edit"` → Files modified
- `type: "bash"` → Commands executed
- `type: "checkpoint"` → Quality gates

---

### Step 4: Generate Bundle Content

**Write** bundle file with this structure:

```markdown
# Context Bundle: [SESSION_NAME]

**Created:** [TIMESTAMP]
**Agent:** [AGENT_TYPE or "main-session"]
**Branch:** [GIT_BRANCH]
**Commit:** [GIT_COMMIT]
**Duration:** [SESSION_START] → [SESSION_NOW]

---

## 📂 FILES READ (Chronological)

[Extract from observability-pulse.jsonl OR manual list]

- `path/to/file.ts:1-250` - [TIMESTAMP] - [WHY: "Understanding auth flow"]
- `config/supabase.ts:1-100` - [TIMESTAMP] - [WHY: "Reading config"]
- `docs/WORKFLOW-V6-MVP.md:100-250` - [TIMESTAMP] - [WHY: "Learning workflow"]

**Total Files Read:** [COUNT]

---

## ✏️ EDITS MADE (Chronological)

[Extract from git diff + observability-pulse.jsonl]

### [TIMESTAMP] - `src/lib/auth.ts` (New File)
**Change:** Created authentication module
**Context:** Implementing Supabase Auth with RLS
**Lines:** 0 → 150
**Key Functions:** `signIn()`, `signOut()`, `getSession()`

### [TIMESTAMP] - `database/schema.sql:45-60`
**Change:** Added RLS policies
**Context:** Securing user data access
**Lines Changed:** +15
**SQL:** `CREATE POLICY user_data_access ...`

**Total Edits:** [COUNT] files

---

## 🔧 COMMANDS EXECUTED (Chronological)

[Extract from observability-pulse.jsonl OR bash history]

- `[TIMESTAMP]` - `pnpm add @supabase/supabase-js` - Installing auth library
- `[TIMESTAMP]` - `pnpm run build` - ✅ PASS - Checkpoint P0
- `[TIMESTAMP]` - `pnpm run lint` - ✅ PASS (4 warnings) - Checkpoint P1
- `[TIMESTAMP]` - `pnpm run test:unit` - ✅ PASS (12/12) - Checkpoint P2

**Total Commands:** [COUNT]

---

## 🧠 CURRENT UNDERSTANDING

**Project State:**
- **Phase:** [Planning / Implementation / Review]
- **Feature:** [Current feature being worked on]
- **Progress:** [X/Y tasks completed]

**Technical Context:**
[Agent's mental model - what has been understood]

Example:
- Auth flow uses Supabase Auth with JWT tokens
- Database has RLS policies enabled per-user
- Middleware validates tokens on protected routes
- Tests cover sign-in, sign-out, session refresh

**Next Steps:**
[What agent was planning to do next before bundle saved]

1. Finish auth middleware tests
2. Add password reset flow
3. Document auth setup in README
4. Run full build + test suite

---

## 🎯 KEY DECISIONS

[Significant architectural/implementation choices made during session]

### Decision 1: Supabase Auth Strategy
**Choice:** Use Supabase Auth (not NextAuth)
**Reason:** Built-in RLS, -90% boilerplate
**Trade-offs:** Vendor lock-in accepted for speed
**Files Affected:** `src/lib/auth.ts`, `database/schema.sql`

### Decision 2: JWT Token Storage
**Choice:** httpOnly cookies (not localStorage)
**Reason:** XSS protection
**Trade-offs:** Requires server-side session management
**Files Affected:** `src/middleware/auth.ts`

---

## 🔗 MCP TOOLS USED

[Context7, ESLint, Zen, etc.]

- `[TIMESTAMP]` - `mcp__context7__get-library-docs` - Supabase Auth RLS documentation
- `[TIMESTAMP]` - `mcp__eslint__lint-files` - Linted 15 files (4 warnings)
- `[TIMESTAMP]` - `mcp__zen__chat` - Discussed auth flow with Gemini

---

## ✅ CHECKPOINTS PASSED

[Quality gates executed]

- ✅ P0 Build - `pnpm run build` - PASS
- ✅ P1 Lint - ESLint 15 files - 4 warnings (acceptable)
- ✅ P2 Tests - 12/12 unit tests PASS
- ⏳ P3 Docs - README updated (pending final review)

---

## 🚨 BLOCKERS / ISSUES

[Any errors, blockers, or unresolved issues]

- None currently

---

## 📊 SESSION METRICS

- **Files Read:** [COUNT]
- **Files Modified:** [COUNT]
- **Commands Executed:** [COUNT]
- **Checkpoints Passed:** [COUNT] / 4 (P0-P3)
- **MCP Calls:** [COUNT]
- **Duration:** [HH:MM]

---

## 🔄 RECOVERY INSTRUCTIONS

**To restore this session context:**

```bash
/loadbundle .agents/context-bundles/[THIS_BUNDLE_NAME]
```

**What will be recovered:**
- 60-70% of technical understanding
- Files read/modified (paths, not full contents)
- Commands executed (reproducible steps)
- Decisions made (WHY documented)
- Current mental model of project

**What to re-read manually:**
- `project-memory.md` (project-level WHY - always read at startup)
- Key files from "FILES READ" section (refresh understanding)
- Latest git commits (verify current state)

---

**Bundle Version:** 1.0
**Created by:** Context Bundles System (Archon Orchestrator V6.1.3)
**Pattern Source:** Dev Dan - Context Engineering ADV2
```

---

### Step 5: Populate Bundle with Real Data

**Extract data from multiple sources:**

1. **observability-pulse.jsonl** (if exists)
   ```bash
   # Parse JSONL for tool calls
   jq -r 'select(.type == "read") | .file' observability-pulse.jsonl 2>/dev/null
   ```

2. **Git history this session**
   ```bash
   git log --since="2 hours ago" --name-only --pretty=format:"%h %s"
   ```

3. **Manual context** (agent fills based on memory)
   - Current understanding
   - Key decisions
   - Next steps

**If observability-pulse.jsonl doesn't exist:**
- Agent manually lists files read (from memory)
- Agent manually lists commands (from bash history)
- Agent documents understanding (current mental model)

---

### Step 6: Write Bundle File

```bash
cat > "$BUNDLE_PATH" <<'EOF'
[Generated content from Step 4 with real data from Step 5]
EOF
```

---

### Step 7: Verification

```bash
# Verify bundle created
ls -lh "$BUNDLE_PATH"

# Show bundle stats
wc -l "$BUNDLE_PATH"
echo "Bundle saved: $BUNDLE_PATH"

# Optional: Add to git (recommended)
git add "$BUNDLE_PATH"
echo "✅ Context bundle saved and staged for commit"
```

---

### Step 8: Summary Output

**Display to user:**

```markdown
✅ Context Bundle Saved Successfully!

**Bundle:** .agents/context-bundles/[NAME]
**Size:** [SIZE] KB
**Session Duration:** [START] → [NOW] ([DURATION])

**Captured:**
- 📂 Files Read: [COUNT]
- ✏️ Edits Made: [COUNT] files
- 🔧 Commands: [COUNT]
- 🧠 Key Decisions: [COUNT]
- ✅ Checkpoints: [COUNT] passed

**Recovery:**
If context overflows, run:
```bash
/loadbundle .agents/context-bundles/[NAME]
```

**Estimated Recovery:** 60-70% of session context

**Next:**
- Continue working normally
- Bundle auto-saved for disaster recovery
- Recommended: Commit bundle to git
```

---

## Error Handling

**If observability-pulse.jsonl missing:**
```
⚠️ WARNING: observability-pulse.jsonl not found

Context bundle will be created from:
- Git history
- Manual agent documentation

For full automation, ensure observability logger active.

Continue with manual bundle? [Y/n]
```

**If .agents/ directory fails to create:**
```
❌ ERROR: Cannot create .agents/context-bundles/ directory

Permissions issue. Try:
sudo mkdir -p .agents/context-bundles
sudo chown $(whoami) .agents/

Or run /savebundle from project root.
```

**If git not available:**
```
⚠️ WARNING: Git not detected

Bundle will save without git metadata (branch, commit).

Continue? [Y/n]
```

---

## Usage Examples

**Example 1: Auto-named bundle**
```bash
/savebundle
# Creates: .agents/context-bundles/2025-10-18_15-30_session.md
```

**Example 2: Named bundle (backend specialist)**
```bash
/savebundle backend-specialist-auth-implementation
# Creates: .agents/context-bundles/backend-specialist-auth-implementation.md
```

**Example 3: Emergency save before context overflow**
```bash
# You notice context getting full (180K/200K tokens)
/savebundle emergency-save-auth-90-percent-done
# Bundle saved, safe to continue or restart
```

---

## When to Use

✅ **Use /savebundle when:**
- Session approaching 2h (long-running work)
- Context approaching 150K+ tokens (getting full)
- Before risky operation (major refactor, database migration)
- End of work day (save progress before closing)
- Agent switch (backend → frontend specialist)

❌ **Don't use /savebundle when:**
- Session < 30 min (minimal context accumulated)
- Trivial changes (typo fixes, small edits)
- Already have recent bundle (< 1h ago)

**Best Practice:**
- Save bundle every 1-2h during long sessions
- Save before major context-heavy operations (read 20+ files)
- Commit bundles to git (team can recover too)

---

## Integration with Workflow

**Phase 3: Implementation**
```bash
# Start backend-specialist sub-agent
Task({ subagent: "backend-specialist", tasks: "T001-T035" })

# After 1.5h of work
/savebundle backend-specialist-checkpoint-t020

# Continue work...
# If context overflows at T030, can recover from T020 bundle
```

---

## Notes

**Why This Command Exists:**
- Prevents catastrophic context loss (2h work → crash → 0% recovered)
- Enables fast recovery (-70% remount time: 15 min vs 2h45)
- Complements project-memory.md (bundles = WHAT, memory = WHY)

**ROI:**
- Time: -70% recovery time if crash
- Risk: Insurance policy for long sessions
- Cost: 2-3 min to save bundle (vs 2h lost if crash)

**Pattern Source:**
- Dev Dan - Context Engineering ADV2 (Context Bundles)
- Video: "Context Engineering for AI Agents"
- Health Score: 9.6/10 (quick win, high ROI)

---

**Version:** 1.0
**Created:** 2025-10-18
**Purpose:** Implement Context Bundles pattern for disaster recovery
