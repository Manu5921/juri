# Specification Prompt: Juri - RAG Assistant Technical Context

## Technical Overview
- **Stack:** Next.js (frontend) + Supabase (pgvector, auth, DB) + Claude API (zero-retention)
- **Architecture:** RAG pipeline (document ingestion → embedding → hybrid retrieval → LLM synthesis)
- **Deployment:** Vercel (frontend) + Supabase Cloud (data) OR Railway all-in-one

## Database Entities (HIGH-LEVEL)
- `users` - Auth (Supabase Auth integration) + usage tracking
- `documents` - Source metadata (title, source_type: "legifrance"|"bofip"|"eur-lex", url, last_updated, version)
- `embeddings` - Chunked text + vector (pgvector) + document_id FK + chunk_metadata (page, article_ref)
- `conversations` - Chat history (user_id, messages JSON, created_at)
- `sources_cited` - Join table (conversation_id, document_id, article_ref) for audit trail

**Note:** Full schema in /speckit.specify. Prioritize source versioning (legal docs change) + citation tracking.

## API Endpoints (Critical Path)
- **POST /api/query** - Accepts question → hybrid retrieval (pgvector similarity + BM25) → Claude synthesis → returns answer + citations array. Auth required.
- **GET /api/documents** - List indexed sources (for transparency UI: "Based on BOFiP v2024-Q1, CGI as of 2024-09-15"). Admin only.
- **POST /api/ingest** - Admin endpoint: upload PDF/HTML → chunk → embed (OpenAI text-embedding-3-small) → store. Validates source authenticity.

**Note:** Retrieval logic (hybrid search) is core complexity - optimize in /speckit.specify.

## Data Sources & Ingestion Strategy
- **Official APIs:** PISTE (Légifrance free account), BOFiP (HTML scraping or PDFs), EUR-Lex (REST API)
- **MCP Légifrance:** Existing open-source MCP server for live queries (integrate v2.0)
- **MVP scope:** 5 curated documents:
  1. BOFiP - Guide création SAS (Impôts)
  2. Code Général Impôts - Articles 206-209 (IR vs IS)
  3. INPI - Modèle statuts SAS
  4. Légifrance - Articles L227-1 à L227-20 (SAS legal framework)
  5. Urssaf - Déclarations année 1
- **Quality gate:** Manual review each doc before ingestion (legal validity check)

## RAG Architecture Details
- **Chunking:** 500-1000 tokens/chunk, overlap 100 tokens. Preserve article boundaries (legal citations context).
- **Embeddings:** OpenAI text-embedding-3-small (cost-effective, good French performance) OR local multilingual-e5 if privacy critical.
- **Retrieval:** Hybrid (70% dense vector similarity + 30% BM25 keyword). Return top 5 chunks.
- **LLM prompt:** "Answer based ONLY on provided context. Cite sources (article, page). If unsure, say 'Not covered in sources - consult expert'."
- **Citation format:** "Selon BOFiP §120, article CGI 206..." (clickable refs in UI).

## Design System Direction
- **UI Library:** shadcn/ui (React) + Tailwind CSS
- **Styling:** Minimal, trust-focused (legal context = clarity > flashy design)
- **Key UX:**
  - Chat interface (primary)
  - Source transparency sidebar (shows indexed docs + versions)
  - Disclaimer banner (permanent, non-dismissible)
- **Wireframes needed:** Chat view, source explorer, admin ingestion panel

## Testing Strategy
- **E2E:** 10 predefined legal questions (test set) → verify citations correct + answer quality (manual review).
- **Unit:** RAG retrieval (top-k accuracy), chunking (article boundaries preserved), LLM prompt validation.
- **Data quality:** Quarterly source freshness check (PISTE API version monitoring).
- **Coverage target:** >80% backend (RAG pipeline critical), >60% frontend.

## Performance Targets (MVP)
- **Query response:** <30s (embed query + retrieve + LLM generation)
- **Retrieval latency:** <200ms (pgvector indexed)
- **LLM token limit:** <4K context (5 chunks × 800 tokens = manageable cost)

## Security & Confidentiality
- **LLM provider:** Claude API with zero-retention DPA OR Ollama local (llama3.2) if API unacceptable.
- **Data encryption:** Supabase RLS (row-level security) for conversations, TLS in-transit.
- **Admin controls:** Ingestion endpoint IP-restricted + API key auth.
- **GDPR:** Not applicable (internal use, no PII collection). If user data added later: right to deletion, export.

## Deployment & Monitoring
- **Hosting:** Vercel (Next.js) - zero-config, fast deploys.
- **Database:** Supabase Cloud (free tier → paid when scaling).
- **Monitoring:** Supabase logs + Vercel Analytics. Track: query latency, LLM token usage (cost control), retrieval accuracy (manual spot-checks).
- **Cost control:** Claude API ~$0.01/query (assume 100 queries/month = $1). Budget alert >$50/month.

## Success Validation (MVP Gate)
- **10 test questions:** All answered with correct citations from indexed sources.
- **Citation accuracy:** 100% clickable refs (Légifrance article IDs valid).
- **Disclaimer present:** Every response shows "Not legal advice" banner.
- **If this works → v2.0 (MCP Légifrance). If not → revert to Notion checklist.**

---

**Tone:** Engineering pragmatism. RAG quality = project success.
**Format:** Use as context for /speckit.specify (technical depth expected here).
**Flexibility:** MCP integration, local LLM, hybrid retrieval weights - all tunable during /speckit.specify.
