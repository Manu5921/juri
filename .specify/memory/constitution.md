<!--
SYNC IMPACT REPORT
==================
Version Change: Template → 1.0.0
Type: MINOR (Initial constitution establishment)
Date: 2025-10-18

Modified Principles:
- Added: I. Data Quality First
- Added: II. Source Citation Mandatory
- Added: III. Human-in-the-Loop (NON-NEGOTIABLE)
- Added: IV. Scope Discipline
- Added: V. RAG Over Fine-Tuning

Added Sections:
- Tech Stack Requirements
- Development Workflow
- Governance

Templates Status:
⚠ .specify/templates/plan-template.md - Pending validation
⚠ .specify/templates/spec-template.md - Pending validation
⚠ .specify/templates/tasks-template.md - Pending validation

Follow-up TODOs:
- Validate template alignment after spec generation
- Set up quarterly source refresh schedule
- Define 10 test questions for MVP validation
-->

# Juri Constitution

## Core Principles

### I. Data Quality First
**The reliability of legal/fiscal outputs depends entirely on source document quality.**

MUST requirements:
- Start with 5 official sources only: BOFiP (SAS creation guide), Code Général des Impôts
  (articles 206-209), INPI (statut templates), Légifrance (articles L227-1 to L227-20),
  Urssaf (year-1 declarations)
- Version-track every source document (BOFiP v2024-Q1, CGI as of 2024-09-15, etc.)
- Manual legal validity review before ingestion (no automated scraping without verification)
- Quarterly refresh cycle for all indexed sources
- Reject outdated or unofficial sources (no forum posts, no generic legal advice sites)

**Rationale:** GIGO (Garbage In, Garbage Out) is the primary risk. Incorrect legal/fiscal
guidance can lead to costly mistakes. Official APIs (PISTE/Légifrance, BOFiP) guarantee
legal accuracy and traceability.

### II. Source Citation Mandatory
**Every answer MUST cite exact sources: article number, section, page, and clickable URL.**

MUST requirements:
- Citation format: "Selon BOFiP §120, article CGI 206..." with hyperlinked references
- Store citation metadata: conversation_id → document_id → article_ref (audit trail)
- UI displays sources sidebar showing indexed docs + versions
- Retrieval returns top 5 chunks with preserved article boundaries (legal context)
- If answer not found in sources, respond: "Not covered in sources - consult expert"

**Rationale:** Citations enable expert validation, mitigate over-confidence risk, and provide
transparency. Users can verify claims against official sources. This is non-negotiable for
legal/fiscal reliability.

### III. Human-in-the-Loop (NON-NEGOTIABLE)
**AI provides decision support, NOT final legal/fiscal advice. Professional validation is
mandatory for high-stakes decisions.**

MUST requirements:
- Permanent disclaimer on every response: "Not legal advice - validate with expert for
  statuts/declarations/decisions >€5K"
- Disclaimer non-dismissible in UI (banner always visible)
- Flag high-stakes questions (statuts finaux, déclarations fiscales, contrats, decisions
  >€5K) for mandatory expert review
- Tool positioned as "sparring partner" intellectually, not oracle
- Success metric includes "hours saved researching" NOT "decisions made without expert"

**Rationale:** Internal use does not eliminate legal/fiscal risk. Founders must maintain
verification discipline. Prevents dangerous over-reliance on AI outputs. Protects against
liability from incorrect recommendations.

### IV. Scope Discipline
**Resist feature creep. V1 scope: SAS creation France + IR/IS fiscality year-1 only.**

MUST requirements:
- MVP scope limited to 10-15 predefined questions (SAS vs SARL, IR vs IS year-1)
- Reject requests outside scope: "This question is outside current scope (SAS creation
  France). Consult expert for [topic]."
- Expansion requires validation gate: if v1.0 answers 80% test questions correctly →
  consider v2.0 (MCP Légifrance live queries, EUR-Lex case law)
- No multi-jurisdictional features (France only until proven)
- "All French law" is explicitly out of scope forever (maintain niche focus)

**Rationale:** Scope creep is the #1 project killer. Limited scope = achievable timeline
(1-2 weeks MVP). Deep expertise in one niche beats shallow coverage of everything.
Validates ROI before expansion investment.

### V. RAG Over Fine-Tuning
**Use Retrieval-Augmented Generation for legal/fiscal knowledge. Fine-tuning reserved for
style/routing only.**

MUST requirements:
- Primary knowledge storage: Supabase pgvector (embeddings) + metadata (article refs,
  versions)
- Hybrid retrieval: 70% dense vector similarity + 30% BM25 keyword search
- Chunking: 500-1000 tokens/chunk, 100-token overlap, preserve article boundaries
- LLM receives retrieved context only (no legal knowledge in model weights)
- Fine-tuning permitted only for: response style (tone), intent routing (fiscal vs legal),
  internal examples (not legal statutes)

**Rationale:** RAG ensures version freshness (legal docs change), enables exact citations
(traceability), and avoids model hallucinations on legal facts. Fine-tuning legal statutes
into weights loses versioning and citation capability. State-of-the-art for legal AI is
RAG-first architecture.

## Tech Stack Requirements

**Mandatory Stack:**
- **Frontend:** Next.js 15 + TypeScript strict + Tailwind CSS + shadcn/ui
- **Backend/DB:** Supabase (PostgreSQL + pgvector + Auth + RLS)
- **LLM:** Claude 3.5 Sonnet API with zero-retention DPA (confidentiality guarantee)
  OR Ollama local (llama3.2) if API unacceptable for data sensitivity
- **Embeddings:** OpenAI text-embedding-3-small (cost-effective, strong French performance)
  OR local multilingual-e5 if privacy critical
- **Deployment:** Vercel (Next.js frontend) + Supabase Cloud

**Rationale:**
- Next.js/Supabase: Standard startup stack, fast iteration, all-in-one simplicity
- Claude API zero-retention: Best citation quality + confidentiality contractual guarantee
- pgvector: Production-ready vector search, integrated with Supabase (no separate service)
- Hybrid retrieval: State-of-the-art accuracy for legal queries (dense + keyword)

**Confidentiality:**
- Claude API zero-retention DPA prevents training on PME strategic/financial data
- Supabase RLS (row-level security) for conversation isolation
- TLS in-transit, API key auth for admin endpoints (ingestion IP-restricted)
- GDPR: Not applicable (internal use, no PII collection from external users)

## Development Workflow

**Phase 0 - Validation (2h):**
- Create Notion/Airtable checklist: 10 questions + Légifrance links + IR/IS comparison
- Test 1 week: if resolves 80% need → AI unnecessary, if frustrating → GO Phase 1

**Phase 1 - MVP (1-2 weeks):**
- Day 1-2: Next.js skeleton + Supabase schema + chat UI + disclaimer banner
- Day 3-7: Ingest 5 source docs (manual validation, chunking, embedding, pgvector storage)
- Week 2-3: RAG pipeline (hybrid retrieval, Claude synthesis, citation extraction)
- Success gate: 10 test questions answered <30sec with correct citations

**Phase 2 - Expansion (post-validation):**
- Add MCP Légifrance for live queries (if v1.0 validation successful)
- EUR-Lex integration if case law needed (defer until proven need)
- Conversation history + RAG prompt tuning based on usage patterns

**Quality Gates (Every Phase):**
- Build MUST pass (P0 blocker - exit 1 if TypeScript errors)
- ESLint 0 errors (P1 blocker - warnings acceptable if documented)
- Citation accuracy 100% (all Légifrance/BOFiP refs clickable and valid)
- Disclaimer visible every response (manual UI check)

## Success Metrics

**ROI Internal (3-month evaluation):**
- Time saved: 8-10h/month legal/fiscal research avoided
- Cost avoided: 2 expert consultations/quarter (€400-800 saved)
- Build time invested MUST be less than cumulative hours saved

**MVP Quality (v1.0 gate):**
- Answer coverage: 80% of 10 predefined SAS creation questions answerable
- Response time: <30 seconds with sources cited
- Citation accuracy: 100% clickable refs to Légifrance/BOFiP/INPI
- User satisfaction: Subjective "faster than manual search" validation

**Expansion Criteria (v2.0 decision):**
- v1.0 gates passed
- Additional question categories identified (3+ months usage)
- ROI positive (hours saved > build time + maintenance)

## Governance

**Constitution Authority:**
This constitution supersedes all other development practices. When conflicts arise between
ad-hoc decisions and constitutional principles, the constitution wins.

**Amendment Process:**
- MAJOR version bump: Removing/redefining core principles (e.g., removing human-in-the-loop)
  requires explicit justification + migration plan
- MINOR version bump: Adding new principle or materially expanding guidance
- PATCH version bump: Clarifications, wording improvements, non-semantic refinements

**Compliance Review:**
- Every PR/feature MUST verify alignment with principles (constitution checklist in PR
  template)
- Scope creep proposals trigger explicit constitution amendment discussion
- Quarterly constitution review: Are principles still valid? Do metrics validate approach?

**Development Guidance:**
- This constitution provides strategic direction (WHY)
- Technical specs provide tactical implementation (HOW)
- For runtime development guidance, see `project-memory.md` (session-specific decisions)

**Version**: 1.0.0 | **Ratified**: 2025-10-18 | **Last Amended**: 2025-10-18
