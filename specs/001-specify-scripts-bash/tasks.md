# Implementation Tasks: RAG Legal & Financial Assistant (Juri MVP)

**Feature**: RAG-powered legal assistant for internal PME use
**Branch**: `001-specify-scripts-bash`
**Generated**: 2025-10-18
**Total Tasks**: 87
**Estimated Duration**: 40-50 hours (1-2 weeks with 1 developer)

---

## Task Organization

**Phases**:
1. **Setup** (T001-T010): Project initialization and infrastructure
2. **Foundational** (T011-T025): Blocking prerequisites for all user stories
3. **User Story 1 - P1** (T026-T050): Quick Legal Question with Citations
4. **User Story 2 - P2** (T051-T065): Source Transparency & Versioning
5. **User Story 3 - P3** (T066-T080): Admin Document Ingestion
6. **Polish & Integration** (T081-T087): Cross-cutting concerns

**Legend**:
- `[P]` = Parallelizable (can run simultaneously with other [P] tasks)
- `[US1]`, `[US2]`, `[US3]` = User Story label
- File paths are relative to project root unless prefixed with absolute path

---

## Phase 1: Setup (Project Initialization)

**Goal**: Initialize Next.js 15 project with Supabase, configure dependencies, set up design system

**Duration**: 4-6 hours

### Tasks

- [ ] T001 [P] Initialize Next.js 15 project with TypeScript strict mode and App Router
  ```bash
  pnpm create next-app@latest juri-mvp --typescript --tailwind --app --src-dir=false
  cd juri-mvp
  git init
  ```

- [ ] T002 [P] Configure pnpm workspace and install core dependencies
  ```bash
  # package.json: Add dependencies from plan.md
  pnpm add @supabase/supabase-js @anthropic-ai/sdk openai langchain zod react-hook-form @radix-ui/react-icons
  pnpm add -D @types/node vitest @testing-library/react @playwright/test
  ```

- [ ] T003 [P] Set up Supabase CLI and initialize local development environment
  ```bash
  brew install supabase/tap/supabase
  supabase init
  supabase start
  # Save API URL and keys to .env.local
  ```

- [ ] T004 Configure environment variables in `.env.local.example` and `.env.local`
  ```env
  NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
  NEXT_PUBLIC_SUPABASE_ANON_KEY=...
  SUPABASE_SERVICE_ROLE_KEY=...
  OPENAI_API_KEY=...
  ANTHROPIC_API_KEY=...
  ```

- [ ] T005 [P] Initialize shadcn/ui with design tokens from `design/design-tokens.json`
  ```bash
  npx shadcn-ui@latest init
  # Configure: TypeScript=Yes, Style=Default, Base=Slate, CSS vars=Yes
  ```

- [ ] T006 [P] Copy design tokens to `app/globals.css` as CSS variables
  ```css
  /* Convert design/design-tokens.json → CSS variables in :root */
  --primary-500: #6366F1;
  --neutral-900: #0F172A;
  /* ... */
  ```

- [ ] T007 [P] Configure Tailwind CSS with design tokens in `tailwind.config.ts`
  ```ts
  // Reference CSS variables from globals.css
  colors: { primary: { 500: 'var(--primary-500)' } }
  ```

- [ ] T008 [P] Set up TypeScript strict mode in `tsconfig.json`
  ```json
  {
    "compilerOptions": {
      "strict": true,
      "noImplicitAny": true,
      "strictNullChecks": true,
      "paths": { "@/*": ["./*"] }
    }
  }
  ```

- [ ] T009 [P] Configure ESLint with Next.js and accessibility rules in `.eslintrc.json`
  ```json
  {
    "extends": ["next/core-web-vitals", "plugin:jsx-a11y/recommended"],
    "rules": { "no-console": "warn" }
  }
  ```

- [ ] T010 Set up CI/CD pipeline in `.github/workflows/ci.yml` (copy from `ci-template.yml`)
  ```yaml
  # Trigger on push to main/develop, run lint + type-check + build + test
  ```

**Checkpoint 1**: ✅ Project initialized, dependencies installed, design system configured

---

## Phase 2: Foundational (Blocking Prerequisites)

**Goal**: Set up database schema, authentication, core services that ALL user stories depend on

**Duration**: 8-10 hours

### Database & Infrastructure Tasks

- [ ] T011 Apply database migrations to local Supabase (`supabase/migrations/001_initial_schema.sql`)
  ```bash
  # Copy from contracts/database.sql → supabase/migrations/
  supabase db reset
  ```

- [ ] T012 Enable pgvector extension and create HNSW index (`supabase/migrations/002_pgvector_setup.sql`)
  ```sql
  CREATE EXTENSION vector;
  ALTER TABLE embeddings ADD COLUMN vector vector(1536);
  CREATE INDEX embeddings_vector_idx ON embeddings USING hnsw (vector vector_cosine_ops) WITH (m=16, ef_construction=64);
  ```

- [ ] T013 Set up Row-Level Security policies (`supabase/migrations/003_rls_policies.sql`)
  ```sql
  -- Users can view own data, admins can manage documents
  CREATE POLICY "Users can manage own conversations" ON conversations FOR ALL USING (user_id = auth.uid());
  ```

- [ ] T014 Create Supabase client utilities in `lib/supabase/client.ts`
  ```ts
  // Server-side client with service role key
  // Client-side client with anon key
  export const supabaseServer = createClient(url, serviceRoleKey);
  export const supabaseClient = createClient(url, anonKey);
  ```

- [ ] T015 [P] Implement authentication helpers in `lib/supabase/auth.ts`
  ```ts
  // getSession(), signIn(), signUp(), signOut(), resetPassword()
  export async function getSession() { /* ... */ }
  ```

- [ ] T016 [P] Create database query utilities in `lib/supabase/queries.ts`
  ```ts
  // Generic CRUD operations for all tables
  export async function getDocuments(filters) { /* ... */ }
  export async function createConversation(userId) { /* ... */ }
  ```

### Core RAG Services

- [ ] T017 [P] Implement document chunking service in `lib/rag/chunking.ts`
  ```ts
  // LangChain RecursiveCharacterTextSplitter with French legal separators
  export async function chunkDocument(text: string): Promise<Chunk[]> { /* ... */ }
  ```

- [ ] T018 [P] Implement embedding service in `lib/rag/embedding.ts`
  ```ts
  // OpenAI text-embedding-3-small client
  export async function generateEmbedding(text: string): Promise<number[]> { /* ... */ }
  ```

- [ ] T019 Implement hybrid retrieval service in `lib/rag/retrieval.ts`
  ```ts
  // 70% vector cosine similarity + 30% BM25 keyword + RRF fusion
  export async function hybridSearch(query: string, queryEmbedding: number[]): Promise<Chunk[]> { /* ... */ }
  ```

- [ ] T020 Implement Claude synthesis service in `lib/rag/synthesis.ts`
  ```ts
  // Claude 3.5 Sonnet API with Citations API (native)
  export async function synthesizeAnswer(question: string, chunks: Chunk[]): Promise<{ answer: string, citations: Citation[] }> { /* ... */ }
  ```

- [ ] T021 [P] Create validation schemas in `lib/utils/validation.ts`
  ```ts
  // Zod schemas for chat input, document metadata, etc.
  export const chatInputSchema = z.object({ conversationId: z.string().uuid(), question: z.string().min(10).max(5000) });
  ```

- [ ] T022 [P] Create citation formatting utilities in `lib/utils/formatting.ts`
  ```ts
  // Generate clickable citation URLs, format article references
  export function formatCitation(articleRef: string, sourceType: string): string { /* ... */ }
  ```

### Authentication UI

- [ ] T023 [P] Install shadcn/ui auth components
  ```bash
  npx shadcn-ui@latest add input label form button
  ```

- [ ] T024 Create login page in `app/(auth)/login/page.tsx`
  ```tsx
  // Supabase Auth login form with email/password
  export default function LoginPage() { /* ... */ }
  ```

- [ ] T025 [P] Create signup and password reset pages in `app/(auth)/signup/page.tsx` and `app/(auth)/reset-password/page.tsx`
  ```tsx
  // Signup form, reset password form
  ```

**Checkpoint 2**: ✅ Database schema deployed, RLS configured, RAG services implemented, authentication working

---

## Phase 3: User Story 1 - Quick Legal Question with Citations (P1)

**Goal**: Implement core chat interface with RAG pipeline (hybrid retrieval + Claude synthesis + citations)

**Priority**: P1 (Highest - Core Value Proposition)

**Independent Test Criteria**:
- Can submit legal question in French (10-5000 chars)
- Receives answer in <30 seconds with French legal text
- Answer includes ≥1 citation with clickable URL to official source (Légifrance, BOFiP, INPI, Urssaf)
- Disclaimer banner visible and non-dismissible on every response
- Citations link to exact article on official website (HTTP 200 response)

**Duration**: 12-16 hours

### UI Components

- [ ] T026 [P] [US1] Install shadcn/ui components for chat interface
  ```bash
  npx shadcn-ui@latest add card textarea badge tooltip alert scroll-area separator avatar
  ```

- [ ] T027 [P] [US1] Create DisclaimerBanner component in `components/custom/disclaimer-banner.tsx`
  ```tsx
  // Extends Alert, red-50 bg, sticky positioned, non-dismissible
  // Text: "⚠ Pas de conseil juridique - valider avec expert pour statuts/déclarations/décisions >5K€"
  export function DisclaimerBanner() { /* ... */ }
  ```

- [ ] T028 [P] [US1] Create MessageBubble component in `components/custom/message-bubble.tsx`
  ```tsx
  // Extends Card, supports user/assistant/system roles
  // User: right-aligned indigo bg, Assistant: left-aligned white bg
  export function MessageBubble({ role, content, citations }) { /* ... */ }
  ```

- [ ] T029 [P] [US1] Create CitationLink component in `components/custom/citation-link.tsx`
  ```tsx
  // Extends Badge + Tooltip, clickable pill with article ref
  // Example: "📄 CGI Art. 206-209" → opens Légifrance URL in new tab
  export function CitationLink({ articleRef, citationUrl, documentTitle }) { /* ... */ }
  ```

- [ ] T030 [P] [US1] Create ConversationItem component in `components/custom/conversation-item.tsx`
  ```tsx
  // Extends Card, shows title (truncated 60 chars), timestamp, unread indicator
  export function ConversationItem({ title, updatedAt, isActive }) { /* ... */ }
  ```

### API Routes

- [ ] T031 [US1] Implement POST /api/chat route in `app/api/chat/route.ts`
  ```ts
  // 1. Validate input (Zod schema)
  // 2. Generate embedding (OpenAI API)
  // 3. Hybrid retrieval (pgvector + BM25)
  // 4. Claude synthesis with Citations API
  // 5. Store message + citations
  // 6. Return answer + citations
  export async function POST(request: Request) { /* ... */ }
  ```

- [ ] T032 [P] [US1] Implement GET /api/conversations route in `app/api/conversations/route.ts`
  ```ts
  // List user's conversations (ordered by updated_at DESC)
  export async function GET(request: Request) { /* ... */ }
  ```

- [ ] T033 [P] [US1] Implement POST /api/conversations route in `app/api/conversations/route.ts`
  ```ts
  // Create new conversation for authenticated user
  export async function POST(request: Request) { /* ... */ }
  ```

- [ ] T034 [P] [US1] Implement GET /api/conversations/[id] route in `app/api/conversations/[id]/route.ts`
  ```ts
  // Get conversation details (messages + citations)
  export async function GET(request: Request, { params }) { /* ... */ }
  ```

### Chat UI Pages

- [ ] T035 [US1] Create dashboard layout in `app/(dashboard)/layout.tsx`
  ```tsx
  // Sidebar + main content area + DisclaimerBanner
  export default function DashboardLayout({ children }) { /* ... */ }
  ```

- [ ] T036 [US1] Implement chat page in `app/(dashboard)/chat/page.tsx`
  ```tsx
  // Main chat interface:
  // - Conversation history sidebar (ConversationItem components)
  // - Message list (MessageBubble components with CitationLink)
  // - Input area (Textarea + Send button)
  // - DisclaimerBanner (sticky at top)
  export default function ChatPage() { /* ... */ }
  ```

- [ ] T037 [US1] Implement conversation creation logic (New Question button handler)
  ```ts
  // POST /api/conversations → set active conversation → enable input
  async function handleNewConversation() { /* ... */ }
  ```

- [ ] T038 [US1] Implement question submission logic (Send button handler)
  ```ts
  // POST /api/chat with conversationId + question
  // Display loading state (skeleton)
  // Append assistant message when response received
  async function handleSendQuestion(question: string) { /* ... */ }
  ```

### Integration & State Management

- [ ] T039 [US1] Set up React Query for server state management
  ```bash
  pnpm add @tanstack/react-query
  ```
  ```tsx
  // app/providers.tsx: QueryClientProvider wrapper
  export function Providers({ children }) { /* ... */ }
  ```

- [ ] T040 [US1] Create useConversations hook in `hooks/use-conversations.ts`
  ```ts
  // React Query hook for fetching conversations list
  export function useConversations() { /* ... */ }
  ```

- [ ] T041 [US1] Create useChat hook in `hooks/use-chat.ts`
  ```ts
  // React Query hook for submitting questions + optimistic updates
  export function useChat(conversationId: string) { /* ... */ }
  ```

### Testing (E2E)

- [ ] T042 [US1] Create E2E test for chat flow in `tests/e2e/chat.spec.ts`
  ```ts
  // 1. Login as test user
  // 2. Create new conversation
  // 3. Submit question: "Quelle est la différence entre IR et IS pour une SAS?"
  // 4. Assert: Answer received in <30s
  // 5. Assert: Answer contains French text
  // 6. Assert: ≥1 citation visible
  // 7. Assert: Citation is clickable link
  // 8. Assert: DisclaimerBanner visible
  test('Submit legal question and receive answer with citations', async ({ page }) => { /* ... */ });
  ```

- [ ] T043 [US1] Create E2E test for citation validation in `tests/e2e/chat.spec.ts`
  ```ts
  // 1. Submit question
  // 2. Click citation link
  // 3. Assert: Opens official source URL (Légifrance/BOFiP/INPI/Urssaf)
  // 4. Assert: HTTP 200 response (URL is valid)
  test('Citations link to valid official sources', async ({ page }) => { /* ... */ });
  ```

- [ ] T044 [US1] Create E2E test for disclaimer compliance in `tests/e2e/chat.spec.ts`
  ```ts
  // 1. Submit question
  // 2. Assert: DisclaimerBanner visible (screenshot assertion)
  // 3. Assert: DisclaimerBanner is sticky (scroll test)
  // 4. Assert: No close button (non-dismissible)
  test('Disclaimer banner is visible and non-dismissible', async ({ page }) => { /* ... */ });
  ```

### Unit Tests

- [ ] T045 [P] [US1] Create unit test for chunking service in `tests/unit/chunking.test.ts`
  ```ts
  // Test: 500-1000 token chunks
  // Test: Article boundary preservation
  // Test: 100-token overlap
  test('Chunks preserve article boundaries', () => { /* ... */ });
  ```

- [ ] T046 [P] [US1] Create unit test for retrieval service in `tests/unit/retrieval.test.ts`
  ```ts
  // Test: Hybrid search weights (70% vector + 30% BM25)
  // Test: RRF fusion algorithm
  // Test: Top-5 chunks returned
  test('Hybrid search returns top-5 relevant chunks', async () => { /* ... */ });
  ```

- [ ] T047 [P] [US1] Create unit test for citation extraction in `tests/unit/synthesis.test.ts`
  ```ts
  // Test: Claude Citations API response parsing
  // Test: Article reference format ("CGI Art. 206-209")
  // Test: URL generation (Légifrance, BOFiP, INPI, Urssaf)
  test('Extracts citations from Claude response', async () => { /* ... */ });
  ```

- [ ] T048 [P] [US1] Create unit test for CitationLink component in `tests/unit/citation-link.test.ts`
  ```ts
  // Test: Renders badge with article ref
  // Test: Clickable link opens in new tab
  // Test: Tooltip shows document title on hover
  test('CitationLink renders clickable badge', () => { /* ... */ });
  ```

### Integration & Performance

- [ ] T049 [US1] Implement rate limiting middleware for POST /api/chat (10 questions/hour per user)
  ```ts
  // app/api/chat/route.ts: Check request count in last hour
  // Return 429 Too Many Requests if limit exceeded
  if (requestCount >= 10) { return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 }); }
  ```

- [ ] T050 [US1] Add performance monitoring to RAG pipeline (log retrieval + synthesis latency)
  ```ts
  // lib/rag/retrieval.ts: console.log('[RAG] Retrieval: Xms')
  // lib/rag/synthesis.ts: console.log('[RAG] Synthesis: Xms, Y tokens')
  ```

**Checkpoint 3**: ✅ User Story 1 complete - Users can submit legal questions and receive cited answers in <30s

**MVP Scope**: This phase alone constitutes a functional MVP (User Story 1 = 80% of value)

---

## Phase 4: User Story 2 - Source Transparency & Versioning (P2)

**Goal**: Display indexed legal sources with metadata (title, type, version, last updated, freshness warnings)

**Priority**: P2 (Trust & Transparency)

**Independent Test Criteria**:
- Can view list of all 5 indexed documents (BOFiP, CGI, INPI, Légifrance, Urssaf)
- Each document shows: title, source type, version, last updated date, status (active/archived)
- Documents older than 90 days show freshness warning badge
- Can click document to view details (chunk count, citation count)

**Duration**: 6-8 hours

### UI Components

- [ ] T051 [P] [US2] Create SourceCard component in `components/custom/source-card.tsx`
  ```tsx
  // Extends Card, displays document metadata
  // Includes: icon (📄/⚖️/🏛️/💼), title, metadata line, freshness badge, status badge
  export function SourceCard({ document }) { /* ... */ }
  ```

### API Routes

- [ ] T052 [P] [US2] Implement GET /api/documents route in `app/api/documents/route.ts`
  ```ts
  // List all documents (filter by status=active or archived)
  // Calculate freshness warning (last_updated > 90 days ago)
  export async function GET(request: Request) { /* ... */ }
  ```

- [ ] T053 [P] [US2] Implement GET /api/documents/[id] route in `app/api/documents/[id]/route.ts`
  ```ts
  // Get document details:
  // - Metadata (title, source type, version, last updated)
  // - Chunks count (SELECT COUNT(*) FROM embeddings WHERE document_id = ...)
  // - Citation count (SELECT COUNT(*) FROM citations WHERE document_id = ...)
  export async function GET(request: Request, { params }) { /* ... */ }
  ```

### Sources UI Page

- [ ] T054 [US2] Create sources page in `app/(dashboard)/sources/page.tsx`
  ```tsx
  // Display:
  // - Stats summary (5 active docs, last update date, coverage scope "SAS France")
  // - Document list (SourceCard components in grid layout)
  // - Filter dropdown (source type, status)
  export default function SourcesPage() { /* ... */ }
  ```

- [ ] T055 [US2] Implement document details modal (click SourceCard → Dialog with details)
  ```tsx
  // Dialog component showing:
  // - Full metadata
  // - Chunk count (X chunks indexed)
  // - Citation count (Cited Y times in conversations)
  // - Link to official source URL
  function DocumentDetailsDialog({ documentId }) { /* ... */ }
  ```

### State Management

- [ ] T056 [US2] Create useDocuments hook in `hooks/use-documents.ts`
  ```ts
  // React Query hook for fetching documents list
  export function useDocuments(filters?: { status?: string, sourceType?: string }) { /* ... */ }
  ```

- [ ] T057 [US2] Create useDocument hook in `hooks/use-document.ts`
  ```ts
  // React Query hook for fetching single document details
  export function useDocument(documentId: string) { /* ... */ }
  ```

### Testing (E2E)

- [ ] T058 [US2] Create E2E test for sources page in `tests/e2e/sources.spec.ts`
  ```ts
  // 1. Navigate to /sources
  // 2. Assert: 5 documents listed
  // 3. Assert: Each document has title, type, version, last updated date
  // 4. Assert: Freshness warnings visible for old documents (>90 days)
  test('Sources page displays all indexed documents', async ({ page }) => { /* ... */ });
  ```

- [ ] T059 [US2] Create E2E test for document details in `tests/e2e/sources.spec.ts`
  ```ts
  // 1. Click SourceCard
  // 2. Assert: Dialog opens with document details
  // 3. Assert: Chunk count visible
  // 4. Assert: Citation count visible
  // 5. Click official source URL
  // 6. Assert: Opens in new tab (Légifrance/BOFiP/INPI/Urssaf)
  test('Document details modal shows metadata', async ({ page }) => { /* ... */ });
  ```

### Unit Tests

- [ ] T060 [P] [US2] Create unit test for SourceCard component in `tests/unit/source-card.test.ts`
  ```ts
  // Test: Renders document metadata correctly
  // Test: Freshness warning badge for old documents
  // Test: Status badge (Actif/Archivé)
  test('SourceCard displays document metadata', () => { /* ... */ });
  ```

- [ ] T061 [P] [US2] Create unit test for freshness calculation in `tests/unit/formatting.test.ts`
  ```ts
  // Test: Document updated <90 days ago → no warning
  // Test: Document updated >90 days ago → warning badge
  // Test: Warning text: "⚠ Source ancienne (X jours)"
  test('Calculates freshness warning correctly', () => { /* ... */ });
  ```

### Integration

- [ ] T062 [US2] Add navigation link to sources page in dashboard sidebar
  ```tsx
  // app/(dashboard)/layout.tsx: Add "📚 Sources" link
  <Link href="/sources">📚 Sources</Link>
  ```

- [ ] T063 [US2] Seed 5 official documents metadata via `supabase/seed.sql`
  ```sql
  -- BOFiP SAS guide, CGI 206-209, INPI statuts, Légifrance L227-1 to L227-20, Urssaf year-1
  INSERT INTO documents (title, source_type, source_url, version, last_updated) VALUES (...);
  ```

- [ ] T064 [US2] Add document count stats to sources page header
  ```tsx
  // Stats cards: "5 Documents Actifs", "Dernière MAJ: 2024-10-15", "Couverture: SAS France"
  function SourcesStatsCards() { /* ... */ }
  ```

- [ ] T065 [US2] Implement filter dropdown for source type (Légifrance, BOFiP, INPI, Urssaf)
  ```tsx
  // Select component with onChange → refetch documents with filter
  function SourceTypeFilter({ onFilterChange }) { /* ... */ }
  ```

**Checkpoint 4**: ✅ User Story 2 complete - Users can view indexed sources with metadata and freshness warnings

---

## Phase 5: User Story 3 - Admin Document Ingestion (P3)

**Goal**: Admin-only panel to upload legal documents (PDF/HTML), trigger ingestion pipeline (chunking + embedding + pgvector storage)

**Priority**: P3 (Admin Feature, not critical for end-user MVP)

**Independent Test Criteria**:
- Admin user can access /admin panel (non-admin gets 403 Forbidden)
- Can upload PDF/HTML file (max 50MB)
- Can fill metadata form (title, source type, source URL, version, last updated)
- Document ingestion completes in <5 minutes for 50-page PDF
- Uploaded document appears in sources list with status "Active"
- Chunks are queryable in chat interface after ingestion

**Duration**: 8-10 hours

### Admin UI Components

- [ ] T066 [P] [US3] Install shadcn/ui components for admin panel
  ```bash
  npx shadcn-ui@latest add select dialog toast
  ```

- [ ] T067 [P] [US3] Create admin middleware in `app/(dashboard)/admin/middleware.ts`
  ```ts
  // Check user role = 'admin', return 403 if not admin
  export function middleware(request: Request) { /* ... */ }
  ```

- [ ] T068 [US3] Create admin layout in `app/(dashboard)/admin/layout.tsx`
  ```tsx
  // Admin-only layout with role check
  export default function AdminLayout({ children }) { /* ... */ }
  ```

- [ ] T069 [US3] Create admin page in `app/(dashboard)/admin/page.tsx`
  ```tsx
  // Admin dashboard:
  // - Upload document section (drag-drop area + metadata form)
  // - Recent ingestions list (status: processing/complete/failed)
  export default function AdminPage() { /* ... */ }
  ```

### Document Upload Form

- [ ] T070 [US3] Create DocumentUploadForm component in `components/custom/document-upload-form.tsx`
  ```tsx
  // File input (drag-drop, PDF/HTML only, max 50MB)
  // Metadata inputs: title, source type (select), source URL, version, last updated (date picker)
  // Submit button → POST /api/ingest
  export function DocumentUploadForm() { /* ... */ }
  ```

- [ ] T071 [US3] Implement file validation logic (PDF/HTML, max 50MB, French language detection)
  ```ts
  // Validate file type via MIME type
  // Validate file size (<50MB)
  // TODO: Language detection (defer to ingestion pipeline)
  function validateFile(file: File): boolean { /* ... */ }
  ```

### API Routes

- [ ] T072 [US3] Implement POST /api/ingest route in `app/api/ingest/route.ts`
  ```ts
  // 1. Check user role = 'admin' (403 if not)
  // 2. Validate file + metadata (Zod schema)
  // 3. Upload file to Supabase Storage
  // 4. Start async ingestion job (chunking + embedding + pgvector insert)
  // 5. Return 202 Accepted with documentId + estimated completion time
  export async function POST(request: Request) { /* ... */ }
  ```

### Ingestion Pipeline

- [ ] T073 [US3] Implement PDF text extraction in `lib/rag/pdf-parser.ts`
  ```ts
  // Use pdf-parse library to extract text from PDF
  pnpm add pdf-parse
  export async function extractTextFromPDF(fileBuffer: Buffer): Promise<string> { /* ... */ }
  ```

- [ ] T074 [US3] Implement HTML text extraction in `lib/rag/html-parser.ts`
  ```ts
  // Use cheerio to extract text from HTML
  pnpm add cheerio
  export async function extractTextFromHTML(html: string): Promise<string> { /* ... */ }
  ```

- [ ] T075 [US3] Implement ingestion orchestrator in `lib/rag/ingest.ts`
  ```ts
  // Orchestrate full ingestion pipeline:
  // 1. Extract text (PDF or HTML)
  // 2. Chunk text (chunking.ts)
  // 3. Generate embeddings for all chunks (embedding.ts, batch API calls)
  // 4. Insert chunks + vectors into embeddings table (pgvector)
  // 5. Update document status to 'active'
  export async function ingestDocument(documentId: string, filePath: string): Promise<void> { /* ... */ }
  ```

- [ ] T076 [US3] Implement batch embedding generation (OpenAI API, 100 chunks per batch)
  ```ts
  // lib/rag/embedding.ts: generateEmbeddingsBatch(chunks: string[]): Promise<number[][]>
  // Split chunks into batches of 100, call OpenAI API in parallel
  export async function generateEmbeddingsBatch(chunks: string[]): Promise<number[][]> { /* ... */ }
  ```

### State Management & UI Updates

- [ ] T077 [US3] Create useIngest hook in `hooks/use-ingest.ts`
  ```ts
  // React Query mutation for POST /api/ingest
  // Optimistic update: Show "Processing..." status immediately
  export function useIngest() { /* ... */ }
  ```

- [ ] T078 [US3] Implement ingestion status polling in admin page
  ```ts
  // Poll GET /api/documents/:id every 5 seconds until status changes from 'processing' to 'active'
  // Display progress toast: "Ingestion en cours... (X/Y chunks)"
  function useIngestionStatus(documentId: string) { /* ... */ }
  ```

### Testing (E2E)

- [ ] T079 [US3] Create E2E test for admin document upload in `tests/e2e/admin.spec.ts`
  ```ts
  // 1. Login as admin user
  // 2. Navigate to /admin
  // 3. Upload test PDF (5 pages, sample legal document)
  // 4. Fill metadata form
  // 5. Submit ingestion
  // 6. Assert: 202 Accepted response
  // 7. Poll status until 'active' (max 5 min timeout)
  // 8. Navigate to /sources
  // 9. Assert: Uploaded document appears in list
  test('Admin can upload and ingest document', async ({ page }) => { /* ... */ });
  ```

- [ ] T080 [US3] Create E2E test for non-admin access restriction in `tests/e2e/admin.spec.ts`
  ```ts
  // 1. Login as standard user (not admin)
  // 2. Navigate to /admin
  // 3. Assert: 403 Forbidden error or redirect to /chat
  test('Non-admin users cannot access admin panel', async ({ page }) => { /* ... */ });
  ```

**Checkpoint 5**: ✅ User Story 3 complete - Admins can upload documents and expand knowledge base

---

## Phase 6: Polish & Integration (Cross-Cutting Concerns)

**Goal**: Final polish, performance optimization, documentation, deployment preparation

**Duration**: 6-8 hours

### Performance & Monitoring

- [ ] T081 [P] Enable Vercel Analytics in `app/layout.tsx`
  ```tsx
  import { Analytics } from '@vercel/analytics/react';
  export default function RootLayout({ children }) {
    return <html><body>{children}<Analytics /></body></html>;
  }
  ```

- [ ] T082 [P] Implement error boundaries in `app/error.tsx` and `app/global-error.tsx`
  ```tsx
  // Catch runtime errors, display user-friendly error page
  export default function Error({ error, reset }) { /* ... */ }
  ```

- [ ] T083 [P] Add loading states (Suspense + Skeleton) to all pages
  ```tsx
  // app/(dashboard)/chat/loading.tsx: Skeleton for message list
  // app/(dashboard)/sources/loading.tsx: Skeleton for document grid
  export default function Loading() { return <Skeleton />; }
  ```

### Documentation

- [ ] T084 Create README.md with project overview and quickstart instructions
  ```md
  # Juri MVP - RAG Legal Assistant
  ## Setup
  1. Clone repo: `git clone ...`
  2. Install dependencies: `pnpm install`
  3. Start Supabase: `supabase start`
  ...
  ```

- [ ] T085 Add API documentation link to README (OpenAPI spec at `specs/001-specify-scripts-bash/contracts/openapi.yaml`)
  ```md
  ## API Documentation
  See [openapi.yaml](specs/001-specify-scripts-bash/contracts/openapi.yaml) for complete API specification.
  ```

### Deployment Preparation

- [ ] T086 Create production Supabase project and push migrations
  ```bash
  # 1. Create project at supabase.com
  # 2. Link local project: supabase link --project-ref <project-id>
  # 3. Push migrations: supabase db push
  ```

- [ ] T087 Deploy to Vercel and configure environment variables
  ```bash
  # 1. Install Vercel CLI: pnpm install -g vercel
  # 2. Login: vercel login
  # 3. Deploy: vercel --prod
  # 4. Set env vars in Vercel dashboard (Supabase URL/keys, OpenAI/Claude API keys)
  ```

**Checkpoint 6**: ✅ All phases complete - Production-ready deployment

---

## Task Dependencies & Execution Order

### Critical Path (Must Complete Sequentially)

```
Phase 1: Setup (T001-T010)
   ↓
Phase 2: Foundational (T011-T025)
   ↓
Phase 3: User Story 1 [P1] (T026-T050)
   ↓
Phase 4: User Story 2 [P2] (T051-T065)
   ↓
Phase 5: User Story 3 [P3] (T066-T080)
   ↓
Phase 6: Polish (T081-T087)
```

**Blocking Dependencies**:
- Phase 2 (Foundational) → BLOCKS → All User Story phases (database schema + RAG services required)
- User Story 1 → BLOCKS → User Story 2 (sources page links to conversations via citations)
- User Story 2 → NO BLOCK → User Story 3 (independent admin feature)

**Parallel Opportunities**:
- Within Setup (T001, T002, T003, T005, T006, T007, T008, T009 can run in parallel)
- Within Foundational (T015, T016, T017, T018, T021, T022 can run in parallel after T011-T014 complete)
- Within each User Story phase: All [P] tasks can run in parallel

### Parallel Execution Examples

**Phase 2 Foundational (after database migrations T011-T013)**:
```
Parallel Group A:
- T015: Auth helpers
- T016: Database queries
- T017: Chunking service
- T018: Embedding service
- T021: Validation schemas
- T022: Citation formatting

Sequential Group B (after Group A):
- T019: Hybrid retrieval (depends on T017, T018)
- T020: Claude synthesis (depends on T022)
```

**Phase 3 User Story 1 (after T031 POST /api/chat is complete)**:
```
Parallel Group A:
- T026: Install shadcn components
- T027: DisclaimerBanner component
- T028: MessageBubble component
- T029: CitationLink component
- T030: ConversationItem component

Parallel Group B (after Group A):
- T032: GET /api/conversations
- T033: POST /api/conversations
- T034: GET /api/conversations/[id]

Sequential Group C (depends on Group A + B):
- T035: Dashboard layout
- T036: Chat page
- T037: Conversation creation logic
- T038: Question submission logic
```

---

## Task Count Summary

| Phase | Task Count | Estimated Duration |
|-------|------------|-------------------|
| Phase 1: Setup | 10 tasks | 4-6 hours |
| Phase 2: Foundational | 15 tasks | 8-10 hours |
| Phase 3: User Story 1 [P1] | 25 tasks | 12-16 hours |
| Phase 4: User Story 2 [P2] | 15 tasks | 6-8 hours |
| Phase 5: User Story 3 [P3] | 15 tasks | 8-10 hours |
| Phase 6: Polish | 7 tasks | 6-8 hours |
| **Total** | **87 tasks** | **44-58 hours** |

**Parallelization Factor**: ~40% of tasks can run in parallel (35/87 tasks marked [P])

**Estimated Timeline**:
- 1 developer: 44-58 hours → 1-2 weeks (6-8h/day)
- 2 developers (parallel execution): 26-34 hours → 4-5 days (6-8h/day)

---

## Implementation Strategy

### MVP Scope (Recommended)

**MVP = User Story 1 only (Phase 1 + Phase 2 + Phase 3)**

**Rationale**:
- User Story 1 delivers 80% of user value (core RAG Q&A with citations)
- 50 tasks, 24-32 hours, 3-4 days implementation
- Validates technical feasibility + user demand before investing in US2/US3

**Post-MVP Expansion**:
- After US1 validation (80% accuracy on 10 test questions) → Add US2 (sources transparency)
- After 1-2 weeks production usage → Add US3 (admin ingestion for knowledge base growth)

### Incremental Delivery

**Week 1** (Phase 1 + Phase 2 + Phase 3 US1):
- Day 1-2: Setup + Foundational (T001-T025)
- Day 3-4: US1 Components + API Routes (T026-T038)
- Day 5: US1 Testing + Integration (T039-T050)

**Week 2** (Phase 4 + Phase 5 + Phase 6):
- Day 6-7: US2 Sources Page (T051-T065)
- Day 8-9: US3 Admin Ingestion (T066-T080)
- Day 10: Polish + Deployment (T081-T087)

### Quality Gates

**After Phase 2 (Foundational)**:
- ✅ Database schema deployed (verify with Supabase Studio)
- ✅ RLS policies active (test auth isolation)
- ✅ RAG services functional (unit tests pass)

**After Phase 3 (User Story 1)**:
- ✅ Can submit question and receive answer with citations
- ✅ E2E test passes (chat.spec.ts)
- ✅ 80% accuracy on 10 test questions (manual validation)
- ✅ Response time <30 seconds p95 (Vercel Analytics)

**Before Deployment (Phase 6)**:
- ✅ CI/CD passes (lint, type-check, build, test)
- ✅ All E2E tests pass (auth, chat, sources, admin)
- ✅ Performance targets met (latency, cost, accuracy)
- ✅ Constitution compliance verified (all 5 principles satisfied)

---

## Next Steps

1. **Review tasks.md** with team/stakeholders to validate scope and priorities
2. **Start with MVP** (Phases 1-3: User Story 1 only) for fastest time-to-value
3. **Execute tasks sequentially** following the dependency graph
4. **Mark tasks complete** in this file as they're finished (checkbox format)
5. **Run checkpoints** after each phase to validate quality gates
6. **Deploy MVP** after Phase 3, gather user feedback, iterate on US2/US3

**For automated execution**, proceed to:
- `/speckit.agents` - Generate ORCHESTRATION.md for sub-agent coordination
- `/speckit.final` - Full automation (2-3h implementation via parallelized agents)

---

**Generated**: 2025-10-18
**Branch**: 001-specify-scripts-bash
**Status**: Tasks Breakdown Complete → Ready for Implementation or `/speckit.final`
