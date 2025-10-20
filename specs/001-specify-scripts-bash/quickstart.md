# Juri MVP - Local Development Quickstart

**Project**: RAG Legal & Financial Assistant (internal PME use)
**Tech Stack**: Next.js 15 + Supabase (PostgreSQL + pgvector) + Claude API + OpenAI embeddings
**Timeline**: 1-2 weeks MVP implementation

---

## Prerequisites

### Required Software

| Tool | Version | Purpose | Installation |
|------|---------|---------|--------------|
| **Node.js** | 20.x LTS | Runtime for Next.js | [nodejs.org](https://nodejs.org/) |
| **pnpm** | 8.x | Package manager (faster than npm) | `npm install -g pnpm` |
| **Git** | Latest | Version control | [git-scm.com](https://git-scm.com/) |
| **Supabase CLI** | Latest | Local Supabase development | `brew install supabase/tap/supabase` (macOS)<br>or [docs](https://supabase.com/docs/guides/cli) |
| **Docker Desktop** | Latest | Required for Supabase local dev | [docker.com](https://www.docker.com/) |

### Required Accounts & API Keys

| Service | Purpose | Sign Up | Cost (MVP) |
|---------|---------|---------|------------|
| **Supabase** | PostgreSQL + pgvector + Auth + Storage | [supabase.com](https://supabase.com/) | Free tier (500MB DB, 1GB storage) |
| **OpenAI** | text-embedding-3-small embeddings | [platform.openai.com](https://platform.openai.com/) | ~€0.001/month (1000 chunks × 1 embedding) |
| **Anthropic** | Claude 3.5 Sonnet API (zero-retention DPA) | [console.anthropic.com](https://console.anthropic.com/) | ~€1.25/month (100 queries with prompt caching) |
| **Vercel** | Next.js deployment (production only) | [vercel.com](https://vercel.com/) | Free tier (100GB bandwidth/month) |

**Total Estimated Cost**: €1.25-2/month (96% under €50/month budget!)

---

## Project Setup (First Time)

### 1. Clone Repository

```bash
# Clone the repository
git clone <repository-url> juri-mvp
cd juri-mvp

# Install dependencies
pnpm install

# Verify installation
pnpm --version  # Should show 8.x
node --version  # Should show 20.x
```

### 2. Set Up Supabase Local Development

```bash
# Start Docker Desktop (required for Supabase local)
# Verify Docker is running:
docker --version

# Initialize Supabase local project
supabase init

# Start local Supabase instance (PostgreSQL + Studio + Auth + Storage)
supabase start

# This will output:
#   API URL: http://localhost:54321
#   Studio URL: http://localhost:54323
#   anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
#   service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# IMPORTANT: Save these values for .env.local configuration
```

### 3. Run Database Migrations

```bash
# Apply database schema (PostgreSQL + pgvector setup)
supabase db reset

# This will:
# 1. Create tables (users, documents, embeddings, conversations, messages, citations)
# 2. Enable pgvector extension
# 3. Create HNSW index on embeddings.vector
# 4. Set up Row-Level Security (RLS) policies
# 5. Seed 5 official documents metadata

# Verify migrations succeeded
supabase db diff  # Should show no pending changes

# Open Supabase Studio to inspect database
open http://localhost:54323
# Navigate to "Table Editor" → verify tables exist
```

### 4. Configure Environment Variables

Create `.env.local` file in project root:

```bash
# Copy template
cp .env.local.example .env.local

# Edit .env.local with your values
nano .env.local
```

**`.env.local` configuration**:

```env
# ============================================================================
# Supabase (Local Development)
# ============================================================================
# Obtain these values from `supabase start` output

NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Service role key (server-side only, full database access)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ============================================================================
# OpenAI API (Embeddings)
# ============================================================================
# Create API key at: https://platform.openai.com/api-keys

OPENAI_API_KEY=sk-proj-...

# ============================================================================
# Anthropic API (Claude 3.5 Sonnet)
# ============================================================================
# Create API key at: https://console.anthropic.com/settings/keys

ANTHROPIC_API_KEY=sk-ant-...

# ============================================================================
# Next.js Configuration
# ============================================================================

NODE_ENV=development

# Rate limiting (10 questions/hour per user)
RATE_LIMIT_MAX_REQUESTS=10
RATE_LIMIT_WINDOW_MS=3600000  # 1 hour in milliseconds

# ============================================================================
# Feature Flags (Optional)
# ============================================================================

# Use local Ollama instead of Claude API (for cost savings during dev)
USE_OLLAMA_LOCAL=false  # Set to 'true' to use Ollama (requires ollama installed)

# Use local multilingual-e5 instead of OpenAI embeddings
USE_LOCAL_EMBEDDINGS=false  # Set to 'true' for privacy-focused dev
```

**Important**:
- **NEVER commit `.env.local` to Git** (already in `.gitignore`)
- For production, use environment variables in Vercel dashboard

### 5. Install shadcn/ui Components

```bash
# Initialize shadcn/ui (interactive prompts)
npx shadcn-ui@latest init

# Prompts:
# - TypeScript: Yes
# - Style: Default
# - Base color: Slate (neutral palette)
# - CSS variables: Yes
# - Tailwind config: Yes
# - Import alias: @/components

# Install required components (23 total)
npx shadcn-ui@latest add button card input form label select table dialog toast alert textarea badge separator scroll-area avatar tooltip

# This will create:
# - components/ui/ directory with base components
# - Update tailwind.config.ts with design tokens
# - Update globals.css with CSS variables
```

### 6. Sync Design Tokens

```bash
# Copy design tokens to Tailwind CSS variables
# (Manual step - convert design/design-tokens.json → globals.css)

# Open design/design-tokens.json and copy colors to app/globals.css:
# :root {
#   --primary-50: #EEF2FF;
#   --primary-500: #6366F1;
#   ...
# }

# Verify Tailwind config references these variables
# in tailwind.config.ts: colors: { primary: { 500: 'var(--primary-500)' } }
```

---

## Running the Application

### Start Development Server

```bash
# Start Next.js dev server
pnpm dev

# Output:
#   ▲ Next.js 15.0.0
#   - Local:        http://localhost:3000
#   - Ready in 1.2s

# Open browser to http://localhost:3000
```

### Parallel Processes

For optimal development workflow, run these in separate terminal tabs:

```bash
# Tab 1: Next.js dev server
pnpm dev

# Tab 2: Supabase local instance (if not already running)
supabase start

# Tab 3: TypeScript type-checking (watch mode)
pnpm run type-check --watch

# Tab 4: ESLint (watch mode)
pnpm run lint --watch
```

---

## Development Workflow

### 1. Create Admin User (First Login)

```bash
# Open browser to http://localhost:3000/login

# Sign up with email/password
# Email: admin@juri-mvp.internal
# Password: <strong-password>

# Manually set admin role in Supabase Studio
# 1. Open http://localhost:54323
# 2. Navigate to "Table Editor" → "users"
# 3. Find your user row (search by email)
# 4. Edit row → set "role" = 'admin'
# 5. Save changes

# Now you can access /admin panel to upload documents
```

### 2. Upload First Document (Admin Panel)

```bash
# 1. Open http://localhost:3000/admin
# 2. Click "Upload Document" button
# 3. Fill form:
#    - File: Select test PDF (e.g., 5-page legal document sample)
#    - Title: "Test Document - SAS Creation"
#    - Source Type: "legifrance"
#    - Source URL: https://www.legifrance.gouv.fr/...
#    - Version: "2024-10-18"
#    - Last Updated: 2024-10-18
# 4. Click "Ingest Document"

# Backend will:
# - Upload PDF to Supabase Storage
# - Extract text and chunk (500-1000 tokens)
# - Generate embeddings via OpenAI API
# - Store chunks + vectors in embeddings table
# - Create document record in documents table

# Expected duration: 30-60 seconds for 5-page PDF
# Check progress in terminal logs (Next.js dev server output)
```

### 3. Test RAG Pipeline (Chat Interface)

```bash
# 1. Open http://localhost:3000/chat
# 2. Click "+ Nouvelle Question" to create conversation
# 3. Type test question (French):
#    "Quelle est la différence entre IR et IS pour une SAS?"
# 4. Submit question (Enter or click send button)

# Backend will:
# 1. Embed question via OpenAI API (~200ms)
# 2. Hybrid retrieval (pgvector + BM25, <50ms)
# 3. Claude synthesis with retrieved chunks (~5-10 seconds)
# 4. Extract citations and generate URLs
# 5. Store message + citations in database

# Expected response time: 6-12 seconds (dev env, no caching)

# Verify:
# - Answer contains French text with legal references
# - Citations are displayed as clickable badges (e.g., "📄 CGI Art. 206-209")
# - Disclaimer banner is visible at top: "⚠ Pas de conseil juridique..."
# - Clicking citation badge opens official source URL in new tab
```

### 4. View Sources Page

```bash
# Open http://localhost:3000/sources

# Verify:
# - Test document is listed with metadata
# - Freshness indicator shows "✓ À jour (X jours)" or warning if >90 days
# - Status badge shows "Actif" (green)
# - Click document card to view details (chunk count, citation count)
```

---

## Testing

### Run Unit Tests

```bash
# Run all unit tests (Vitest)
pnpm test

# Run tests in watch mode (auto-rerun on file changes)
pnpm test:watch

# Run tests with coverage report
pnpm test:coverage

# Coverage output: ./coverage/index.html
open coverage/index.html
```

### Run E2E Tests

```bash
# Install Playwright browsers (first time only)
pnpm playwright install

# Run E2E tests (Playwright)
pnpm test:e2e

# Run E2E tests in UI mode (debugging)
pnpm test:e2e:ui

# Tests covered:
# - Auth flow (login, signup, password reset)
# - Chat interface (submit question, validate answer + citations)
# - Sources page (view documents, freshness warnings)
# - Admin panel (document upload, ingestion validation)
```

### Run Type-Check

```bash
# TypeScript strict mode check (0 errors required for CI/CD pass)
pnpm run type-check

# Expected output:
# ✓ Type-checking complete: 0 errors
```

### Run Linter

```bash
# ESLint check (0 errors required for CI/CD pass)
pnpm run lint

# Fix auto-fixable issues
pnpm run lint:fix
```

### Run Full CI/CD Locally

```bash
# Simulate CI/CD pipeline (same as GitHub Actions)
pnpm run ci

# This runs sequentially:
# 1. pnpm install
# 2. pnpm run lint
# 3. pnpm run type-check
# 4. pnpm run build
# 5. pnpm test

# Expected duration: 2-3 minutes
# Must pass with exit code 0 before pushing to main
```

---

## Database Management

### View Database in Supabase Studio

```bash
# Open Supabase Studio (local)
open http://localhost:54323

# Useful tabs:
# - "Table Editor": View/edit data in all tables
# - "SQL Editor": Run custom SQL queries
# - "Database": View schema, indexes, functions
# - "Authentication": Manage users, sessions
# - "Storage": View uploaded PDF/HTML files
```

### Run Custom SQL Queries

```bash
# Open SQL Editor in Supabase Studio
# http://localhost:54323/project/default/sql

# Example queries:

# 1. Count embeddings per document
SELECT d.title, COUNT(e.id) as chunks_count
FROM documents d
LEFT JOIN embeddings e ON d.id = e.document_id
GROUP BY d.id, d.title;

# 2. View most recent conversations
SELECT c.id, c.title, c.updated_at, u.email
FROM conversations c
JOIN users u ON c.user_id = u.id
ORDER BY c.updated_at DESC
LIMIT 10;

# 3. Test hybrid retrieval (replace $1 with actual vector, $2 with question text)
# See contracts/database.sql for full hybrid search query
```

### Reset Database (Destructive)

```bash
# WARNING: This will delete ALL data (conversations, messages, citations, embeddings)

# Reset to migrations only (no seed data)
supabase db reset

# Confirm prompt: y

# Re-upload documents via /admin panel
```

### Create Database Migration

```bash
# If you modify database schema during development:

# 1. Make changes in Supabase Studio or via SQL Editor
# 2. Generate migration file from diff
supabase db diff -f <migration-name>

# Example:
supabase db diff -f add_user_preferences_table

# This creates: supabase/migrations/YYYYMMDDHHMMSS_add_user_preferences_table.sql

# 3. Apply migration
supabase db reset

# 4. Commit migration file to Git
git add supabase/migrations/
git commit -m "feat: add user preferences table"
```

---

## Debugging

### Enable Verbose Logging

Add to `.env.local`:

```env
# Enable debug logs for all services
DEBUG=true

# Enable specific debug namespaces
DEBUG_RAG_RETRIEVAL=true
DEBUG_LLM_SYNTHESIS=true
DEBUG_EMBEDDINGS=true
```

### Inspect RAG Pipeline

```bash
# Terminal logs show:
# [RAG] Question received: "Quelle est la différence..."
# [RAG] Embedding generated: 1536 dimensions
# [RAG] Vector search: 42ms, 10 chunks retrieved
# [RAG] BM25 search: 18ms, 8 chunks retrieved
# [RAG] Hybrid fusion: 5 chunks selected
# [RAG] Claude synthesis started: 2134 input tokens
# [RAG] Claude synthesis complete: 456 output tokens, 8.7s
# [RAG] Citations extracted: 2 citations
# [RAG] Total latency: 9.2s
```

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| `supabase start` fails | Docker not running | Start Docker Desktop, retry `supabase start` |
| `ECONNREFUSED localhost:54321` | Supabase not started | Run `supabase start` in separate terminal |
| `OpenAI API key invalid` | Missing or wrong key | Check `.env.local` → `OPENAI_API_KEY` value |
| `Claude API 401 Unauthorized` | Missing or wrong key | Check `.env.local` → `ANTHROPIC_API_KEY` value |
| `pgvector extension not found` | Migration not applied | Run `supabase db reset` |
| `Type error in components/ui/button.tsx` | shadcn/ui not installed | Run `npx shadcn-ui@latest add button` |
| Chat answers are empty | No documents ingested | Upload test document via `/admin` panel |
| Citations are broken links | Incorrect `source_url` in documents table | Edit document in Supabase Studio → fix `source_url` |

---

## Deployment (Production)

### Deploy to Vercel (Frontend + API)

```bash
# 1. Install Vercel CLI
pnpm install -g vercel

# 2. Login to Vercel
vercel login

# 3. Link project to Vercel
vercel link

# 4. Set environment variables in Vercel dashboard
# https://vercel.com/your-project/settings/environment-variables

# Required variables:
# - NEXT_PUBLIC_SUPABASE_URL (production Supabase URL)
# - NEXT_PUBLIC_SUPABASE_ANON_KEY (production anon key)
# - SUPABASE_SERVICE_ROLE_KEY (production service role key)
# - OPENAI_API_KEY
# - ANTHROPIC_API_KEY
# - RATE_LIMIT_MAX_REQUESTS=10
# - RATE_LIMIT_WINDOW_MS=3600000

# 5. Deploy to preview (test)
vercel

# 6. Deploy to production
vercel --prod

# Output:
#   ✓ Production: https://juri-mvp.vercel.app
```

### Set Up Production Supabase

```bash
# 1. Create Supabase project at https://supabase.com/dashboard/projects
# 2. Note project URL and keys (Settings → API)
# 3. Link local project to production
supabase link --project-ref <your-project-id>

# 4. Push migrations to production
supabase db push

# 5. Verify migrations succeeded
supabase db diff  # Should show no pending changes

# 6. Seed production database (optional - or upload docs via /admin)
# Upload 5 official documents via production /admin panel
```

### CI/CD Pipeline (GitHub Actions)

Already configured in `.github/workflows/ci-template.yml`:

```yaml
# Triggers:
# - Push to main/develop branches
# - Pull requests to main

# Steps:
# 1. Checkout code
# 2. Setup pnpm + Node.js 20.x
# 3. Install dependencies (pnpm install)
# 4. Lint (pnpm run lint) → exit code 0 required
# 5. Type-check (pnpm run type-check) → 0 errors required
# 6. Build (pnpm run build) → exit code 0 required
# 7. Test (pnpm run test) → all tests pass required

# Deployment:
# - Vercel auto-deploys from main branch (configured in Vercel dashboard)
```

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    Browser (Chrome/Firefox/Safari)               │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 │ HTTPS (session cookie)
                 │
┌────────────────▼────────────────────────────────────────────────┐
│                   Next.js 15 App (Vercel Edge)                   │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Frontend (React Server Components + Client Components)  │   │
│  │  - app/(auth)/login, signup, reset-password             │   │
│  │  - app/(dashboard)/chat, sources, admin                 │   │
│  │  - components/ui/ (shadcn/ui base components)           │   │
│  │  - components/custom/ (Juri-specific components)        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  API Routes (Next.js Route Handlers)                     │   │
│  │  - POST /api/chat → RAG pipeline trigger                │   │
│  │  - GET /api/documents → List indexed docs               │   │
│  │  - POST /api/ingest → Admin doc upload + chunking       │   │
│  │  - GET/POST/PATCH/DELETE /api/conversations             │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Business Logic (lib/ services)                          │   │
│  │  - lib/rag/chunking.ts → Document chunking              │   │
│  │  - lib/rag/embedding.ts → OpenAI API client             │   │
│  │  - lib/rag/retrieval.ts → Hybrid search (vector+BM25)   │   │
│  │  - lib/rag/synthesis.ts → Claude API + citation extract │   │
│  │  - lib/supabase/client.ts → Supabase client             │   │
│  └─────────────────────────────────────────────────────────┘   │
└───────────┬───────────────────────┬─────────────────────────────┘
            │                       │
            │                       │
    ┌───────▼──────────┐    ┌──────▼─────────────────────────────┐
    │  OpenAI API      │    │  Anthropic Claude API               │
    │  (Embeddings)    │    │  (LLM Synthesis)                    │
    │                  │    │                                      │
    │  - text-emb-3    │    │  - Claude 3.5 Sonnet                │
    │  - 1536 dims     │    │  - Zero-retention DPA               │
    │  - €0.001/month  │    │  - Prompt caching enabled           │
    └──────────────────┘    └──────────────────────────────────────┘
            │
            │
    ┌───────▼──────────────────────────────────────────────────────┐
    │           Supabase Cloud (PostgreSQL 15 + pgvector)          │
    │                                                               │
    │  ┌──────────────────────────────────────────────────────┐  │
    │  │  PostgreSQL Tables                                    │  │
    │  │  - users (auth, roles)                                │  │
    │  │  - documents (metadata, 5 official sources)           │  │
    │  │  - embeddings (chunks + vectors, 500-1000 rows)       │  │
    │  │  - conversations (chat sessions)                      │  │
    │  │  - messages (questions + answers)                     │  │
    │  │  - citations (audit trail)                            │  │
    │  └──────────────────────────────────────────────────────┘  │
    │                                                               │
    │  ┌──────────────────────────────────────────────────────┐  │
    │  │  pgvector Indexes                                     │  │
    │  │  - HNSW index on embeddings.vector (m=16, ef=64)      │  │
    │  │  - GIN index on embeddings.chunk_text (French FTS)    │  │
    │  └──────────────────────────────────────────────────────┘  │
    │                                                               │
    │  ┌──────────────────────────────────────────────────────┐  │
    │  │  Supabase Auth (session-based, RLS enforced)          │  │
    │  └──────────────────────────────────────────────────────┘  │
    │                                                               │
    │  ┌──────────────────────────────────────────────────────┐  │
    │  │  Supabase Storage (uploaded PDF/HTML files)           │  │
    │  └──────────────────────────────────────────────────────┘  │
    └───────────────────────────────────────────────────────────────┘
```

---

## Next Steps

1. **Complete this quickstart** to verify local development works end-to-end
2. **Upload 5 official documents** via `/admin` panel (BOFiP, CGI, INPI, Légifrance, Urssaf)
3. **Test 10 predefined questions** via `/chat` interface (validate 80% accuracy gate)
4. **Run full CI/CD locally** (`pnpm run ci`) to ensure production-ready
5. **Deploy to Vercel** for production testing
6. **Monitor costs** (OpenAI + Claude API usage) for first week

**Estimated Setup Time**: 1-2 hours (first time with account creation, 30 min for experienced developers)

**Questions or Issues?**
- Check "Common Issues" section above
- Review terminal logs for detailed error messages
- Inspect Supabase Studio for database state
- Contact project maintainer

---

**Generated**: 2025-10-18
**Version**: 1.0.0 (MVP)
**Last Updated**: 2025-10-18
