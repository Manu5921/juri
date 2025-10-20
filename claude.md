# 🚀 Project Workflow - Claude Code V6.1.3

**Status:** Setup phase (rename this to `CLAUDE.md` in your project)
**Workflow:** Spec-Kit V6.1.3 (Gemini Analysis → Planning → Full Automation + Observability)
**Version:** 6.1.3 (Observability Complete + Full Automation)
**Date:** 2025-10-17

---

## 🧠 Session Startup Protocol (Zero Trust)

**BEFORE any work in existing project, ALWAYS:**

1. **Read project-memory.md** (if exists) → Last 3 sessions + runtime decisions
2. **Read latest CHANGELOG** (if exists) → Recent work (last 48h)
3. **Apply Zero Trust:** VERIFY current state before PROPOSING changes

**Commands:**
```bash
# Check recent work
git log --oneline --since="2 days ago"

# Read memory (session notes)
grep -A 5 "Session.*2025-10" .specify/memory/project-memory.md | tail -30

# Read latest archon-orchestrator updates (parent project patterns)
ls -lt ~/Documents/DEV/archon-orchestrator/changelogs/V*/CHANGELOG-*.md 2>/dev/null | head -1
```

**Principle:** Don't trust your own memory. Verify facts before proposing.

**Why Critical:**
- Prevents "forgetting" recent work (Zero Trust Rule #7 - Workflow Verification)
- Provides fil conducteur (chronological context via SESSION NOTES)
- Enforces Zero Trust: Don't trust your own memory, VERIFY

**Reference:** `~/Documents/DEV/archon-orchestrator/docs/ZERO-TRUST.md`

---

## 🎯 Quick Start Commands

Follow these commands **in order** for complete workflow:

### Phase 0: Project Analysis (5-10 min) - OPTIONAL

```bash
/zen-roundtable "Brief: [Your project description here]"
# Generates: prompt-constitution.md + prompt-specify.md + project-memory.md
# Output: 8KB total (analysis-multi-ia.md + constitution/specify prompts)
```

**Skip if:** You already have clear project vision.

---

### Phase 1: Spec-Kit Planning (30-35 min)

Execute **IN THIS EXACT ORDER:**

```bash
# Step 1: Create constitution (business/high-level governance)
/speckit.constitution
# → Output: .specify/memory/constitution.md (60-90s REAL generation)

# Step 2: Create technical specification
/speckit.specify
# → Output: specs/001-mvp/spec.md (90-120s REAL generation)

# Step 3: Initialize project + update this CLAUDE.md
/speckit.init
# → Output: CLAUDE.md + project-memory.md + ci-template.yml

# Step 4: Create design system (⭐ NEVER SKIP - Design/Dev Decoupling)
/speckit.design
# → Output: design-tokens.json + wireframes/ + components-list.md

# Step 5: Create implementation plan
/speckit.plan
# → Output: specs/001-mvp/plan.md

# Step 6: Create tasks list (50-100 tasks CHECKBOXES format)
/speckit.tasks
# → Output: specs/001-mvp/tasks.md

# Step 7: Create sub-agents orchestration
/speckit.agents
# → Output: ORCHESTRATION.md + observability-pulse.jsonl (empty)
```

**CRITICAL ORDER:** tasks BEFORE agents (agents needs tasks.md)

---

### Phase 2: GitHub Setup (2 min)

```bash
# Create feature branch
git checkout -b feat/mvp

# Commit bootstrap files
git add .
git commit -m "feat: init MVP structure

- Constitution + Spec + Design system
- ORCHESTRATION.md with 3 agents
- Tasks breakdown (50-100 tasks)

🤖 Generated with Claude Code V6.1.3
Co-Authored-By: Claude <noreply@anthropic.com>"

# Push and create PR
git push -u origin feat/mvp
gh pr create --title "feat: MVP Implementation" --body "..."
```

---

### Phase 3: Implementation (2h45-3h) ⭐ V6.1.3 FULL AUTOMATION + OBSERVABILITY

```bash
/speckit.final
```

**What happens:**
- ✅ Reads ORCHESTRATION.md + CLAUDE.md automatically
- ✅ Launches 3 agents sequentially (backend → frontend → testing)
- ✅ **Checkpoints MANDATORY every 10 tasks (5 gates):**
  - **Gate P0:** Build (BLOCKER - exit 1 if fails)
  - **Gate P1:** ESLint (BLOCKER - mcp__eslint__lint-files)
  - **Gate P2:** Context7 (IF new library - mcp__context7__get-library-docs)
  - **Gate P3:** Memory (VERIFICATION - project-memory.md updated)
  - **Gate P4:** Observability (TIMELINE - pulseLogger.cjs logging) 🆕 V6.1.3
- ✅ Auto-documentation (5-15 decisions in project-memory.md)
- ✅ Task tracking automatic (sed commands)
- ✅ Real-time observability (observability-pulse.jsonl)
- ✅ Timeline logging (viewPulse.sh viewer)

**Validated:** 2h45 on AdProof.ai (99 tasks, 150+ files, 12K+ lines)
**Token Savings:** -77% with GLM-4.6 (450K→100K implementation tokens)

---

### Phase 4: Verification (5 min)

```bash
# View observability timeline
./scripts/viewPulse.sh
# → Color-coded timeline with checkpoints

# View pulse summary
node scripts/pulseLogger.cjs summary
# → JSON metrics (agents, duration, checkpoints)

# Verify build
pnpm build
# → Expected: Build succeeds (0 errors)

# Verify lint
pnpm lint
# → Expected: 0 errors (warnings acceptable if documented)

# Run tests
pnpm test
# → Expected: Tests pass (or TDD RED state with tests written)

# Check design tokens compliance
grep -r "bg-blue-\|bg-red-\|text-blue-" src/ | wc -l
# → Expected: 0 (all colors from design-tokens.json)
```

---

### Phase 5: Design Import (15 min) - OPTIONAL

```bash
/import-design custom-tokens.json
# Merge your brand colors + fonts (0 breaking changes)
# Time: 15 min vs 1-2 days manual refactor
```

**When:** After designer creates custom brand (in parallel with Phase 3)

---

### Phase 6: Review + Merge (15 min)

```bash
# View PR on GitHub
gh pr view --web

# Review changes
gh pr diff

# Approve and merge
gh pr review --approve
gh pr merge --squash

# Switch to main
git checkout main
git pull

# Delete feature branch
git branch -D feat/mvp
git push origin --delete feat/mvp
```

---

## 📋 Project Context

### Project Identity
- **Name:** Juri - Assistant Juridique & Financier RAG
- **Vision:** Outil interne PME pour répondre aux questions juridiques/fiscales (création SAS France + IR/IS année-1) avec citations officielles (Légifrance, BOFiP). RAG-powered, pas de fine-tuning. Économie 8-10h/mois + €400-800/trim.
- **Phase:** Planning → Design → Implementation → Review

### Tech Stack

**Frontend:**
- Next.js 15 + TypeScript strict mode
- Tailwind CSS + shadcn/ui (minimal, trust-focused design)
- Chat interface + sources sidebar + disclaimer banner (non-dismissible)

**Backend/Database:**
- Supabase PostgreSQL + pgvector (vector search for RAG)
- Supabase Auth (session-based) + RLS (row-level security)
- Hybrid retrieval: 70% dense vector (pgvector) + 30% BM25 keyword

**AI/LLM:**
- Claude 3.5 Sonnet API (zero-retention DPA) OR Ollama local (llama3.2)
- OpenAI text-embedding-3-small (embeddings) OR local multilingual-e5
- RAG pipeline: document ingestion → chunking (500-1000 tokens) → embedding → retrieval → synthesis

**External APIs:**
- PISTE/Légifrance (official French legal API - free account required)
- BOFiP (French tax documentation - HTML scraping or PDFs)
- EUR-Lex (EU law - REST API, deferred to v2.0)

**Deployment:**
- Vercel (Next.js frontend - zero-config, fast deploys)
- Supabase Cloud (database + auth)

**Testing:**
- E2E: 10 predefined legal questions (citation accuracy validation)
- Unit: RAG retrieval accuracy, chunking validation
- Manual: Quarterly source freshness checks

**Dev Tools:**
- Package Manager: pnpm (recommended) or npm
- Linting: ESLint strict (0 errors required)
- Type Check: TypeScript strict mode

### Key Dates
- **Kickoff:** 2025-10-18 (Phase 0: Planning)
- **MVP Target:** 2025-11-01 (1-2 weeks implementation)
- **Launch Target:** 2025-11-15 (after 10-question validation gate)

---

## 📚 Documentation Files

After running Spec-Kit commands, these files will exist:

| File | Generated By | Purpose |
|------|--------------|---------|
| `.specify/memory/constitution.md` | `/speckit.constitution` | Business vision + HIGH-LEVEL decisions |
| `specs/001-mvp/spec.md` | `/speckit.specify` | Technical specification (SQL + API + architecture) |
| `project-memory.md` | `/speckit.init` | Dynamic Memory V5 (WHY behind decisions) |
| `specs/001-mvp/plan.md` | `/speckit.plan` | Implementation plan (file structure + architecture) |
| `specs/001-mvp/tasks.md` | `/speckit.tasks` | 50-100 tasks in CHECKBOXES format (T001, [P], [US1]) |
| `ORCHESTRATION.md` | `/speckit.agents` | Sub-agents allocation + strategy |
| `design/design-tokens.json` | `/speckit.design` | CSS variables (colors, fonts, spacing) |
| `design/wireframes/` | `/speckit.design` | SVG wireframes (low-fidelity mockups) |
| `design/components-list.md` | `/speckit.design` | shadcn/ui components used |
| `observability-pulse.jsonl` | `/speckit.agents` | Timeline logging (JSONL append-only) 🆕 V6.1.3 |

---

## 🎨 Design System

**CRITICAL:** Design/Dev Decoupling from Day 1

### ✅ MUST DO:
- Generate design tokens on Day 1 (`/speckit.design`)
- Use CSS variables ONLY in components: `bg-primary-500` (not `bg-blue-600`)
- All colors/fonts from design-tokens.json
- Read design-tokens.json before writing any component

### ❌ MUST NOT:
- Hardcode colors in components (breaks on brand refresh)
- Mix hardcoded + token approach (inconsistent)
- Skip `/speckit.design` (causes friction later)

### Example Code

**✅ GOOD (Future-proof):**
```tsx
<button className="bg-primary-500 text-neutral-50 font-heading rounded-md">
  Submit
</button>
// When /import-design merges violet brand:
// primary-500: #3B82F6 → #8B5CF6 (automatic, 0 code changes)
```

**❌ BAD (Coupled design):**
```tsx
<button className="bg-blue-600 text-white font-sans rounded-md">
  Submit
</button>
// To change brand: touch 50+ components = 1-2 days nightmare
```

**Phase 5 Bonus:** `/import-design custom-tokens.json` merges your brand in 15 min

---

## ⚡ Quality Gates (MANDATORY Every 10 Tasks) - V6.1.3

| Gate | Priority | Enforcement | Check Command |
|------|----------|-------------|----------------|
| **Build** | P0 BLOCKER | Must pass (exit 1 if fails) | `pnpm build` |
| **Lint** | P1 BLOCKER | 0 errors (mcp__eslint__lint-files) | `pnpm lint` |
| **Context7** | P2 VERIFICATION | IF new library | `mcp__context7__get-library-docs` |
| **Memory** | P3 VERIFICATION | project-memory.md updated | Check 5-15 decisions logged |
| **Observability** | P4 TIMELINE | pulseLogger.cjs logging 🆕 | `node scripts/pulseLogger.cjs summary` |

### Observability Commands (Gate P4) 🆕 V6.1.3

**Agent Start (ONCE per agent):**
```bash
node scripts/pulseLogger.cjs start backend-specialist '{"tasks":35,"focus":"API implementation"}'
```

**Checkpoints (P0/P1/P2/P3 after every 10 tasks):**
```bash
node scripts/pulseLogger.cjs checkpoint build pass '{"exit_code":0,"duration_ms":2340}'
node scripts/pulseLogger.cjs checkpoint lint pass '{"warnings":3,"errors":0}'
node scripts/pulseLogger.cjs checkpoint context7 skip '{"reason":"no new libraries"}'
node scripts/pulseLogger.cjs checkpoint memory pass '{"decisions_documented":2}'
```

**Agent End (ONCE per agent):**
```bash
node scripts/pulseLogger.cjs end backend-specialist '{"duration_s":450,"tasks_completed":35,"files_modified":23}'
```

**Summary (anytime):**
```bash
node scripts/pulseLogger.cjs summary
# → JSON metrics: agents count, duration, checkpoints, errors
```

**Timeline Viewer (after completion):**
```bash
./scripts/viewPulse.sh
# → Color-coded timeline with checkpoints
```

---

## 🔗 Key References

**Archon Orchestrator V6.1.3:**
- [WORKFLOW-V6-MVP.md](https://github.com/BeehiveInnovations/archon-orchestrator/blob/main/docs/WORKFLOW-V6-MVP.md) - Complete workflow
- [CHANGELOG-V6.1.3-OBSERVABILITY.md](https://github.com/BeehiveInnovations/archon-orchestrator/blob/main/changelogs/V6.1.3/CHANGELOG-V6.1.3-OBSERVABILITY.md) - V6.1.3 features
- [GOLDEN-PATTERNS.md](https://github.com/BeehiveInnovations/archon-orchestrator/blob/main/docs/GOLDEN-PATTERNS.md) - Design/Dev Decoupling

**Spec-Kit Official:**
- https://github.com/github/spec-kit (official docs)

**Patterns Applied:**
- Design/Dev Decoupling strategy (15 min brand merge)
- Dynamic Memory V5 (agent-writable during implementation)
- Quality gates framework (5 gates enforced)
- Sub-agents orchestration (backend → frontend → testing)
- Observability timeline (pulseLogger.cjs + viewPulse.sh) 🆕 V6.1.3

**Documentation in Project:**
- `constitution.md` - Business decisions
- `spec.md` - Technical details
- `project-memory.md` - WHY behind implementation choices
- `plan.md` - File structure + architecture
- `tasks.md` - Implementation tasks (50-100 checkboxes)
- `ORCHESTRATION.md` - Sub-agents allocation
- `observability-pulse.jsonl` - Timeline events (JSONL) 🆕 V6.1.3

---

## 🚨 Workflow Tips

### If Confused, Follow This Order:
1. Read this file (you're here!)
2. Run Phase 0: `/zen-roundtable` (optional if vision clear)
3. Run Phase 1 commands **IN ORDER** (don't skip steps)
4. Read generated `constitution.md` + `spec.md`
5. Run Phase 2-3: GitHub + `/speckit.final`
6. Monitor observability: `./scripts/viewPulse.sh` 🆕 V6.1.3

### Common Questions:

**Q: Can I run commands out of order?**
A: No. Follow the order exactly. `/speckit.init` depends on `/speckit.constitution` + `/speckit.specify` outputs.

**Q: Should I skip `/speckit.design`?**
A: NO. Design/Dev decoupling is mandatory. Takes 5 min, saves 1-2 days of refactoring later.

**Q: What is observability-pulse.jsonl?** 🆕 V6.1.3
A: Timeline log (JSONL format). Each line = 1 event (agent_start, checkpoint, agent_end). Used for debugging, metrics, agent coordination.

**Q: What if a command fails?**
A: Check the error message. Most issues = missing prerequisites. Ensure previous steps completed.

**Q: When do I modify this file?**
A: `/speckit.init` will automatically enrich this CLAUDE.md with project-specific context (tech stack, dates, team).

**Q: How do I monitor agent progress?** 🆕 V6.1.3
A: Run `node scripts/pulseLogger.cjs summary` or `./scripts/viewPulse.sh` to see real-time timeline.

### Help & Debugging:

- **Command not found?** → Ensure Claude Code has access to slash commands
- **Permission denied?** → `chmod +x scripts/*.sh`
- **Design tokens missing?** → Run `/speckit.design` (never skip)
- **Lost in workflow?** → Check `project-memory.md` (session notes at bottom)
- **Observability not working?** → Verify `scripts/pulseLogger.cjs` exists (created by `/speckit.agents`)
- **Timeline empty?** → Check `observability-pulse.jsonl` has events (should have ~15-20 lines after completion)

---

## 📊 Timeline Estimate

| Phase | Duration | What Happens |
|-------|----------|--------------|
| **Phase 0** | 5-10 min | Gemini analysis → prompts generated (OPTIONAL) |
| **Phase 1** | 30-35 min | Spec-Kit planning (constitution + spec + design + plan + tasks + agents) |
| **Phase 2** | 2 min | Git branch + commit + PR |
| **Phase 3** | 2h45-3h | Implementation (sub-agents + checkpoints + observability) ⭐ |
| **Phase 4** | 5 min | Verification (build + lint + tests + timeline) |
| **Phase 5** | 15 min | Design import (optional, only if custom brand) |
| **Phase 6** | 15 min | PR review + merge |
| **TOTAL** | ~4-5 hours | Complete MVP ready for production |

**Validated on AdProof.ai MVP:**
- 99 tasks, 150+ files, 12,000+ lines
- Build ✅ | Lint ✅ | Tests ✅ | Design Tokens 100% | Observability ✅
- Token Savings: -77% with GLM-4.6 (450K→100K)

---

## 🎯 Success = Follow Order Exactly

✅ **Next step after reading this file:**

```bash
# Option A: With Multi-IA Analysis (30-45 min)
/zen-roundtable "Brief: [Paste your project description]"

# Option B: Skip to Planning (if vision clear)
/speckit.constitution
```

Then watch this file get enriched by `/speckit.init` with project-specific context! 🚀

---

## 📈 Metrics & ROI (V6.1.3 Validated)

**Time Savings:**
- Overhead: -5 to -10 min (100% automation, 0 copy-paste)
- Execution: -60% (2h45 vs 6-7h estimate)
- Token Savings: -77% implementation (GLM-4.6: 450K→100K)

**Quality:**
- Build: ✅ PASS (P0 blocker enforced)
- Lint: ✅ PASS (P1 blocker enforced)
- Tests: ✅ READY (TDD approach)
- Design Tokens: 100% (0 hardcoded colors)
- Observability: ✅ Complete timeline (15-20 events logged)

**Capacity:**
- Clients/week: 8-12 projects
- Revenue/month: €80K-€100K (@ €2,500/client)
- Cost/month: €140 (Claude Pro + MCP)
- ROI: ×571 to ×714

---

**Generated:** Archon V6.1.3 (Observability Complete)
**Last Updated:** 2025-10-17
**Template Location:** `templates/claudedebut.md`
**Usage:** Copy to new project root as `CLAUDE.md`

**Next Enhancement:** Via `/speckit.init` → enrich tech stack + project identity

---

**🆕 V6.1.3 Features:**
- ✅ Gate P4 Observability (pulseLogger.cjs + viewPulse.sh)
- ✅ Complete Automation (`/speckit.final` - 0 manual steps)
- ✅ 5 Quality Gates ENFORCED (Build + Lint + Context7 + Memory + Observability)
- ✅ Agent Coordination (timeline tracking enables multi-agent sync)
- ✅ Token Savings (-77% implementation with GLM-4.6)
- ✅ Validated (AdProof.ai MVP: 99 tasks, 2h45, 150+ files)

**Mac LOCAL 99% + Full Automation + Complete Observability = Production MVPs at AI Speed** 🚀🔒📊
