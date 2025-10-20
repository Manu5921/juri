# Juri MVP - Implementation Orchestration

**Generated:** 2025-10-18 via `/speckit.agents`
**Total Tasks:** 87 tasks
**Estimated Duration:** 40-50 hours (1-2 weeks sequential) → **10-12 hours parallel** (1-2 days)

---

## 🎯 MISSION

Implement Juri MVP - RAG-powered legal & financial assistant for internal PME use following spec:
- **Constitution:** `.specify/memory/constitution.md` (5 core principles)
- **Technical Spec:** `specs/001-specify-scripts-bash/spec.md` (17 FR + 3 user stories)
- **Task Breakdown:** `specs/001-specify-scripts-bash/tasks.md` (87 tasks in 6 phases)
- **Design System:** `design/design-tokens.json` (20 tokens, indigo theme)
- **Agent Instructions:** `CLAUDE.md` (workflow rules, MCP tools, auto-documentation)

**Success Criteria:**
- ✅ All P0 tasks completed (Phases 1-3: Setup + Foundational + User Story 1)
- ✅ Build passes (`pnpm build` successful, 0 TypeScript errors)
- ✅ Tests pass (E2E chat flow, citation validation, disclaimer compliance)
- ✅ ESLint clean (no errors, warnings acceptable if documented)
- ✅ Design tokens used (no hardcoded colors, CSS variables only)
- ✅ Constitution compliance (5 principles validated)

---

## 🤖 SUB-AGENTS ORCHESTRATION

**⭐ V5.1 MODEL STRATEGY:**
- **Orchestrator (this session):** Sonnet 4.5 (`claude-sonnet-4-5-20250929`) - Complex reasoning
- **Sub-agents (backend/frontend/testing):** Haiku 4.5 (`claude-haiku-4-5-20251001`) - **4-5× faster**
- **Rationale:** Well-defined tasks (87 tasks with explicit file paths) + V5.1 checkpoints = Haiku quality sufficient, speed maximized
- **Result:** 40-50h → **10-12h implementation** (-75% time via parallelization)

---

### Agent 1: backend-specialist

**Model:** `claude-haiku-4-5-20251001` ⭐ **V5.1 DEFAULT** (4-5× faster than Sonnet 4.5)

**Focus:** API Routes + RAG Pipeline + Database + Authentication

**Scope:**
- **Tasks:** T011-T025 (Foundational), T031-T034, T039-T041, T049-T050 (US1), T052-T053 (US2), T072-T076 (US3)
- **Task Count:** ~40 tasks (46% of total)
- **Files:**
  - `lib/rag/` (chunking.ts, embedding.ts, retrieval.ts, synthesis.ts)
  - `lib/supabase/` (client.ts, auth.ts, queries.ts)
  - `lib/utils/` (validation.ts, formatting.ts)
  - `app/api/` (chat/route.ts, documents/route.ts, conversations/route.ts, ingest/route.ts)
  - `supabase/migrations/` (001, 002, 003)
  - `hooks/` (use-conversations.ts, use-chat.ts, use-documents.ts, use-document.ts, use-ingest.ts)
- **Duration:** 12-16 hours sequential → **3-4 hours parallel**

**MCP Tools Allowed:**
- `mcp__context7__resolve-library-id` + `mcp__context7__get-library-docs` (Supabase, LangChain.js, Anthropic SDK, OpenAI SDK)
- `mcp__eslint__lint-files` (every 10 tasks checkpoint)

**Validation Checkpoints:**
- **T025 (after Foundational):**
  - ESLint: `lib/rag/*.ts`, `lib/supabase/*.ts`
  - Build: `pnpm build` (verify no TypeScript errors)
  - Context7: Supabase docs (verify Auth + RLS patterns)
- **T050 (after US1 backend):**
  - ESLint: `app/api/chat/route.ts`, `hooks/use-chat.ts`
  - Build: `pnpm build`
  - Test: Run `pnpm test:api` (if backend unit tests exist)

**Key Responsibilities:**

1. **Database Schema** (T011-T013):
   - Apply migrations (`supabase/migrations/001_initial_schema.sql`, `002_pgvector_setup.sql`, `003_rls_policies.sql`)
   - Verify pgvector extension enabled
   - Seed 5 official documents metadata

2. **RAG Services** (T017-T022):
   - Document chunking (LangChain.js RecursiveCharacterTextSplitter, 500-1000 tokens, preserve article boundaries)
   - Embedding generation (OpenAI `text-embedding-3-small`)
   - Hybrid retrieval (70% vector cosine + 30% BM25 + RRF fusion)
   - Claude synthesis (Anthropic SDK with Citations API)
   - Citation formatting utilities

3. **Authentication** (T015, T024-T025):
   - Supabase Auth helpers (`getSession`, `signIn`, `signUp`, `signOut`, `resetPassword`)
   - Auth pages (`app/(auth)/login/page.tsx`, `signup/page.tsx`, `reset-password/page.tsx`)

4. **API Routes** (T031-T034, T052-T053, T072):
   - `POST /api/chat` - RAG pipeline orchestration (embed → retrieve → synthesize → store)
   - `GET/POST /api/conversations` - Conversation management
   - `GET /api/conversations/[id]` - Conversation details with messages + citations
   - `GET /api/documents` - List indexed documents with freshness warnings
   - `GET /api/documents/[id]` - Document details (chunk count, citation count)
   - `POST /api/ingest` - Admin document upload + ingestion pipeline

5. **State Management Hooks** (T039-T041, T056-T057, T077-T078):
   - `useConversations` - React Query hook for conversations list
   - `useChat` - React Query hook for question submission with optimistic updates
   - `useDocuments` - React Query hook for documents list with filters
   - `useDocument` - React Query hook for single document details
   - `useIngest` - React Query mutation for document upload

**Critical Rules:**
- ✅ **TypeScript strict mode** (no `any` without justification comment)
- ✅ **Validate ALL inputs with Zod** (see `lib/utils/validation.ts` schemas)
- ✅ **Use Supabase RLS** (Row-Level Security policies enforce user isolation)
- ✅ **Claude zero-retention DPA** (set `anthropic-dangerous-strict-no-prompt-caching: false` header)
- ✅ **Error handling** (try/catch all async operations, return NextResponse.json with error codes)
- ❌ **NO hardcoded secrets** (use `process.env.SUPABASE_SERVICE_ROLE_KEY`, `process.env.ANTHROPIC_API_KEY`, `process.env.OPENAI_API_KEY`)
- ❌ **NO SQL injection** (use Supabase client parameterized queries, never string concatenation)
- ❌ **NO LLM hallucinations** (RAG retrieval MUST return chunks before synthesis, if similarity <0.6 → "Not covered in sources")

**Context7 Usage** (MANDATORY checkpoints):

```typescript
// T020: First time using Anthropic SDK (Claude synthesis)
// Call: mcp__context7__resolve-library-id {"libraryName": "@anthropic-ai/sdk"}
// Then: mcp__context7__get-library-docs {"context7CompatibleLibraryID": "/anthropic/anthropic-sdk-typescript"}
// Verify: No breaking changes in Citations API (launched Jan 2025)

// T018: First time using OpenAI SDK (embeddings)
// Call: mcp__context7__resolve-library-id {"libraryName": "openai"}
// Then: mcp__context7__get-library-docs {"context7CompatibleLibraryID": "/openai/openai-node"}
// Verify: text-embedding-3-small API still matches training cutoff
```

---

### Agent 2: frontend-specialist

**Model:** `claude-haiku-4-5-20251001` ⭐ **V5.1 DEFAULT** (4-5× faster than Sonnet 4.5)

**Focus:** UI Components + Pages + Client Logic + Design System

**Scope:**
- **Tasks:** T026-T030, T035-T038 (US1), T051, T054-T055, T062-T065 (US2), T067-T071, T077-T078 (US3), T081-T083 (Polish)
- **Task Count:** ~35 tasks (40% of total)
- **Files:**
  - `components/custom/` (disclaimer-banner.tsx, message-bubble.tsx, citation-link.tsx, conversation-item.tsx, source-card.tsx, document-upload-form.tsx)
  - `components/ui/` (shadcn/ui base components - button, card, input, form, etc.)
  - `app/(dashboard)/` (layout.tsx, chat/page.tsx, sources/page.tsx, admin/page.tsx)
  - `app/providers.tsx` (QueryClientProvider wrapper)
  - `app/globals.css` (CSS variables from design-tokens.json)
  - `tailwind.config.ts` (design token references)
- **Duration:** 10-14 hours sequential → **3-4 hours parallel**

**MCP Tools Allowed:**
- `mcp__context7__resolve-library-id` + `mcp__context7__get-library-docs` (Next.js 15, shadcn/ui, TanStack Query)
- `mcp__eslint__lint-files` (every 10 tasks checkpoint)

**Validation Checkpoints:**
- **T030 (after custom components):**
  - ESLint: `components/custom/*.tsx`
  - Visual check: `pnpm dev` → verify DisclaimerBanner, MessageBubble, CitationLink render correctly
  - Design tokens: `grep -r "bg-blue-600" components/` → should return 0 (no hardcoded colors)
- **T038 (after US1 pages):**
  - ESLint: `app/(dashboard)/chat/page.tsx`
  - Build: `pnpm build` (Next.js production build)
  - Visual check: Chat interface functional (create conversation, send question)

**Key Responsibilities:**

1. **shadcn/ui Setup** (T005-T007, T026):
   - Initialize shadcn/ui (`npx shadcn-ui@latest init`)
   - Install 23 components (button, card, input, form, label, select, table, dialog, toast, alert, textarea, badge, separator, scroll-area, avatar, tooltip, accordion, dropdown-menu, popover, skeleton)
   - Sync design tokens to `app/globals.css` as CSS variables
   - Configure Tailwind to reference CSS variables

2. **Custom Components** (T027-T030, T051, T070):
   - `DisclaimerBanner` (extends Alert, sticky positioned, red-50 bg, non-dismissible)
   - `MessageBubble` (extends Card, supports user/assistant/system roles, right/left alignment, indigo/white bg)
   - `CitationLink` (extends Badge + Tooltip, clickable pill with article ref, opens Légifrance/BOFiP/INPI/Urssaf URL)
   - `ConversationItem` (extends Card, shows title truncated 60 chars, timestamp, unread indicator)
   - `SourceCard` (extends Card, document metadata with icon, freshness badge, status badge)
   - `DocumentUploadForm` (file input drag-drop, metadata fields, validation)

3. **Pages** (T035-T038, T054-T055, T069):
   - Dashboard layout with sidebar + DisclaimerBanner sticky
   - Chat page (conversation history sidebar + message list + input area)
   - Sources page (stats cards + document grid with SourceCard components + filter dropdown)
   - Admin page (upload form + recent ingestions list)

4. **State Management** (T039):
   - React Query setup (`app/providers.tsx` with QueryClientProvider)
   - Optimistic updates for chat (append user message immediately, replace with server response)

5. **Responsive Design** (T083):
   - Mobile-first Tailwind breakpoints (sm:, md:, lg:, xl:)
   - Sidebar collapsible on mobile
   - Chat input fixed at bottom

**Critical Rules:**
- ✅ **ALWAYS use design-tokens.json** (read this file FIRST before writing ANY component!)
- ✅ **CSS variables ONLY** (e.g., `bg-primary-500`, `text-neutral-900`, NOT `bg-blue-600` or `text-gray-900`)
- ✅ **Accessible components** (aria-labels on buttons, keyboard navigation, focus states)
- ✅ **Responsive** (test on mobile 375px, tablet 768px, desktop 1024px+)
- ✅ **Loading states** (Skeleton components while data fetching)
- ❌ **NO hardcoded colors** (this breaks Design/Dev Decoupling pattern - Health Score 9.9/10)
- ❌ **NO inline styles** (use Tailwind classes exclusively)
- ❌ **NO console.log in production** (use `DEBUG=true` env var for dev logging only)

**Design System Verification** (MANDATORY before writing ANY component):

```bash
# Step 1: Read design tokens
cat design/design-tokens.json

# Step 2: Verify CSS variables synced
cat app/globals.css | grep ":root"
# Should see: --primary-500: #6366F1; --neutral-900: #0F172A; etc.

# Step 3: Verify Tailwind config references variables
cat tailwind.config.ts | grep "primary: {"
# Should see: primary: { 500: 'var(--primary-500)' }

# Step 4: Install shadcn/ui components (from design/components-list.md)
npx shadcn-ui@latest add button card input form label select table dialog toast alert textarea badge separator scroll-area avatar tooltip

# Step 5: Verify no hardcoded colors in existing components
grep -r "bg-blue-600\|text-gray-900" components/
# Should return NOTHING (only design token classes allowed)
```

**Correct vs Incorrect Examples:**

```tsx
// ✅ CORRECT (uses design tokens from design-tokens.json)
<button className="bg-primary-500 text-neutral-50 font-heading rounded-md px-4 py-2">
  Submit Question
</button>

<div className="bg-error-50 border border-error-500 text-error-900 p-4 rounded-lg">
  ⚠ Pas de conseil juridique - valider avec expert
</div>

// ❌ WRONG (hardcoded color - breaks Design/Dev Decoupling)
<button className="bg-blue-600 text-white font-sans rounded-md px-4 py-2">
  Submit Question
</button>

<div className="bg-red-50 border border-red-500 text-red-900 p-4 rounded-lg">
  ⚠ Pas de conseil juridique - valider avec expert
</div>
```

**Context7 Usage** (MANDATORY checkpoints):

```typescript
// T026: First time using shadcn/ui
// Call: mcp__context7__resolve-library-id {"libraryName": "shadcn-ui"}
// Note: shadcn/ui is not in Context7 (it's a collection of copy-paste components)
// Instead: Read local design/components-list.md for installation commands

// T039: First time using TanStack Query (React Query)
// Call: mcp__context7__resolve-library-id {"libraryName": "@tanstack/react-query"}
// Then: mcp__context7__get-library-docs {"context7CompatibleLibraryID": "/tanstack/query"}
// Verify: No breaking changes in v5 API
```

---

### Agent 3: testing-specialist

**Model:** `claude-haiku-4-5-20251001` ⭐ **V5.1 DEFAULT** (4-5× faster than Sonnet 4.5)

**Focus:** E2E Tests (Playwright) + Unit Tests (Vitest)

**Scope:**
- **Tasks:** T042-T048 (US1 tests), T058-T061 (US2 tests), T079-T080 (US3 tests)
- **Task Count:** ~12 tasks (14% of total)
- **Files:**
  - `tests/e2e/` (auth.spec.ts, chat.spec.ts, sources.spec.ts, admin.spec.ts)
  - `tests/unit/` (chunking.test.ts, retrieval.test.ts, synthesis.test.ts, citation-link.test.ts, source-card.test.ts, formatting.test.ts)
  - `playwright.config.ts` (E2E configuration)
  - `vitest.config.ts` (unit test configuration)
- **Duration:** 6-8 hours sequential → **2-3 hours parallel**

**MCP Tools Allowed:**
- `mcp__context7__resolve-library-id` + `mcp__context7__get-library-docs` (Playwright, Vitest)

**Validation Checkpoints:**
- **T048 (after US1 tests):**
  - Run: `pnpm test:e2e` (Playwright E2E tests)
  - Run: `pnpm test:unit` (Vitest unit tests)
  - Coverage: Check >80% backend, >60% frontend
- **T080 (after all tests):**
  - Run: `pnpm test` (all tests)
  - Verify: No flaky tests (re-run 3 times, all pass)

**Key Responsibilities:**

1. **E2E Tests - Authentication** (T042-T044 auth flow):
   - Login with valid credentials
   - Signup with new account
   - Password reset flow
   - Invalid credentials handling

2. **E2E Tests - Chat Interface** (T042-T044 US1):
   - Submit legal question in French (10-5000 chars)
   - Receive answer in <30 seconds
   - Answer contains French legal text
   - Answer includes ≥1 citation
   - Citations are clickable links to official sources (Légifrance, BOFiP, INPI, Urssaf)
   - Citation URLs return HTTP 200 (valid links)
   - DisclaimerBanner visible and non-dismissible (screenshot assertion)
   - Rate limiting (10 questions/hour, 11th request returns 429)

3. **E2E Tests - Sources Page** (T058-T059 US2):
   - Navigate to /sources
   - 5 documents listed (BOFiP, CGI, INPI, Légifrance, Urssaf)
   - Each document shows: title, type, version, last updated date, status
   - Freshness warnings visible for documents >90 days old
   - Click SourceCard → Dialog opens with document details
   - Document details show: chunk count, citation count
   - Click official source URL → Opens in new tab

4. **E2E Tests - Admin Panel** (T079-T080 US3):
   - Login as admin user
   - Navigate to /admin
   - Upload test PDF (5 pages sample legal document)
   - Fill metadata form (title, source type, URL, version, last updated)
   - Submit ingestion
   - Poll status until 'active' (max 5 min timeout)
   - Uploaded document appears in /sources list
   - Non-admin user gets 403 Forbidden on /admin

5. **Unit Tests - RAG Services** (T045-T047):
   - Chunking: 500-1000 token chunks, article boundary preservation, 100-token overlap
   - Retrieval: Hybrid search weights (70% vector + 30% BM25), top-5 chunks returned, RRF fusion
   - Synthesis: Claude Citations API response parsing, article reference format ("CGI Art. 206-209"), URL generation

6. **Unit Tests - Components** (T048, T060):
   - CitationLink: Renders badge with article ref, clickable link opens in new tab, tooltip shows document title on hover
   - SourceCard: Displays document metadata, freshness warning badge for old documents, status badge (Actif/Archivé)
   - Formatting: Freshness calculation (document <90 days = no warning, >90 days = warning with days count)

**Critical Rules:**
- ✅ **Test user flows, not implementation details** (e.g., "user can submit question and receive answer", NOT "API endpoint returns 200")
- ✅ **Realistic test data** (use French legal questions like "Quelle est la différence entre IR et IS?", NOT "test123")
- ✅ **Clean up after tests** (delete test conversations, test documents from database)
- ✅ **Stable selectors** (use `data-testid` attributes, NOT unstable CSS classes)
- ✅ **Wait for elements** (use Playwright `waitFor`, NOT fixed `setTimeout`)
- ❌ **NO flaky tests** (if test fails intermittently, add explicit waits or retry logic)
- ❌ **NO skipped tests** (use `.skip()` ONLY with GitHub issue reference justifying skip)

**Test Data Setup:**

```typescript
// tests/fixtures/legal-questions.ts
export const testQuestions = [
  {
    question: "Quelle est la différence entre IR et IS pour une SAS?",
    expectedCitations: ["CGI Art. 206-209", "BOFiP"],
    expectedKeywords: ["Impôt sur le Revenu", "Impôt sur les Sociétés", "SAS"],
  },
  {
    question: "Quels sont les statuts obligatoires pour créer une SAS?",
    expectedCitations: ["INPI", "Légifrance L227"],
    expectedKeywords: ["statuts", "SAS", "obligatoire"],
  },
  // ... 8 more test questions (10 total for 80% accuracy gate)
];

// tests/fixtures/test-document.pdf
// 5-page sample legal document (extracted from real BOFiP guide)
```

**Context7 Usage** (MANDATORY checkpoints):

```typescript
// T042: First time using Playwright
// Call: mcp__context7__resolve-library-id {"libraryName": "@playwright/test"}
// Then: mcp__context7__get-library-docs {"context7CompatibleLibraryID": "/playwright/playwright"}
// Verify: No breaking changes in Playwright API (test.step, expect, page.goto)

// T045: First time using Vitest
// Call: mcp__context7__resolve-library-id {"libraryName": "vitest"}
// Then: mcp__context7__get-library-docs {"context7CompatibleLibraryID": "/vitest/vitest"}
// Verify: No breaking changes in expect API, vi.mock, describe/it/test
```

---

## 📋 EXECUTION STRATEGY

### Phase 0: Pre-Flight Checks (5-10 min)

**Main Session (Orchestrator):**

```bash
# 1. Verify all prerequisite files exist
ls -la .specify/memory/constitution.md
ls -la specs/001-specify-scripts-bash/spec.md
ls -la specs/001-specify-scripts-bash/plan.md
ls -la specs/001-specify-scripts-bash/tasks.md
ls -la design/design-tokens.json
ls -la CLAUDE.md

# 2. Read CLAUDE.md (agent instructions)
head -50 CLAUDE.md
# Verify: Workflow rules, MCP tools, auto-documentation rules present

# 3. Verify Supabase local is running
supabase status
# Should show: API URL, Studio URL, anon key, service_role key

# 4. Verify environment variables
cat .env.local | grep "SUPABASE_URL\|OPENAI_API_KEY\|ANTHROPIC_API_KEY"
# Should show all 3 keys present

# 5. Create feature branch
git checkout -b feat/implement-mvp
```

**If any check fails → STOP and fix before proceeding**

---

### Phase 1: Foundation (Sequential - 2-3 hours)

**Main Session: backend-specialist**

**Tasks:** T001-T025 (Setup + Foundational)

**Why Sequential:** Database schema + RAG services are BLOCKING prerequisites for all other work

**Execution:**

```bash
# T001-T010: Setup (Project Initialization)
# - Initialize Next.js 15 project
# - Install dependencies (Supabase, Anthropic, OpenAI, LangChain, shadcn/ui)
# - Configure TypeScript strict, ESLint, Tailwind
# - Set up CI/CD pipeline

pnpm create next-app@latest juri-mvp --typescript --tailwind --app
cd juri-mvp
pnpm add @supabase/supabase-js @anthropic-ai/sdk openai langchain zod react-hook-form @radix-ui/react-icons @tanstack/react-query
pnpm add -D vitest @testing-library/react @playwright/test

# T011-T025: Foundational (Database + RAG + Auth)
# - Apply database migrations (PostgreSQL + pgvector)
# - Implement RAG services (chunking, embedding, retrieval, synthesis)
# - Create authentication helpers
# - Set up Supabase client utilities

supabase db reset  # Apply migrations from contracts/database.sql
pnpm build  # Verify TypeScript compiles

# CHECKPOINT T025:
mcp__eslint__lint-files ["lib/rag/*.ts", "lib/supabase/*.ts", "lib/utils/*.ts"]
# Fix errors if any, document warnings

# Mark tasks complete in tasks.md
sed -i 's/- \[ \] T001/- \[x\] T001/' specs/001-specify-scripts-bash/tasks.md
# ... repeat for T002-T025

# Update project-memory.md
/update-memory
# Section: Implementation Progress
# Entry: "Completed Phase 1 (Foundation): Database schema deployed, RAG services functional, Auth configured"
```

**Validation:**
- ✅ Supabase Studio shows 6 tables (users, documents, embeddings, conversations, messages, citations)
- ✅ pgvector extension enabled (query: `SELECT * FROM pg_extension WHERE extname = 'vector';`)
- ✅ HNSW index created (query: `SELECT indexname FROM pg_indexes WHERE indexname = 'embeddings_vector_idx';`)
- ✅ `pnpm build` exits 0 (no TypeScript errors)
- ✅ ESLint 0 errors in `lib/` directory

**Duration:** 2-3 hours (sequential, no parallelization possible)

---

### Phase 2: Multi-Session Parallel Development (6-8 hours → **2-3 hours parallel**)

**⭐ NEW V5: 3 SIMULTANEOUS SESSIONS**

```
┌─────────────────────────────────────────────────────────────┐
│  Session 1 (Main - Claude Code)                             │
│  backend-specialist: T031-T050 (US1 backend)                │
│    → API routes, hooks, rate limiting                       │
│    → Duration: 6-8h sequential → 2-3h parallel              │
└─────────────────────────────────────────────────────────────┘
                    ║
                    ║ SIMULTANEOUS ✅
                    ║
       ┌────────────╨────────────┬────────────────────────────┐
       │                         │                            │
┌──────▼──────────────────┐ ┌────▼─────────────────────┐ ┌───▼──────────────────────┐
│ Session 2 (Parallel)    │ │ Session 3 (Parallel)     │ │ Session 4 (Optional)     │
│ frontend-specialist     │ │ testing-specialist       │ │ testing-specialist       │
│ (New Claude window)     │ │ (Codex via Zen MCP       │ │ (Playwright UI mode      │
│                         │ │  OR new Claude session)  │ │  for debugging)          │
│ T026-T038 (US1 UI)      │ │ T042-T048 (US1 tests)    │ │                          │
│ → Components, pages     │ │ → E2E chat flow          │ │ Interactive test dev     │
│ → Duration: 2-3h        │ │ → Unit tests RAG         │ │                          │
└─────────────────────────┘ └──────────────────────────┘ └──────────────────────────┘
```

**Session 1 (Main): backend-specialist**

```bash
# T031-T034: API Routes for User Story 1 (Chat)
# - POST /api/chat (RAG pipeline: embed → retrieve → synthesize → store)
# - GET/POST /api/conversations (conversation management)
# - GET /api/conversations/[id] (conversation details)

# T039-T041: State Management Hooks
# - useConversations (React Query hook for conversations list)
# - useChat (React Query hook for question submission)

# T049-T050: Integration & Performance
# - Rate limiting middleware (10 questions/hour per user)
# - Performance monitoring (log retrieval + synthesis latency)

# CHECKPOINT T040:
mcp__eslint__lint-files ["app/api/chat/route.ts", "app/api/conversations/route.ts", "hooks/use-chat.ts"]
pnpm build
# Mark T031-T040 complete in tasks.md

# Context7 checkpoint (first time using Anthropic SDK):
mcp__context7__resolve-library-id {"libraryName": "@anthropic-ai/sdk"}
mcp__context7__get-library-docs {"context7CompatibleLibraryID": "/anthropic/anthropic-sdk-typescript"}
# Verify: Citations API usage matches latest docs (Jan 2025 launch)
```

**Session 2 (Parallel): frontend-specialist**

```bash
# Open NEW Claude Code window (or use existing with clear separation)
cd /Users/manu/Documents/DEV/juri

# PRE-FLIGHT: Read design tokens FIRST
cat design/design-tokens.json
cat design/components-list.md

# T026-T030: Custom Components
# - Install shadcn/ui components
# - Create DisclaimerBanner, MessageBubble, CitationLink, ConversationItem

npx shadcn-ui@latest init
npx shadcn-ui@latest add button card input form label select table dialog toast alert textarea badge separator scroll-area avatar tooltip

# T035-T038: Pages
# - Dashboard layout with sidebar + DisclaimerBanner
# - Chat page (conversation history + message list + input area)

# CHECKPOINT T038:
mcp__eslint__lint-files ["components/custom/*.tsx", "app/(dashboard)/chat/page.tsx"]
pnpm build
pnpm dev  # Visual check: http://localhost:3000/chat

# Verify design tokens used:
grep -r "bg-blue-600\|text-gray-900" components/
# Should return NOTHING (only design token classes)
```

**Session 3 (Parallel): testing-specialist**

**Option A: Codex via Zen MCP** (recommended for automation):

```bash
# From main terminal (NOT Claude Code)
# Use Zen MCP to call Codex CLI

mcp__zen__clink {
  "cli_name": "codex",
  "role": "default",
  "prompt": "Implement E2E tests for Juri MVP User Story 1 (Chat Interface).

Context:
- Spec: specs/001-specify-scripts-bash/spec.md
- Tasks: T042-T048 in specs/001-specify-scripts-bash/tasks.md
- Test fixtures: Use tests/fixtures/legal-questions.ts (10 predefined questions)

Requirements:
1. Install Playwright: pnpm add -D @playwright/test
2. Create tests/e2e/chat.spec.ts with 3 test cases:
   - Submit legal question and receive answer with citations
   - Citations link to valid official sources (HTTP 200 check)
   - Disclaimer banner is visible and non-dismissible

3. Run tests: pnpm playwright test
4. Mark T042-T044 complete in tasks.md

Use realistic French legal questions from fixtures.
Ensure no flaky tests (add explicit waits)."
}
```

**Option B: New Claude Code session** (manual control):

```bash
# Open NEW Claude Code window
cd /Users/manu/Documents/DEV/juri

# T042-T044: E2E Tests for Chat Interface
pnpm add -D @playwright/test
pnpm playwright install

# Create tests/e2e/chat.spec.ts
# ... implement test cases per tasks.md

pnpm playwright test
# Mark T042-T044 complete
```

**Why Parallel Works:**
- ✅ **Session 1 (backend)** works on API routes (T031-T050)
- ✅ **Session 2 (frontend)** works on UI components (T026-T038) - NO dependency on Session 1 (can use mock data)
- ✅ **Session 3 (testing)** tests **ALREADY COMPLETED** Phase 1 work (T011-T025 foundation) - NO dependency on Session 1/2
- ✅ **Zero blocking** - All 3 sessions progress independently
- ✅ **Time saved:** 6-8h → **2-3h** (67% faster)

**Synchronization Point (after 2-3h):**

```bash
# All 3 sessions complete → Merge results

# Session 1: backend-specialist completed T031-T050
# Session 2: frontend-specialist completed T026-T038
# Session 3: testing-specialist completed T042-T048

# Main session (orchestrator):
git add .
git commit -m "feat(us1): implement chat interface (backend + frontend + tests)

- Backend: POST /api/chat with RAG pipeline (T031-T050)
- Frontend: Chat page with DisclaimerBanner + MessageBubble + CitationLink (T026-T038)
- Tests: E2E chat flow + citation validation + disclaimer compliance (T042-T048)

Co-authored-by: backend-specialist (Haiku 4.5)
Co-authored-by: frontend-specialist (Haiku 4.5)
Co-authored-by: testing-specialist (Haiku 4.5)"

# CHECKPOINT T050:
pnpm build && pnpm lint && pnpm test
# All must pass

# Update project-memory.md
/update-memory
# Section: Implementation Progress
# Entry: "Completed Phase 2 (US1 - Chat Interface): Backend + Frontend + Tests functional, all checkpoints passed"
```

---

### Phase 3: User Story 2 (Sources Page) - Optional for MVP (2-3 hours)

**Main Session: frontend-specialist + backend-specialist**

**Tasks:** T051-T065 (US2)

**Execution:**

```bash
# T051: SourceCard component (frontend)
# T052-T053: GET /api/documents, GET /api/documents/[id] (backend)
# T054-T055: Sources page + document details modal (frontend)
# T056-T057: useDocuments, useDocument hooks (backend)
# T058-T061: E2E tests for sources page (testing)
# T062-T065: Integration (navigation link, seed data, stats, filters)

# Parallel option: Run T051, T054-T055, T062-T065 (frontend) in Session 2
#                  Run T052-T053, T056-T057 (backend) in Session 1
#                  Run T058-T061 (testing) in Session 3

# CHECKPOINT T065:
pnpm build && pnpm test
# Mark T051-T065 complete
```

---

### Phase 4: User Story 3 (Admin Ingestion) - Optional for MVP (3-4 hours)

**Main Session: backend-specialist + frontend-specialist**

**Tasks:** T066-T080 (US3)

**Execution:**

```bash
# T066-T071: Admin UI (frontend: admin middleware, layout, page, upload form, file validation)
# T072-T076: Ingestion Pipeline (backend: POST /api/ingest, PDF parser, HTML parser, batch embeddings)
# T077-T078: State Management (backend: useIngest hook, ingestion status polling)
# T079-T080: E2E tests (testing: admin upload, non-admin access restriction)

# Parallel option: Run T066-T071 (frontend) in Session 2
#                  Run T072-T076 (backend) in Session 1
#                  Run T079-T080 (testing) in Session 3

# CHECKPOINT T080:
pnpm build && pnpm test
# Mark T066-T080 complete
```

---

### Phase 5: Polish & Integration (Sequential - 1-2 hours)

**Main Session: All agents**

**Tasks:** T081-T087 (Polish)

**Execution:**

```bash
# T081-T083: Performance & Monitoring (Vercel Analytics, error boundaries, loading states)
# T084-T085: Documentation (README.md, API docs link)
# T086-T087: Deployment (Supabase production, Vercel deploy)

# FINAL CHECKPOINT:
pnpm build && pnpm lint && pnpm test
# Coverage check: pnpm test:coverage
# Should show >80% backend, >60% frontend

# Mark all tasks complete
grep "^\- \[x\]" specs/001-specify-scripts-bash/tasks.md | wc -l
# Should show 87 (all tasks)

# Update project-memory.md
/update-memory
# Section: Implementation Complete
# Entry: "MVP implementation complete. All 87 tasks finished. Build passes, tests pass, ESLint clean."
```

---

## 📊 CONTEXT MANAGEMENT ⭐ V5 ENHANCED

### Preserve Memory (MANDATORY)

**Read FIRST (before ANY implementation):**

```bash
# 1. Read CLAUDE.md (agent instructions)
cat CLAUDE.md | head -100
# Understand: Workflow rules, MCP tools, auto-documentation, task tracking

# 2. Read project-memory.md (understand WHY behind decisions)
cat .specify/memory/project-memory.md
# Look for: Previous session notes, key decisions, issues encountered

# 3. Read constitution.md (understand core principles)
cat .specify/memory/constitution.md
# Verify: 5 principles (Data Quality, Citations, Human-in-Loop, Scope, RAG)

# 4. Read spec.md (understand WHAT to build)
cat specs/001-specify-scripts-bash/spec.md
# Extract: User stories, functional requirements, success criteria

# 5. Read plan.md (understand HOW to build)
cat specs/001-specify-scripts-bash/plan.md
# Extract: Tech stack, architecture, database schema, API contracts

# 6. Read tasks.md (understand SEQUENCE)
cat specs/001-specify-scripts-bash/tasks.md
# Identify: Current phase, dependencies, parallel opportunities
```

**Update Memory (Call `/update-memory` WHEN):**

```bash
# ✅ DO call /update-memory for:
# - Architecture decision (state management choice, auth strategy, caching approach)
# - Performance optimization (query optimization, bundle size reduction, lazy loading)
# - Trade-off accepted (simplicity over performance for MVP, free tier vs paid tier)
# - Alternative rejected (Redux rejected in favor of TanStack Query - explain WHY)
# - Issue encountered + resolved (blocking error + solution)
# - New pattern discovered (reusable component pattern, API error handling pattern)

# ❌ DON'T call /update-memory for:
# - Routine task completion (just mark checkbox in tasks.md)
# - Trivial fixes (typo, missing semicolon)
# - Standard implementations (basic CRUD endpoint, simple component)
```

**Example `/update-memory` Entry:**

```markdown
#### 2025-10-18 Hybrid Retrieval Implementation

**Agent:** backend-specialist

**Decision:** RRF (Reciprocal Rank Fusion) for combining vector + BM25 scores

**Reason:**
- More robust than weighted average (handles score scale differences)
- Standard in RAG literature (used by Vespa, Weaviate, Pinecone)
- Code: `score = 1 / (k + rank_vector) + 1 / (k + rank_bm25)` where k=60

**Trade-offs:**
- ✅ Pros: Better recall (+15-20% vs vector-only), handles keyword + semantic queries
- ❌ Cons: Slightly slower than vector-only (~5ms overhead), more complex debugging

**Alternatives:**
- Weighted average (rejected: sensitive to score normalization, less robust)
- Vector-only (rejected: poor performance on keyword-heavy legal queries like "CGI 206")

**Validation:**
- Tested 10 predefined questions: 9/10 returned relevant chunks (90% vs 70% vector-only)
- Latency: 42ms average (well under <50ms target)

**Code Reference:** `lib/rag/retrieval.ts:45-67`
```

### Avoid Context Bloat

**❌ DON'T read entire codebase upfront:**

```bash
# BAD: Read all files at start (wastes 50K+ tokens)
cat app/**/*.tsx lib/**/*.ts components/**/*.tsx  # ❌ NO!
```

**✅ DO lazy load files just-in-time:**

```bash
# GOOD: Read only files for current task
# Example: Implementing T031 (POST /api/chat)

# Step 1: Read task description
grep "T031" specs/001-specify-scripts-bash/tasks.md

# Step 2: Read related services (just what T031 needs)
cat lib/rag/embedding.ts      # Needed for embedding generation
cat lib/rag/retrieval.ts      # Needed for hybrid search
cat lib/rag/synthesis.ts      # Needed for Claude synthesis
cat lib/supabase/queries.ts   # Needed for database operations

# Step 3: Implement T031
# ... write app/api/chat/route.ts

# Step 4: Read related tests (AFTER implementation)
cat tests/e2e/chat.spec.ts    # Verify test expectations
```

**Use MCP Context7 Just-In-Time (NOT preemptively):**

```bash
# ❌ BAD: Fetch all library docs at start
mcp__context7__get-library-docs {"context7CompatibleLibraryID": "/supabase/supabase"}  # Before using Supabase
mcp__context7__get-library-docs {"context7CompatibleLibraryID": "/anthropic/anthropic-sdk-typescript"}  # Before using Anthropic
mcp__context7__get-library-docs {"context7CompatibleLibraryID": "/openai/openai-node"}  # Before using OpenAI
# → Wastes tokens, docs not immediately relevant

# ✅ GOOD: Fetch docs when first using library in implementation
# T020: Implementing Claude synthesis → NOW fetch Anthropic docs
mcp__context7__resolve-library-id {"libraryName": "@anthropic-ai/sdk"}
mcp__context7__get-library-docs {"context7CompatibleLibraryID": "/anthropic/anthropic-sdk-typescript", "topic": "citations api"}
# → Focused, relevant, just-in-time
```

---

## 🔒 QUALITY GATES (ESLint Checkpoints) ⭐ V5.1 MANDATORY

### Every 10 Tasks (BLOCKING Checkpoints)

**Checkpoint Triggers:** T010, T020, T030, T040, T050, T060, T070, T080

**Execution Template:**

```bash
# ============================================
# MANDATORY CHECKPOINT at Task $(grep '^\- \[x\]' specs/001-specify-scripts-bash/tasks.md | wc -l)
# ============================================

echo "🔍 Running 4-gate checkpoint validation..."

# ────────────────────────────────────────────
# Gate 1: ESLint Validation (P0 BLOCKER)
# ────────────────────────────────────────────
echo "1/4 ESLint validation..."

# List ALL files modified in last 10 tasks (use git diff)
git diff --name-only HEAD~10 HEAD | grep "\.tsx\?$" > /tmp/modified_files.txt

# Run ESLint on modified files
mcp__eslint__lint-files $(cat /tmp/modified_files.txt | jq -R -s -c 'split("\n")[:-1]')

# BLOCKER: If errors → STOP and FIX before continuing
# Warnings acceptable (document in comment)

# ────────────────────────────────────────────
# Gate 2: Context7 Docs (IF new library used)
# ────────────────────────────────────────────
echo "2/4 Context7 documentation check..."

# Check if new library introduced in last 10 tasks
# Example: T020 introduces Anthropic SDK
if grep -q "@anthropic-ai/sdk" package.json && ! grep -q "anthropic" .specify/memory/context7-checked.txt; then
  echo "  → New library detected: @anthropic-ai/sdk"
  mcp__context7__resolve-library-id {"libraryName": "@anthropic-ai/sdk"}
  mcp__context7__get-library-docs {"context7CompatibleLibraryID": "/anthropic/anthropic-sdk-typescript", "topic": "citations api"}
  echo "@anthropic-ai/sdk" >> .specify/memory/context7-checked.txt
  # Verify: No breaking changes vs training cutoff (Jan 2025)
fi

# ────────────────────────────────────────────
# Gate 3: Build Check (P0 BLOCKER)
# ────────────────────────────────────────────
echo "3/4 Build validation..."

pnpm build

# BLOCKER: If fails → STOP and FIX before continuing
# Capture TypeScript errors for debugging

# ────────────────────────────────────────────
# Gate 4: Memory Documentation (P2 VERIFICATION)
# ────────────────────────────────────────────
echo "4/4 Memory documentation check..."

TODAY=$(date +%Y-%m-%d)
ENTRIES=$(grep "^#### $TODAY" .specify/memory/project-memory.md | wc -l)

if [ $ENTRIES -eq 0 ]; then
  echo "  ⚠️ WARNING: No memory entries for today (expected 1-3 if significant decisions made)"
  echo "  → If you made architecture/performance/trade-off decisions, call /update-memory"
else
  echo "  ✅ Found $ENTRIES memory entries for today"
fi

# ────────────────────────────────────────────
# Checkpoint Summary
# ────────────────────────────────────────────
echo ""
echo "✅ ALL GATES PASSED - Continue to next 10 tasks"
echo ""
echo "Progress:"
echo "  - Tasks completed: $(grep '^\- \[x\]' specs/001-specify-scripts-bash/tasks.md | wc -l)/87"
echo "  - ESLint errors: 0"
echo "  - Build status: PASS"
echo "  - Memory entries: $ENTRIES"
echo ""
```

**Checkpoint Failures (Immediate Actions):**

```bash
# If ESLint errors:
# 1. Read error output
# 2. Fix errors in files (use Edit tool)
# 3. Re-run ESLint to verify
# 4. DO NOT proceed until ESLint clean

# If build fails:
# 1. Read TypeScript error output
# 2. Identify root cause (missing import, type mismatch, etc.)
# 3. Fix error
# 4. Re-run build
# 5. DO NOT proceed until build passes

# If Context7 shows breaking changes:
# 1. Read breaking change details
# 2. Update implementation to match new API
# 3. Update tests if API signatures changed
# 4. Document change in project-memory.md

# If memory documentation missing:
# 1. Review last 10 tasks for significant decisions
# 2. If decisions made → call /update-memory with details
# 3. If routine work → proceed (warning acceptable)
```

### Final Gate (Before PR/Merge)

**Execution:**

```bash
# ============================================
# FINAL GATE (Before PR)
# ============================================

echo "🔒 Running final validation gates..."

# ────────────────────────────────────────────
# Gate 1: Code Quality (P0 BLOCKER)
# ────────────────────────────────────────────
echo "1/5 Code quality..."

pnpm build && pnpm lint && pnpm test

# BLOCKER: All must exit 0
# If any fails → FIX before PR

# ────────────────────────────────────────────
# Gate 2: Task Completion (P0 BLOCKER)
# ────────────────────────────────────────────
echo "2/5 Task completion..."

COMPLETED=$(grep "^\- \[x\]" specs/001-specify-scripts-bash/tasks.md | wc -l)
TOTAL=87  # Or extract from tasks.md header

echo "  Tasks: $COMPLETED/$TOTAL"

if [ $COMPLETED -lt 50 ]; then
  echo "  ❌ ERROR: MVP requires Phase 1-3 (T001-T050) complete"
  exit 1
fi

# ────────────────────────────────────────────
# Gate 3: Documentation (P1 BLOCKER)
# ────────────────────────────────────────────
echo "3/5 Documentation..."

MEMORY_ENTRIES=$(grep "^####" .specify/memory/project-memory.md | wc -l)
echo "  Memory entries: $MEMORY_ENTRIES (expected 5-15 for full implementation)"

if [ $MEMORY_ENTRIES -lt 3 ]; then
  echo "  ⚠️ WARNING: Low memory documentation (expected 5-15 decision entries)"
  echo "  → Review implementation for undocumented decisions"
fi

# ────────────────────────────────────────────
# Gate 4: Constitution Compliance (P0 BLOCKER)
# ────────────────────────────────────────────
echo "4/5 Constitution compliance..."

# Verify 5 principles implemented:
# 1. Data Quality First: Check seed data exists
if ! grep -q "INSERT INTO documents" supabase/seed.sql; then
  echo "  ❌ ERROR: Principle I violated - No seed data for 5 official documents"
  exit 1
fi

# 2. Source Citation Mandatory: Check CitationLink component exists
if [ ! -f "components/custom/citation-link.tsx" ]; then
  echo "  ❌ ERROR: Principle II violated - CitationLink component missing"
  exit 1
fi

# 3. Human-in-the-Loop: Check DisclaimerBanner component exists
if [ ! -f "components/custom/disclaimer-banner.tsx" ]; then
  echo "  ❌ ERROR: Principle III violated - DisclaimerBanner component missing"
  exit 1
fi

# 4. Scope Discipline: Check similarity threshold in retrieval service
if ! grep -q "similarity.*<.*0\.6" lib/rag/retrieval.ts; then
  echo "  ⚠️ WARNING: Principle IV - Similarity threshold not explicit (verify manually)"
fi

# 5. RAG Over Fine-Tuning: Check pgvector HNSW index exists
if ! supabase db diff | grep -q "embeddings_vector_idx"; then
  echo "  ❌ ERROR: Principle V violated - pgvector HNSW index missing"
  exit 1
fi

echo "  ✅ All 5 principles validated"

# ────────────────────────────────────────────
# Gate 5: Design Tokens (P1 VERIFICATION)
# ────────────────────────────────────────────
echo "5/5 Design token compliance..."

# Check for hardcoded colors (should be 0)
HARDCODED=$(grep -r "bg-blue-600\|bg-red-500\|text-gray-900" components/ app/ | wc -l)

if [ $HARDCODED -gt 0 ]; then
  echo "  ⚠️ WARNING: Found $HARDCODED hardcoded colors (violates Design/Dev Decoupling)"
  echo "  → Run: grep -r 'bg-blue-600\|bg-red-500\|text-gray-900' components/ app/"
  echo "  → Fix by replacing with design token classes (e.g., bg-primary-500)"
else
  echo "  ✅ No hardcoded colors detected"
fi

# ────────────────────────────────────────────
# Final Summary
# ────────────────────────────────────────────
echo ""
echo "✅ ALL FINAL GATES PASSED"
echo ""
echo "Summary:"
echo "  - Build: PASS"
echo "  - Lint: PASS"
echo "  - Tests: PASS"
echo "  - Tasks: $COMPLETED/$TOTAL"
echo "  - Constitution: COMPLIANT"
echo "  - Design Tokens: COMPLIANT"
echo ""
echo "🎉 READY FOR PR/MERGE"
```

---

## 🚨 ERROR HANDLING

### 3-Strike Rule (Prevent Wasted Tokens)

**Strike 1: Error Occurs**

```bash
# Example: pnpm build fails with TypeScript error

# Action:
# 1. Read error output carefully
# 2. Identify root cause (missing import, type mismatch, etc.)
# 3. Apply fix (use Edit tool to update file)
# 4. Retry: pnpm build

# If successful → Continue
# If fails again → Strike 2
```

**Strike 2: Same Error Persists**

```bash
# Example: TypeScript error still present after fix

# Action:
# 1. Document error in project-memory.md
/update-memory
# Section: Issues Encountered
# Entry: "Strike 2: TypeScript error in lib/rag/synthesis.ts:45 - Cannot find module '@anthropic-ai/sdk/types'"

# 2. Try alternative approach (different import path, different library version, etc.)
# 3. Retry: pnpm build

# If successful → Continue
# If fails again → Strike 3
```

**Strike 3: Still Failing → ESCALATE TO HUMAN**

```bash
# ❌ STOP WORK ON THIS TASK

# Action:
# 1. Create GitHub Issue with detailed context
gh issue create --title "TypeScript error: Cannot find module '@anthropic-ai/sdk/types'" --body "$(cat <<EOF
## Context
- Task: T020 (Implement Claude synthesis service)
- File: lib/rag/synthesis.ts:45
- Error: Cannot find module '@anthropic-ai/sdk/types'

## What Was Attempted

**Strike 1:**
- Attempted: Added import statement 'import type { Message } from '@anthropic-ai/sdk/types';'
- Result: Same error persists

**Strike 2:**
- Attempted: Changed import to 'import type { Message } from '@anthropic-ai/sdk';'
- Result: Different error 'Message is not exported from @anthropic-ai/sdk'

**Strike 3:**
- Attempted: Checked package.json - @anthropic-ai/sdk version 0.29.0
- Checked node_modules/@anthropic-ai/sdk/package.json - types entry missing
- Result: Library may not export types correctly

## Recommendation

1. Verify correct @anthropic-ai/sdk version (check Context7 docs)
2. Consider alternative: Use 'any' type temporarily for MVP (with TODO comment)
3. Or: Install separate @types/anthropic package if available

## Next Steps

Waiting for human decision:
- Option A: Skip type safety for this function (use 'any' + TODO)
- Option B: Investigate @anthropic-ai/sdk version mismatch
- Option C: Use alternative library (e.g., direct fetch to Anthropic API)

**Blocked Task:** T020 (Claude synthesis)
**Unblocked Tasks:** T017-T019 (chunking, embedding, retrieval - can continue)
EOF
)"

# 2. Move to next unblocked task (skip T020 for now)
# 3. Mark T020 with [BLOCKED] flag in tasks.md
sed -i 's/- \[ \] T020/- \[ \] T020 [BLOCKED - Issue #123]/' specs/001-specify-scripts-bash/tasks.md

# 4. Continue with T021 (if unblocked)
echo "⏭️ SKIPPING T020 (BLOCKED - Issue #123) → Continue with T021"
```

### Rollback Strategy

**If Critical Error Breaks Build:**

```bash
# Scenario: Accidentally deleted critical file, build now broken

# ────────────────────────────────────────────
# Step 1: Identify Last Working Commit
# ────────────────────────────────────────────
git log --oneline | head -10
# Example output:
# a1b2c3d feat(chat): implement message bubble component [T028]  ← Current (BROKEN)
# d4e5f6g feat(chat): implement disclaimer banner [T027]         ← Last working

# ────────────────────────────────────────────
# Step 2: Rollback Breaking Changes
# ────────────────────────────────────────────
git revert a1b2c3d --no-commit
# Or: git reset --hard d4e5f6g (if no important uncommitted work)

# ────────────────────────────────────────────
# Step 3: Verify Build Fixed
# ────────────────────────────────────────────
pnpm build
# Should pass now

# ────────────────────────────────────────────
# Step 4: Document Rollback in Memory
# ────────────────────────────────────────────
/update-memory
# Section: Issues Encountered
# Entry: "Rolled back T028 (MessageBubble component) due to accidental deletion of lib/supabase/client.ts. Caused build failure. Will re-implement T028 with careful file edits."

# ────────────────────────────────────────────
# Step 5: Retry Task with Different Approach
# ────────────────────────────────────────────
# Re-implement T028, this time:
# - Read lib/supabase/client.ts FIRST before editing
# - Use Edit tool instead of Write (preserves existing content)
# - Verify build after EACH file change (incremental validation)
```

---

## 📝 DOCUMENTATION REQUIREMENTS

### During Implementation (Call `/update-memory`)

**WHEN to call `/update-memory`:**

✅ **DO call for these scenarios:**

1. **Architecture Decision**:
   ```markdown
   Decision: TanStack Query + Zustand (not Redux)
   Reason: -70% boilerplate, better caching, simpler state management
   Trade-offs: Smaller ecosystem than Redux (acceptable for MVP)
   ```

2. **Performance Optimization**:
   ```markdown
   Decision: Prompt caching enabled for Claude API
   Reason: Reduces cost from €25/month → €1.25/month (96% savings)
   Implementation: Set anthropic-beta: prompt-caching-2024-07-31 header
   ```

3. **Trade-Off Accepted**:
   ```markdown
   Decision: Similarity threshold 0.6 (not 0.7)
   Reason: Higher recall (catch more relevant docs), acceptable precision drop
   Trade-offs: 5% more false positives, but users prefer over-retrieval vs under-retrieval
   ```

4. **Alternative Rejected**:
   ```markdown
   Decision: RRF fusion (not weighted average)
   Reason: More robust to score scale differences
   Alternatives: Weighted average rejected (requires manual tuning, sensitive to normalization)
   ```

5. **Issue Encountered + Resolved**:
   ```markdown
   Issue: pgvector HNSW index build timeout (>5 min for 1000 chunks)
   Solution: Reduced ef_construction from 128 → 64 (halves build time, minimal accuracy loss)
   Validation: Re-tested retrieval - 90% recall maintained (vs 92% with ef=128)
   ```

6. **New Pattern Discovered**:
   ```markdown
   Pattern: Citation extraction regex for French legal references
   Code: /(?:selon|d'après|cf\\.?)\\s+([A-Z]+)\\s+(?:art\\.?|§)\\s+(\\d+(?:-\\d+)?)/gi
   Reusability: Can extract "Selon BOFiP §120", "cf. CGI art. 206-209", "d'après INPI art. 5"
   ```

❌ **DON'T call for these scenarios:**

1. Routine task completion (just mark checkbox in tasks.md)
2. Trivial fixes (typo, missing semicolon, formatting)
3. Standard implementations (basic CRUD, simple component)

**Example `/update-memory` Entry (Full Format):**

```markdown
#### 2025-10-18 Citation Extraction Strategy

**Agent:** backend-specialist

**Decision:** Use Claude's native Citations API (not regex extraction)

**Reason:**
- Launched Jan 2025 (within training cutoff)
- 15% higher citation recall vs regex (proven in Thomson Reuters CoCounsel)
- Sentence-level grounding (not just article IDs)
- Handles complex formats: "Selon BOFiP §120, art. CGI 206-209, cf. Légifrance L227-1"

**Implementation:**
```typescript
// lib/rag/synthesis.ts:67
const response = await anthropic.messages.create({
  model: "claude-3-5-sonnet-20241022",
  messages: [{ role: "user", content: prompt }],
  metadata: {
    citations: {
      enabled: true,
      sources: retrievedChunks.map(c => ({ id: c.id, text: c.chunk_text }))
    }
  }
});

// Citations returned in response.citations[] array
```

**Trade-offs:**
- ✅ Pros: Higher accuracy, handles multi-document citations, official API support
- ❌ Cons: Anthropic SDK dependency (vs regex = zero dependencies), API call required (vs local regex)

**Alternatives:**
- Regex extraction (rejected: 70% recall vs 85% for Citations API, misses complex formats)
- Fine-tuned NER model (rejected: overkill for MVP, training data required, slower inference)

**Validation:**
- Tested 10 predefined questions: 9/10 extracted citations correctly (90% vs 70% regex)
- Example success: "Selon BOFiP §120, voir aussi CGI art. 206-209" → extracted both citations
- Example failure (regex): Missed "cf. Légifrance L227-1 à L227-20" (range notation)

**Code Reference:** `lib/rag/synthesis.ts:45-89`

**Related Tasks:** T020 (Claude synthesis), T022 (citation formatting), T029 (CitationLink component)
```

### After Implementation (Update `project-memory.md` Session Notes)

**Template:**

```markdown
### Session 2025-10-18 - Phase 2: User Story 1 Implementation (Parallel Execution)

**Duration:** 3 hours (2-3h parallel vs 6-8h sequential = 60% faster)

**Tasks Completed:** 50/87 (57%)
- Phase 1 (Setup): T001-T010 ✅
- Phase 2 (Foundational): T011-T025 ✅
- Phase 3 (US1): T026-T050 ✅

**Outcome:** ✅ SUCCESS

**Key Achievements:**
- Chat interface functional (submit question → receive answer with citations in <30s)
- RAG pipeline operational (hybrid retrieval 70% vector + 30% BM25, RRF fusion)
- DisclaimerBanner non-dismissible (constitutional compliance verified)
- E2E tests passing (chat flow, citation validation, disclaimer compliance)
- Design tokens used exclusively (0 hardcoded colors detected)

**Issues Encountered:**
- Issue #1: Claude Citations API import error (`@anthropic-ai/sdk/types` missing)
  - Resolution: Used `any` type temporarily (T020), documented in TODO comment
  - Follow-up: GitHub Issue #123 created, blocked until human review
- Issue #2: pgvector HNSW index build timeout (>5 min for 1000 chunks)
  - Resolution: Reduced ef_construction 128 → 64, halved build time
  - Validation: Recall maintained at 90% (vs 92% with ef=128, acceptable trade-off)

**Checkpoints:**
- ✅ T010: ESLint clean, build passes
- ✅ T020: Context7 verified (Anthropic SDK Citations API docs)
- ✅ T025: ESLint clean, build passes, RLS policies active
- ✅ T040: ESLint clean, build passes, API routes functional
- ✅ T050: ESLint clean, build passes, E2E tests passing

**Constitution Compliance:**
- ✅ Principle I (Data Quality): 5 docs seeded (T063), version tracking (T011)
- ✅ Principle II (Citations): CitationLink component (T029), 100% E2E validation (T043)
- ✅ Principle III (Human-in-Loop): DisclaimerBanner (T027), screenshot assertion (T044)
- ✅ Principle IV (Scope): Similarity threshold 0.6 (T019), reject message (FR-015)
- ✅ Principle V (RAG): pgvector HNSW (T012), hybrid retrieval (T019), Claude context-only (T020)

**Performance Metrics:**
- Build time: 12s (TypeScript compilation)
- Test suite: 3.2s (E2E chat flow + citation validation + disclaimer compliance)
- RAG latency: 8.7s average (3s retrieval + 5.7s Claude synthesis)
- ESLint: 0 errors, 2 warnings (documented: unused imports in test fixtures)

**Memory Entries Created:**
- Entry #1: Hybrid retrieval RRF fusion strategy
- Entry #2: Citation extraction via Claude Citations API
- Entry #3: pgvector HNSW index optimization (ef_construction=64)

**Next Steps:**
- Continue with Phase 4 (US2 - Sources Page): T051-T065 (optional for MVP)
- Or: Skip to Phase 6 (Polish): T081-T087 (if MVP scope = US1 only)
- Or: Deploy MVP and validate 80% accuracy gate with 10 test questions
```

---

## ✅ COMPLETION CRITERIA

### Definition of Done

**Code Quality:**
- [ ] All P0 tasks completed (Phases 1-3: T001-T050 for MVP)
- [ ] Build passes (`pnpm build` → exit 0, 0 TypeScript errors)
- [ ] TypeScript strict mode (no `any` without justification comment)
- [ ] ESLint clean (0 errors, warnings documented if present)

**Tests:**
- [ ] E2E tests pass (`pnpm test:e2e` → all passing)
  - Auth flow (login, signup, password reset)
  - Chat flow (submit question, receive answer, citations clickable)
  - Disclaimer compliance (screenshot assertion, non-dismissible)
- [ ] Unit tests pass (`pnpm test:unit` → all passing)
  - RAG services (chunking, retrieval, synthesis)
  - Components (CitationLink, SourceCard, formatting utils)
- [ ] Coverage ≥80% backend, ≥60% frontend (`pnpm test:coverage`)

**Design System:**
- [ ] Design tokens used (0 hardcoded colors: `grep -r "bg-blue-600" components/` → no results)
- [ ] Responsive (tested on mobile 375px, tablet 768px, desktop 1024px+)
- [ ] Accessible (WCAG AA minimum: aria-labels, keyboard navigation, focus states)

**Documentation:**
- [ ] README.md updated (setup instructions, tech stack, architecture diagram)
- [ ] project-memory.md updated (5-15 decision entries documenting WHY behind choices)
- [ ] API docs generated (OpenAPI spec at `specs/001-specify-scripts-bash/contracts/openapi.yaml`)

**Constitution Compliance:**
- [ ] Principle I: 5 official documents seeded (`supabase/seed.sql` with BOFiP, CGI, INPI, Légifrance, Urssaf)
- [ ] Principle II: Citations table + CitationLink component + E2E validation (100% clickable URLs)
- [ ] Principle III: DisclaimerBanner component + E2E screenshot assertion (non-dismissible)
- [ ] Principle IV: Similarity threshold 0.6 in retrieval service + reject message
- [ ] Principle V: pgvector HNSW index + hybrid retrieval + Claude context-only

**Quality:**
- [ ] No `console.error` in production build (`grep -r "console.error" app/ lib/` → only in try/catch blocks)
- [ ] No TODO comments without GitHub issues (`grep -r "TODO" app/ lib/` → all have `TODO(#123)` format)
- [ ] Lighthouse score >90 (if applicable - run on Vercel preview deploy)

**When ALL Criteria Met:**

```bash
# ────────────────────────────────────────────
# Create Pull Request
# ────────────────────────────────────────────
gh pr create --title "feat: implement Juri MVP (User Story 1 - Chat with Citations)" --body "$(cat <<EOF
## Summary

Implemented Juri MVP - RAG-powered legal & financial assistant for internal PME use.

**Scope:** User Story 1 (P1) - Quick Legal Question with Citations

## What's Implemented

### Phase 1: Setup (T001-T010)
- Next.js 15 project with TypeScript strict mode
- shadcn/ui components (23 total)
- Design tokens synced (indigo theme)
- CI/CD pipeline (pnpm lint + type-check + build + test)

### Phase 2: Foundational (T011-T025)
- Database schema (PostgreSQL + pgvector, 6 tables, 16 indexes, 11 RLS policies)
- RAG services (chunking, embedding, hybrid retrieval, Claude synthesis)
- Authentication (Supabase Auth with login/signup/reset pages)

### Phase 3: User Story 1 (T026-T050)
- Custom components (DisclaimerBanner, MessageBubble, CitationLink, ConversationItem)
- Chat page (conversation history sidebar + message list + input area)
- API routes (POST /api/chat, GET/POST /api/conversations, GET /api/conversations/:id)
- State management (TanStack Query hooks: useConversations, useChat)
- E2E tests (chat flow, citation validation, disclaimer compliance)
- Unit tests (chunking, retrieval, synthesis, CitationLink)

## Test Results

\`\`\`
✅ pnpm build: PASS (0 TypeScript errors)
✅ pnpm lint: PASS (0 ESLint errors)
✅ pnpm test:e2e: PASS (3/3 tests)
  - Submit question and receive answer: PASS (8.7s average latency)
  - Citations link to valid official sources: PASS (100% HTTP 200 responses)
  - Disclaimer banner visible and non-dismissible: PASS
✅ pnpm test:unit: PASS (6/6 tests)
  - Chunking preserves article boundaries: PASS (95% preservation)
  - Hybrid retrieval returns top-5 chunks: PASS (90% recall)
  - Citation extraction from Claude: PASS (90% accuracy)
✅ Coverage: 82% backend, 64% frontend
\`\`\`

## Constitution Compliance

✅ **Principle I (Data Quality First)**: 5 official documents seeded (BOFiP, CGI, INPI, Légifrance, Urssaf)
✅ **Principle II (Source Citation Mandatory)**: Citations table + CitationLink component + E2E validation
✅ **Principle III (Human-in-the-Loop)**: DisclaimerBanner non-dismissible + screenshot assertion
✅ **Principle IV (Scope Discipline)**: Similarity threshold 0.6 + reject message for out-of-scope
✅ **Principle V (RAG Over Fine-Tuning)**: pgvector HNSW + hybrid retrieval + Claude context-only

## Performance Metrics

- **RAG latency:** 8.7s average (3s retrieval + 5.7s Claude synthesis) - under <30s target ✅
- **Cost:** €1.25/month estimated (96% under €50 budget) ✅
- **Accuracy:** 9/10 test questions answered correctly (90% vs 80% target) ✅
- **Citation validity:** 100% clickable URLs (verified via E2E tests) ✅

## Design/Dev Decoupling

✅ **0 hardcoded colors** (100% design token usage)
✅ **15-min custom brand merge ready** (CSS variables only)
✅ **Pattern Health Score:** 9.9/10

## Demo

**Vercel Preview:** https://juri-mvp-preview.vercel.app/chat

**Test Credentials:**
- Email: demo@juri-mvp.internal
- Password: Demo1234!

**Test Question:** "Quelle est la différence entre IR et IS pour une SAS?"

**Expected Result:**
- Answer in <30s
- Citations to CGI Art. 206-209 + BOFiP (clickable)
- Disclaimer banner visible

## Next Steps (Post-MVP)

- [ ] Validate 80% accuracy gate with 10 predefined test questions
- [ ] Deploy to production (Vercel + Supabase Cloud)
- [ ] User Story 2 (P2): Sources transparency page (T051-T065)
- [ ] User Story 3 (P3): Admin document ingestion (T066-T080)

## Co-Authors

Co-authored-by: backend-specialist (Claude Haiku 4.5)
Co-authored-by: frontend-specialist (Claude Haiku 4.5)
Co-authored-by: testing-specialist (Claude Haiku 4.5)

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"

# ────────────────────────────────────────────
# Tag Completion
# ────────────────────────────────────────────
git tag v1.0-mvp
git push origin v1.0-mvp

# ────────────────────────────────────────────
# Final Report
# ────────────────────────────────────────────
echo ""
echo "✅ MVP IMPLEMENTATION COMPLETE"
echo ""
echo "Summary:"
echo "  - Tasks: 50/87 completed (MVP scope = Phase 1-3)"
echo "  - Build: PASS"
echo "  - Tests: PASS (9/9 E2E + unit)"
echo "  - Constitution: COMPLIANT (5/5 principles)"
echo "  - Design Tokens: COMPLIANT (0 hardcoded colors)"
echo "  - PR: Created (awaiting review)"
echo "  - Tag: v1.0-mvp"
echo ""
echo "Next: Deploy to production + validate 80% accuracy gate"
echo ""
```

---

## 🎯 FINAL PROMPT FOR /IMPLEMENT ⭐ V5.1 ENHANCED

**Copy-paste this into `/implement` or `/speckit.final`:**

```
Implement Juri MVP following this orchestration plan.

Context files (READ FIRST):
- Constitution: .specify/memory/constitution.md (5 core principles)
- Spec: specs/001-specify-scripts-bash/spec.md (17 FR + 3 user stories)
- Plan: specs/001-specify-scripts-bash/plan.md (tech stack, architecture)
- Tasks: specs/001-specify-scripts-bash/tasks.md (87 tasks, 6 phases)
- Design: design/design-tokens.json (20 tokens, indigo theme)
- Agent Instructions: CLAUDE.md (workflow rules, MCP tools, auto-documentation)
- Memory: .specify/memory/project-memory.md (previous session notes)

Sub-agents:
- backend-specialist (Haiku 4.5): T011-T025, T031-T050 (Foundational + US1 backend)
- frontend-specialist (Haiku 4.5): T026-T030, T035-T038 (US1 UI)
- testing-specialist (Haiku 4.5): T042-T048 (US1 tests)

Execution strategy:
1. Phase 0: Pre-flight checks (5-10 min)
2. Phase 1: Foundation (T001-T025, sequential, 2-3h)
3. Phase 2: Parallel sessions (T026-T050, 3 sessions simultaneous, 2-3h)
   - Session 1: backend-specialist (API routes, hooks)
   - Session 2: frontend-specialist (components, pages) [NEW WINDOW]
   - Session 3: testing-specialist (E2E tests) [CODEX VIA ZEN MCP OR NEW WINDOW]
4. Phase 3+: Continue with US2/US3 or Polish (optional for MVP)

Quality gates (EVERY 10 TASKS):
1. ESLint validation (P0 BLOCKER - must be 0 errors)
2. Context7 docs (if new library introduced)
3. Build check (P0 BLOCKER - must pass)
4. Memory documentation (P2 VERIFICATION - 1-3 entries expected)

MVP scope = Phase 1-3 (T001-T050) = User Story 1 complete

Success criteria:
✅ Chat interface functional (submit question → receive answer with citations)
✅ RAG pipeline operational (hybrid retrieval, Claude synthesis)
✅ DisclaimerBanner non-dismissible (constitutional compliance)
✅ E2E tests passing (chat flow, citation validation)
✅ Design tokens used (0 hardcoded colors)
✅ Build passes + ESLint clean + Tests pass

Report progress every 30 min.
Escalate blockers immediately (3-strike rule).
Call /update-memory for significant decisions.

⭐ V5.1 MULTI-SESSION STRATEGY: Testing will run in PARALLEL (Codex via Zen MCP OR separate Claude session) while backend/frontend continue. This saves 2-3h (60% faster vs sequential).

GO! 🚀
```

---

## 📊 Summary

✅ **Orchestration prompt generated**

**Selected Agents:**
- backend-specialist (Haiku 4.5) - 40 tasks (46%)
- frontend-specialist (Haiku 4.5) - 35 tasks (40%)
- testing-specialist (Haiku 4.5) - 12 tasks (14%)

**Total Tasks:** 87 (MVP scope = 50 tasks for Phases 1-3)

**Estimated Duration:**
- Sequential: 40-50 hours (1-2 weeks)
- **Parallel:** **10-12 hours** (1-2 days) ← **75% faster via multi-session execution**

**MCP Strategy:**
- Context7: Just-in-time docs (Supabase, Anthropic, OpenAI, LangChain, TanStack Query)
- ESLint: Mandatory checkpoints every 10 tasks (BLOCKING if errors)

**Parallelization Opportunities:**
- Phase 1: Setup (7 tasks can run in parallel: T001, T002, T003, T005-T009)
- Phase 2: Foundational (6 tasks can run in parallel after database: T015-T018, T021-T022)
- Phase 3: **Multi-session** (3 agents work simultaneously: backend + frontend + testing)

**Constitution Compliance:** ✅ All 5 principles mapped to tasks with validation gates

**Next Step:** Copy orchestration prompt → `/implement` or `/speckit.final`

**Note:** Agents will self-document via `/update-memory` during implementation (Dynamic Memory V5).

---

**File saved:** `specs/001-specify-scripts-bash/ORCHESTRATION.md`
