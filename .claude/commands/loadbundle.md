---
description: Load context bundle to recover agent session state
argument-hint: <bundle-path>
allowed-tools: Read(*), Bash(*), Grep(*)
model: claude-sonnet-4-5-20250929
---

# 📥 Load Context Bundle

Restore agent session state from saved context bundle after context overflow or crash.

**Purpose:** Fast recovery (15 min vs 2h45) by replaying agent's prior work from `.agents/context-bundles/` bundle file.

---

## Instructions

**Context:** $ARGUMENTS (required - path to bundle file)

**Bundle Path Examples:**
- `.agents/context-bundles/2025-10-18_15-30_session.md`
- `.agents/context-bundles/backend-specialist-auth-implementation.md`
- `.agents/context-bundles/emergency-save-auth-90-percent-done.md`

---

### Step 1: Validate Bundle Path

```bash
BUNDLE_PATH="$ARGUMENTS"

# Check bundle exists
if [ ! -f "$BUNDLE_PATH" ]; then
  echo "❌ ERROR: Bundle not found at $BUNDLE_PATH"
  echo ""
  echo "Available bundles:"
  ls -lh .agents/context-bundles/*.md 2>/dev/null || echo "  (none found)"
  exit 1
fi

# Verify bundle format
if ! grep -q "# Context Bundle:" "$BUNDLE_PATH"; then
  echo "⚠️ WARNING: File doesn't appear to be a context bundle"
  echo "Expected header: '# Context Bundle:'"
  exit 1
fi

echo "✅ Bundle validated: $BUNDLE_PATH"
```

---

### Step 2: Read Bundle Metadata

**Extract header information:**

```bash
# Bundle name
BUNDLE_NAME=$(grep "^# Context Bundle:" "$BUNDLE_PATH" | sed 's/# Context Bundle: //')

# Created timestamp
BUNDLE_CREATED=$(grep "^\*\*Created:\*\*" "$BUNDLE_PATH" | sed 's/\*\*Created:\*\* //')

# Agent type
BUNDLE_AGENT=$(grep "^\*\*Agent:\*\*" "$BUNDLE_PATH" | sed 's/\*\*Agent:\*\* //')

# Session duration
BUNDLE_DURATION=$(grep "^\*\*Duration:\*\*" "$BUNDLE_PATH" | sed 's/\*\*Duration:\*\* //')

# Git info
BUNDLE_BRANCH=$(grep "^\*\*Branch:\*\*" "$BUNDLE_PATH" | sed 's/\*\*Branch:\*\* //')
BUNDLE_COMMIT=$(grep "^\*\*Commit:\*\*" "$BUNDLE_PATH" | sed 's/\*\*Commit:\*\* //')
```

**Display metadata to user:**

```markdown
📥 Loading Context Bundle

**Bundle:** $BUNDLE_NAME
**Created:** $BUNDLE_CREATED
**Agent:** $BUNDLE_AGENT
**Duration:** $BUNDLE_DURATION
**Branch:** $BUNDLE_BRANCH @ $BUNDLE_COMMIT

Loading context...
```

---

### Step 3: Parse Bundle Sections

**Extract key sections:**

1. **FILES READ** - Which files agent read
2. **EDITS MADE** - Which files agent modified
3. **COMMANDS EXECUTED** - What commands agent ran
4. **CURRENT UNDERSTANDING** - Agent's mental model
5. **KEY DECISIONS** - Architectural choices made
6. **NEXT STEPS** - What agent planned to do next

**Commands:**

```bash
# Extract FILES READ section
awk '/^## 📂 FILES READ/,/^## /' "$BUNDLE_PATH" | grep "^- \`" > /tmp/files-read.txt

# Extract EDITS MADE section
awk '/^## ✏️ EDITS MADE/,/^## /' "$BUNDLE_PATH" > /tmp/edits-made.txt

# Extract COMMANDS section
awk '/^## 🔧 COMMANDS EXECUTED/,/^## /' "$BUNDLE_PATH" | grep "^- \`" > /tmp/commands.txt

# Extract CURRENT UNDERSTANDING section
awk '/^## 🧠 CURRENT UNDERSTANDING/,/^## /' "$BUNDLE_PATH" > /tmp/understanding.txt

# Extract KEY DECISIONS section
awk '/^## 🎯 KEY DECISIONS/,/^## /' "$BUNDLE_PATH" > /tmp/decisions.txt

# Extract NEXT STEPS section
awk '/^## 🧠 CURRENT UNDERSTANDING/,/^## /' "$BUNDLE_PATH" | awk '/^\*\*Next Steps:\*\*/,/^## /' > /tmp/next-steps.txt
```

---

### Step 4: Smart File Loading (Deduplication)

**Problem:** Bundle may list 50+ files, but reading all wastes context.

**Solution:** Deduplicate and prioritize.

**Strategy:**

1. **Group files by directory** (identify core areas)
2. **Prioritize recently edited files** (most relevant)
3. **Skip read-only reference files** (unless critical)
4. **Batch similar files** (read related files together)

**Implementation:**

```bash
# Parse files read, extract unique paths
cat /tmp/files-read.txt | sed 's/^- `\(.*\):.*/\1/' | sort -u > /tmp/unique-files.txt

# Count files
FILE_COUNT=$(wc -l < /tmp/unique-files.txt)

echo "📂 Bundle references $FILE_COUNT unique files"

# Identify core areas (top 3 directories)
cat /tmp/unique-files.txt | xargs -I {} dirname {} | sort | uniq -c | sort -rn | head -3

# Example output:
#   15 src/lib
#   8 src/components
#   5 database
```

**Deduplication decision:**

- **< 20 files:** Read all (manageable)
- **20-50 files:** Read edited files + key references
- **> 50 files:** Read only edited files + CURRENT UNDERSTANDING section

---

### Step 5: Load Critical Context

**Priority 1: Read CURRENT UNDERSTANDING**

```bash
# Display understanding to agent (fast context recovery)
cat /tmp/understanding.txt
```

**Example Output:**
```
**Project State:**
- Phase: Implementation
- Feature: Supabase Auth with RLS
- Progress: 20/35 tasks completed

**Technical Context:**
- Auth flow uses Supabase Auth with JWT tokens
- Database has RLS policies enabled per-user
- Middleware validates tokens on protected routes
- Tests cover sign-in, sign-out, session refresh
```

**Agent now has 40-50% context recovered (mental model restored)**

---

**Priority 2: Read KEY DECISIONS**

```bash
# Display decisions to agent
cat /tmp/decisions.txt
```

**Example Output:**
```
### Decision 1: Supabase Auth Strategy
**Choice:** Use Supabase Auth (not NextAuth)
**Reason:** Built-in RLS, -90% boilerplate
**Trade-offs:** Vendor lock-in accepted for speed
```

**Agent now has 50-60% context recovered (WHY understood)**

---

**Priority 3: Read NEXT STEPS**

```bash
# Display next steps to agent
cat /tmp/next-steps.txt
```

**Example Output:**
```
**Next Steps:**
1. Finish auth middleware tests
2. Add password reset flow
3. Document auth setup in README
4. Run full build + test suite
```

**Agent now has 60-70% context recovered (knows what to do next)**

---

### Step 6: Selective File Reading (Optional)

**Only if agent needs deeper context:**

```bash
# Read edited files (most relevant)
echo "📂 Reading recently edited files..."

# Extract edited files from EDITS MADE section
grep "^### .* - \`" /tmp/edits-made.txt | sed 's/^### .* - `\(.*\)`/\1/' | while read file; do
  if [ -f "$file" ]; then
    echo "Reading: $file"
    # Agent uses Read tool here
  fi
done
```

**Deduplication rule:**
- Don't re-read files already in context
- Prioritize files modified in bundle (not just read)
- Skip large files (> 500 lines) unless critical

---

### Step 7: Verify Current State

**Check if project state matches bundle:**

```bash
# Compare git state
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
CURRENT_COMMIT=$(git rev-parse --short HEAD)

if [ "$CURRENT_BRANCH" != "$BUNDLE_BRANCH" ]; then
  echo "⚠️ WARNING: Branch mismatch"
  echo "  Bundle: $BUNDLE_BRANCH"
  echo "  Current: $CURRENT_BRANCH"
  echo ""
  echo "Bundle may be outdated. Continue? [Y/n]"
fi

if [ "$CURRENT_COMMIT" != "$BUNDLE_COMMIT" ]; then
  echo "⚠️ WARNING: Commits since bundle created"
  echo "  Bundle: $BUNDLE_COMMIT"
  echo "  Current: $CURRENT_COMMIT"
  echo ""
  echo "$(git log --oneline $BUNDLE_COMMIT..$CURRENT_COMMIT | wc -l) commits since bundle"
  git log --oneline $BUNDLE_COMMIT..$CURRENT_COMMIT | head -5
fi
```

---

### Step 8: Display Recovery Summary

```markdown
✅ Context Bundle Loaded Successfully!

**Recovery Stats:**
- 🧠 Mental Model: RESTORED (Current Understanding read)
- 🎯 Decisions: RESTORED (Key Decisions read)
- 📂 Files Context: PARTIAL (edited files prioritized)
- 🔧 Commands History: AVAILABLE (can replay if needed)

**Estimated Context Recovery:** 60-70%

**What was restored:**
- Project state: Implementation Phase, Auth feature, 20/35 tasks done
- Technical context: Supabase Auth + JWT + RLS + Middleware
- Key decisions: 2 architectural choices documented
- Next steps: 4 action items identified

**What to do now:**

1. **Read project-memory.md** (project-level WHY - complements bundle WHAT)
   ```bash
   # Recommended startup command
   grep -A 10 "Session.*2025-10" project-memory.md | tail -30
   ```

2. **Continue from Next Steps:**
   - [ ] Finish auth middleware tests
   - [ ] Add password reset flow
   - [ ] Document auth setup in README
   - [ ] Run full build + test suite

3. **Verify current state:**
   ```bash
   git status
   pnpm run build  # Ensure still compiles
   ```

**Files available for deep dive (if needed):**
[List edited files from bundle]

- `src/lib/auth.ts` (150 lines - auth module)
- `database/schema.sql` (60 lines - RLS policies)
- `src/middleware/auth.ts` (80 lines - JWT validation)

**Commands available to replay (if needed):**
[List from COMMANDS section]

- `pnpm add @supabase/supabase-js`
- `pnpm run build` (was ✅ PASS)
- `pnpm run lint` (was ✅ PASS - 4 warnings)

---

**Recovery complete!** You can now continue work from where bundle was saved.
```

---

## Error Handling

**If bundle file not found:**
```
❌ ERROR: Bundle not found at [PATH]

Available bundles:
- .agents/context-bundles/2025-10-18_15-30_session.md (2h ago)
- .agents/context-bundles/backend-specialist-auth.md (1 day ago)

Usage: /loadbundle <bundle-path>
```

**If bundle format invalid:**
```
⚠️ WARNING: File doesn't appear to be valid context bundle

Expected format:
- Header: "# Context Bundle: [NAME]"
- Sections: FILES READ, EDITS MADE, CURRENT UNDERSTANDING

This file may be corrupted or manually edited.
Continue anyway? [Y/n]
```

**If git state diverged significantly:**
```
⚠️ WARNING: Project state diverged from bundle

Bundle: Branch 'feature/auth' @ abc123 (2 hours ago)
Current: Branch 'main' @ def456 (15 commits ahead)

Bundle context may be outdated or irrelevant.

Options:
1. Continue (bundle may have useful context)
2. Find more recent bundle
3. Cancel and start fresh

Choose: [1/2/3]
```

---

## Usage Examples

**Example 1: Load most recent bundle**
```bash
# Find latest bundle
ls -lt .agents/context-bundles/*.md | head -1

# Load it
/loadbundle .agents/context-bundles/2025-10-18_15-30_session.md
```

**Example 2: Load named bundle**
```bash
/loadbundle .agents/context-bundles/backend-specialist-auth-implementation.md
```

**Example 3: Recovery after crash**
```bash
# Context overflow occurred mid-session
# New session starts

# Load last saved bundle
/loadbundle .agents/context-bundles/emergency-save-auth-90-percent-done.md

# Context recovered (60-70%)
# Continue from NEXT STEPS
```

---

## When to Use

✅ **Use /loadbundle when:**
- Context overflow occurred (conversation crashed)
- New session after long work (recover yesterday's context)
- Agent switch (backend → frontend, need backend context)
- Team collaboration (load teammate's bundle)

❌ **Don't use /loadbundle when:**
- Starting fresh project (no prior context needed)
- Bundle > 1 week old (likely outdated)
- Project state significantly changed (bundle irrelevant)

---

## Integration with Workflow

**Scenario: Context Overflow Recovery**

```bash
# Session 1: Work 2h45 on backend implementation
Task({ subagent: "backend-specialist", tasks: "T001-T035" })

# After 2h, approaching context limit
/savebundle backend-specialist-checkpoint-t030

# Continue... context overflows at T034
# Session 1 ENDS (crash)

# --- NEW SESSION ---

# Session 2: Recover context
/loadbundle .agents/context-bundles/backend-specialist-checkpoint-t030.md

# Context recovered (60-70%)
# Read project-memory.md (project-level WHY)
# Continue from T031-T035 (only 4 tasks to redo vs 35)

# Time saved: 2h45 → 15 min recovery + 30 min work = 2h saved
```

---

## Deduplication Strategy

**Why needed:** Bundle may list 50+ files, but context budget is limited.

**Smart Loading:**

1. **Always load:**
   - CURRENT UNDERSTANDING (mental model)
   - KEY DECISIONS (WHY)
   - NEXT STEPS (what to do)

2. **Conditionally load:**
   - Edited files (if agent needs code-level details)
   - Critical dependencies (if understanding requires it)

3. **Never load:**
   - Read-only reference files (can re-read if needed)
   - Large files > 500 lines (unless critical)
   - Binary files, logs, outputs

**Result:** 60-70% context recovery with 20-30% token cost (vs 100% re-reading)

---

## Complementary with project-memory.md

**After loading bundle, ALWAYS read project-memory.md:**

```bash
# Bundle loaded → WHAT was done
/loadbundle .agents/context-bundles/backend-auth.md

# Now load WHY (project decisions)
# Read project-memory.md
grep -A 10 "Session.*2025-10" project-memory.md | tail -30

# Now have complete picture:
# - Bundle: WHAT (files, commands, current state)
# - Memory: WHY (decisions, trade-offs, rationale)
```

**Together = 80-90% effective context recovery**

---

## Notes

**Why This Command Exists:**
- Enables fast recovery after context overflow (-70% remount time)
- Complements project-memory.md (bundles = WHAT, memory = WHY)
- Prevents catastrophic work loss (2h → 15 min recovery)

**ROI:**
- Time: -70% recovery (15 min vs 2h45 re-implementation)
- Quality: 60-70% context recovered (vs 0% if starting fresh)
- Cost: 2-3 min to load bundle (vs 2h lost work)

**Pattern Source:**
- Dev Dan - Context Engineering ADV2 (Context Bundles)
- Video: "Context Engineering for AI Agents"
- Health Score: 9.6/10 (quick win, high ROI)

---

**Version:** 1.0
**Created:** 2025-10-18
**Purpose:** Load context bundles for fast disaster recovery
