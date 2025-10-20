# Constitution Prompt: Juri - Internal Legal & Financial Assistant

## Project Context
- **Problem:** PME founders waste 8-10h/month on unfamiliar legal/fiscal tasks (statuts, IR vs IS, CGI articles) where they lack expertise
- **Solution:** Internal RAG-powered assistant providing cited answers from official French sources (Légifrance, BOFiP) for SAS creation & year-1 fiscal obligations
- **Target:** Internal use only - founders launching their PME (not a commercial product)

## Business Requirements (ROI Internal)
- **Time saved:** 8-10h/month legal/fiscal research avoided
- **Cost avoided:** 2 expert consultations/quarter (€400-800 saved)
- **Answer quality:** 80% common questions answered <5min with exact source citations
- **No revenue model:** This is a productivity tool, not a product. Metric = build time vs hours saved.

## Core Features (MVP)
- **RAG-based Q&A:** Semantic search across 5 curated docs (BOFiP SAS guide, CGI articles, INPI statut templates) → LLM synthesis with citations. WHY: Citations = trust, traceability beats fine-tuning for legal accuracy.
- **Source transparency:** Every answer cites article/page (Légifrance refs, BOFiP §). WHY: Mitigates over-confidence risk, enables expert validation.
- **Human-in-the-loop disclaimer:** Permanent "Not legal advice - validate with expert for statuts/declarations/decisions >€5K". WHY: Prevents dangerous reliance on AI for critical decisions.

## Tech Stack Rationale
- **Frontend:** Next.js (React) - Standard startup stack, fast iteration
- **Backend/DB:** Supabase (pgvector for embeddings, auth, DB all-in-one) - Simplicity over microservices
- **LLM:** Claude 3.5 Sonnet API (zero-retention contract) - Best citation quality + confidentiality guarantee. Alternative: Ollama local (llama3.2) if API concerns.
- **RAG:** Hybrid retrieval (dense embeddings + BM25 keyword) - State-of-the-art accuracy for legal queries

## Key Risks & Mitigations
- **GIGO (Garbage In, Garbage Out):** Outdated/wrong source docs = dangerous recommendations. MITIGATION: Start with 5 official docs only (PISTE/Légifrance APIs, BOFiP), version-track sources, refresh quarterly.
- **Scope creep:** "All French law" kills project. MITIGATION: V1 = SAS creation France + IR/IS year-1 only. 10-15 predefined questions scope. Expand after validation.
- **Over-confidence:** Users treat AI as oracle. MITIGATION: Mandatory disclaimer every response, flag high-stakes questions (>€5K decisions) for expert review.

## Roadmap
- **v0.1 (Phase 0 - 2h):** Notion checklist with 10 questions + Légifrance links. Test 1 week. If frustrating → GO v1.0.
- **v1.0 MVP (1-2 weeks):** RAG pipeline + 5 source docs + chat UI. Success = 10 test questions answered <30sec with citations.
- **v2.0:** Add MCP Légifrance live queries + EUR-Lex integration when case law needed.

## Success Criteria
- **Answer coverage:** 80% of common SAS creation questions answerable (10 predefined test set)
- **Response time:** <30sec with sources cited
- **ROI validation:** After 3 months, hours saved > build time invested

---

**Tone:** Internal tool pragmatism. Data quality > AI sophistication.
**Format:** Use as context for /speckit.constitution (adapt, don't copy).
