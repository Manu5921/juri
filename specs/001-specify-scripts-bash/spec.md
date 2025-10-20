# Feature Specification: RAG Legal & Financial Assistant (Juri MVP)

**Feature Branch**: `001-specify-scripts-bash`
**Created**: 2025-10-18
**Status**: Draft
**Input**: User description: "RAG-powered legal and financial assistant for internal PME use with French source citations"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Quick Legal Question with Citations (Priority: P1)

As a PME founder, I need to quickly find answers to common legal questions about creating a SAS in France, with exact citations to official sources (Légifrance, BOFiP) so I can verify the information with my lawyer and save research time.

**Why this priority**: This is the core value proposition. Founders spend 8-10h/month researching basic legal questions. If this story works, it delivers immediate ROI.

**Independent Test**: Can be fully tested by asking 5-10 predefined questions (e.g., "What are the differences between SAS and SARL for tax purposes?") and verifying that each answer includes clickable citations to Légifrance or BOFiP with correct article references.

**Acceptance Scenarios**:

1. **Given** I am a logged-in PME founder, **When** I type "Quelle est la différence entre IR et IS pour une SAS?", **Then** I receive an answer in under 30 seconds with citations to Code Général des Impôts articles 206-209 and BOFiP references.

2. **Given** I receive an answer with citations, **When** I click on a Légifrance article reference, **Then** I am directed to the exact article on the official Légifrance website.

3. **Given** I ask a question outside the indexed sources, **When** the system cannot find relevant information, **Then** I see the message "Not covered in sources - consult expert" instead of a hallucinated answer.

4. **Given** I am viewing any answer, **When** the answer is displayed, **Then** I always see a permanent disclaimer banner: "Not legal advice - validate with expert for statuts/declarations/decisions >€5K".

---

### User Story 2 - Source Transparency & Versioning (Priority: P2)

As a PME founder, I need to see which legal sources are indexed and their versions (e.g., "BOFiP v2024-Q1", "CGI as of 2024-09-15") so I can assess the freshness of the information and know when sources were last updated.

**Why this priority**: Trust depends on transparency. Knowing source versions enables founders to catch outdated information and decide if expert validation is needed.

**Independent Test**: Can be tested by viewing the "Sources" page and verifying that all 5 MVP documents are listed with titles, source types, URLs, and last-updated dates.

**Acceptance Scenarios**:

1. **Given** I am logged in, **When** I navigate to the "Sources" page, **Then** I see a list of all indexed documents (BOFiP SAS guide, CGI articles 206-209, INPI statuts, Légifrance L227-1 to L227-20, Urssaf year-1 declarations).

2. **Given** I am viewing the sources list, **When** I check each document entry, **Then** each entry shows: title, source type (Légifrance/BOFiP/INPI/Urssaf), URL to official source, and last-updated date.

3. **Given** a source document was updated more than 3 months ago, **When** I view the sources list, **Then** the document is flagged with a warning: "Source may be outdated - last updated [date]".

---

### User Story 3 - Admin Document Ingestion (Priority: P3)

As a system administrator (PME founder with admin access), I need to upload new legal documents (PDFs or HTML files) and have them automatically chunked, embedded, and indexed so I can expand the knowledge base with relevant sources.

**Why this priority**: While not critical for MVP launch, this enables knowledge base growth without developer intervention. Deprioritized because the initial 5 documents can be pre-ingested.

**Independent Test**: Can be tested by uploading a sample PDF (e.g., a 10-page Légifrance article), verifying it appears in the sources list, and confirming that questions related to the new document return cited answers.

**Acceptance Scenarios**:

1. **Given** I am logged in as admin, **When** I navigate to the "Admin" section and upload a PDF with source type "Légifrance", **Then** the system validates the file format, chunks the text (500-1000 tokens/chunk), generates embeddings, and stores them in the database.

2. **Given** I uploaded a new document, **When** the ingestion completes (under 5 minutes for a 50-page document), **Then** the document appears in the sources list with title extracted from metadata, source type, upload date, and status "Active".

3. **Given** a document upload fails validation (e.g., corrupted PDF, non-French language), **When** the validation error occurs, **Then** I see a clear error message explaining the failure reason and suggested fixes.

---

### Edge Cases

- **What happens when** a user asks a question in English (not French)?
  - System responds: "This assistant is optimized for French legal/fiscal questions. For questions in other languages, please rephrase in French or consult an expert."

- **What happens when** two source documents contradict each other (e.g., different interpretations of a tax rule)?
  - System returns both sources with citations and adds: "Multiple interpretations found - consult expert to resolve ambiguity."

- **What happens when** the vector database (pgvector) is temporarily unavailable?
  - System shows user-friendly error: "Knowledge base temporarily unavailable. Please try again in a few moments."

- **What happens when** a user asks the same question twice within 1 hour?
  - System retrieves the cached answer from conversation history (no re-embedding, no new LLM call) to reduce latency and cost.

- **What happens when** a question contains personally identifiable information (PII) like "My company [Company Name] needs to..."?
  - System processes the question normally (internal use, no external data sharing) but logs a warning if data retention policies are later added.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow logged-in users to submit natural language questions in French via a chat interface.

- **FR-002**: System MUST perform hybrid retrieval (70% dense vector similarity via pgvector + 30% BM25 keyword search) across indexed document chunks and return top 5 most relevant chunks.

- **FR-003**: System MUST synthesize an answer using an external language model (Claude 3.5 Sonnet API with zero-retention DPA or local Ollama model) based ONLY on retrieved context.

- **FR-004**: System MUST cite exact sources in every answer using the format "Selon BOFiP §120, article CGI 206..." with hyperlinked references to official URLs (Légifrance, BOFiP, INPI, Urssaf).

- **FR-005**: System MUST display a permanent, non-dismissible disclaimer on every response: "Not legal advice - validate with expert for statuts/declarations/decisions >€5K".

- **FR-006**: System MUST respond "Not covered in sources - consult expert" when no relevant chunks are found (similarity score below threshold).

- **FR-007**: System MUST index exactly 5 curated documents for MVP: BOFiP SAS creation guide, Code Général des Impôts articles 206-209, INPI statut templates, Légifrance articles L227-1 to L227-20, Urssaf year-1 declarations.

- **FR-008**: System MUST chunk documents into 500-1000 token segments with 100-token overlap, preserving article boundaries (no mid-article splits) for legal citation context.

- **FR-009**: System MUST version-track every indexed document with metadata: title, source_type (legifrance/bofip/inpi/urssaf), official URL, last_updated date, version identifier.

- **FR-010**: System MUST store citation audit trail linking each conversation to cited document chunks (conversation_id → document_id → article_ref) for traceability.

- **FR-011**: System MUST provide a "Sources" page listing all indexed documents with title, source type, URL, last-updated date, and version.

- **FR-012**: System MUST authenticate users via standard session-based authentication and restrict document ingestion to admin users only.

- **FR-013**: Admin users MUST be able to upload legal documents (PDF or HTML format) via an admin panel, triggering automatic chunking, embedding (OpenAI text-embedding-3-small or local multilingual-e5), and indexing.

- **FR-014**: System MUST validate uploaded documents before ingestion: check file format (PDF/HTML), detect language (French required), verify source authenticity marker if provided.

- **FR-015**: System MUST reject questions outside MVP scope (SAS creation France + IR/IS year-1 only) with message: "This question is outside current scope (SAS creation France). Consult expert for [topic]."

- **FR-016**: System MUST log all queries, retrieved chunks, and generated answers for performance monitoring and quality spot-checks.

- **FR-017**: System MUST flag sources older than 90 days with warning: "Source may be outdated - last updated [date]" on the Sources page.

### Key Entities *(include if feature involves data)*

- **User**: PME founder with authentication credentials, usage tracking (queries submitted, last active date), role (standard user or admin).

- **Document**: Legal source file with metadata (title, source type, official URL, upload date, last-updated date, version identifier, status [active/archived]).

- **Embedding**: Chunked text segment with vector representation (1536 dimensions for text-embedding-3-small), reference to parent document, chunk metadata (page number, article reference, chunk position).

- **Conversation**: Chat session linking user to messages exchanged, with timestamp and status (active/archived).

- **Message**: Individual query or answer within a conversation, including text content, role (user/assistant), timestamp, and citations array.

- **Citation**: Link between a message and a source document chunk, storing article reference, page number, and URL for audit trail.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can submit a question and receive an answer with citations in under 30 seconds (measured from question submission to answer display).

- **SC-002**: System answers 80% of 10 predefined test questions correctly with accurate citations to official sources (Légifrance article IDs, BOFiP section numbers).

- **SC-003**: 100% of citations are clickable and direct users to the exact article on official source websites (Légifrance, BOFiP, INPI, Urssaf).

- **SC-004**: Disclaimer banner is visible on every response (100% compliance verified via manual UI checks).

- **SC-005**: Users save 8-10 hours per month on legal/fiscal research compared to manual Google/forum searches (measured via usage logs and user survey after 3 months).

- **SC-006**: System avoids 2 expert consultations per quarter (€400-800 saved) by answering foundational questions internally (measured via consultation expense tracking).

- **SC-007**: Document ingestion completes within 5 minutes for a 50-page PDF (measured from upload to "Active" status).

- **SC-008**: System handles 100 queries per month with total cost under €50/month (Claude API + OpenAI embeddings + Supabase + Vercel hosting).

- **SC-009**: Source freshness warnings are displayed for documents older than 90 days (100% accuracy verified via automated checks).

- **SC-010**: Zero hallucinated answers in 10-question test set - all responses either cite sources or explicitly state "Not covered in sources".

## Assumptions *(optional)*

- Users have basic familiarity with French legal terminology (e.g., "SAS", "IR", "IS", "CGI").
- All legal sources are in French (no multi-language support required for MVP).
- Users have reliable internet access (no offline mode).
- PME founders have authority to decide whether expert validation is needed (no automated risk scoring).
- Legal sources are publicly accessible via official APIs (PISTE/Légifrance free account, BOFiP public HTML, INPI public PDFs, Urssaf public guides).

## Dependencies *(optional)*

- PISTE account approval (Légifrance API access) - free but requires registration.
- OpenAI API account for text-embedding-3-small (or fallback to local multilingual-e5 if privacy required).
- Claude API account with zero-retention DPA (or fallback to Ollama local model).
- Supabase project with pgvector extension enabled.
- Vercel account for frontend deployment.

## Out of Scope (MVP) *(optional)*

- Multi-jurisdictional support (non-France legal systems).
- Case law integration (EUR-Lex, CEDH/HUDOC) - deferred to v2.0.
- MCP Légifrance live queries - deferred to v2.0 after MVP validation.
- Multi-language support (English, German, etc.).
- Automated risk scoring for questions (flagging high-stakes vs. low-stakes).
- Mobile app (web-only for MVP).
- Real-time collaboration (multiple users discussing same question).
- Fine-tuning for response style or intent routing (RAG-only for MVP).

---

## 🎨 Design System (Phase 1 - Placeholder)

### Design Tokens Generated
**File:** `design/design-tokens.json`

**Status:** ✅ Placeholder tokens (indigo theme for legal/professional context)

**Theme Selection:**
- **Primary:** Indigo (#6366F1) - Professional, trust-focused, legal authority
- **Secondary:** Teal (#14B8A6) - Accent for citations, success states
- **Neutral:** Slate (#64748B) - Clean, readable text and backgrounds
- **Typography:** Satoshi (headings) + Inter (body) - Professional, accessible

**Customization:** Phase 4 via `/import-design custom-tokens.json` (15-min merge, 0 code changes)

### Wireframes Generated
**Directory:** `design/wireframes/`

**Files:**
- `chat-interface.svg` - Main chat layout with sidebar, messages, disclaimer banner, citation links
- `sources-page.svg` - Source document list with metadata, freshness indicators, status badges
- `admin-ingestion.svg` - Document upload form with drag-drop area, metadata fields, processing status
- `auth-flow.svg` - Authentication screens (login, signup, password reset)

**Purpose:** Low-fidelity mockups for frontend-specialist agent (Phase 2 implementation)

### Components List
**File:** `design/components-list.md`

**shadcn/ui Components:** 18 base components + 5 custom components = **23 total**

**Installation:** Ready (command provided in components-list.md)

**Custom Components (Juri-Specific):**
- `message-bubble` - User/assistant/system message cards with citations
- `citation-link` - Clickable citation badges with tooltips (e.g., "📄 CGI Art. 206-209")
- `disclaimer-banner` - Non-dismissible warning banner (constitutional requirement)
- `source-card` - Document metadata cards with freshness indicators
- `conversation-item` - Conversation history sidebar items

---

**Design/Dev Decoupling Status:** ✅ READY
- Dev can start using placeholder tokens immediately (Phase 2: `/speckit.plan` → `/speckit.tasks` → `/speckit.final`)
- Designer can work in parallel (Figma → custom-tokens.json)
- Merge custom brand in 15 min (Phase 4) with 0 code changes

**Competitive Advantage:** 95% faster custom brand integration vs Lovable/Bolt/v0 (15 min vs 1-2 days refactor)

**Health Score:** 9.9/10 (GOLDEN-PATTERNS.md - Design/Dev Decoupling pattern)
