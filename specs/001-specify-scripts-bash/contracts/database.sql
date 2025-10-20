-- Juri MVP - PostgreSQL + pgvector Database Schema
-- Generated: 2025-10-18
-- Purpose: Complete database migration for RAG legal assistant

-- ============================================================================
-- MIGRATION 001: Initial Schema
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- For BM25 similarity search

-- ----------------------------------------------------------------------------
-- Table: users
-- Purpose: Store authenticated PME founder users (synced with Supabase Auth)
-- ----------------------------------------------------------------------------
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  full_name text,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at timestamptz NOT NULL DEFAULT now(),
  last_active_at timestamptz,

  -- Constraints
  CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z]{2,}$')
);

COMMENT ON TABLE users IS 'Authenticated PME founder users with role-based access';
COMMENT ON COLUMN users.role IS 'User role: user (standard) or admin (can upload documents)';

-- ----------------------------------------------------------------------------
-- Table: documents
-- Purpose: Metadata for indexed legal source documents (5 curated docs for MVP)
-- ----------------------------------------------------------------------------
CREATE TABLE documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK (char_length(title) BETWEEN 3 AND 200),
  source_type text NOT NULL CHECK (source_type IN ('legifrance', 'bofip', 'inpi', 'urssaf')),
  source_url text NOT NULL,
  file_path text,  -- Supabase Storage path (if uploaded file)
  version text NOT NULL,
  last_updated date NOT NULL CHECK (last_updated <= CURRENT_DATE),
  upload_date timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  metadata jsonb,

  -- Constraints
  CONSTRAINT source_url_https CHECK (source_url LIKE 'https://%')
);

COMMENT ON TABLE documents IS 'Official French legal source documents (BOFiP, CGI, INPI, Légifrance, Urssaf)';
COMMENT ON COLUMN documents.source_type IS 'Official source: legifrance, bofip, inpi, urssaf';
COMMENT ON COLUMN documents.status IS 'active = indexed for RAG retrieval, archived = outdated/superseded';

-- ----------------------------------------------------------------------------
-- Table: embeddings
-- Purpose: Document chunks with vector embeddings for hybrid retrieval (pgvector)
-- ----------------------------------------------------------------------------
CREATE TABLE embeddings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  chunk_text text NOT NULL,
  chunk_index int NOT NULL CHECK (chunk_index >= 0),
  article_ref text,  -- Extracted article reference (e.g., "CGI Art. 206-209")
  page_number int CHECK (page_number > 0),
  metadata jsonb,

  -- Constraints
  CONSTRAINT chunk_text_length CHECK (char_length(chunk_text) BETWEEN 100 AND 5000)
);

COMMENT ON TABLE embeddings IS 'Document chunks with vector embeddings (500-1000 tokens each)';
COMMENT ON COLUMN embeddings.chunk_text IS 'Chunked French legal text (preserves article boundaries)';
COMMENT ON COLUMN embeddings.article_ref IS 'Extracted article ID for citation linking (e.g., "L227-1", "CGI Art. 206")';

-- ----------------------------------------------------------------------------
-- Table: conversations
-- Purpose: Chat sessions (grouping related messages between user and assistant)
-- ----------------------------------------------------------------------------
CREATE TABLE conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title text,  -- Auto-generated from first user question (truncated to 60 chars)
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),

  -- Constraints
  CONSTRAINT title_length CHECK (title IS NULL OR char_length(title) <= 60)
);

COMMENT ON TABLE conversations IS 'Chat sessions grouping user questions and assistant answers';
COMMENT ON COLUMN conversations.title IS 'Auto-generated from first user question (truncated to 60 chars)';

-- ----------------------------------------------------------------------------
-- Table: messages
-- Purpose: Individual messages (user questions + assistant answers) within conversations
-- ----------------------------------------------------------------------------
CREATE TABLE messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 10000),
  created_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb  -- Retrieved chunks count, LLM model, latency, token count
);

COMMENT ON TABLE messages IS 'Individual messages within conversations (user questions, assistant answers, system notices)';
COMMENT ON COLUMN messages.role IS 'Message sender: user (question), assistant (answer), system (notice)';
COMMENT ON COLUMN messages.metadata IS 'Optional: {chunks_count, llm_model, latency_ms, token_count}';

-- ----------------------------------------------------------------------------
-- Table: citations
-- Purpose: Citation audit trail (link messages to source document chunks)
-- ----------------------------------------------------------------------------
CREATE TABLE citations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  document_id uuid NOT NULL REFERENCES documents(id),
  embedding_id uuid REFERENCES embeddings(id),  -- Specific chunk cited (nullable)
  article_ref text NOT NULL,
  citation_url text NOT NULL CHECK (citation_url LIKE 'https://%'),
  citation_text text,  -- Extracted snippet from message (e.g., "Selon BOFiP §120...")
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE citations IS 'Citation audit trail linking messages to source documents for traceability';
COMMENT ON COLUMN citations.citation_url IS 'Clickable URL to official source (Légifrance, BOFiP, INPI, Urssaf)';

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Users indexes
CREATE INDEX idx_users_role ON users(role);

-- Documents indexes
CREATE INDEX idx_documents_source_type ON documents(source_type);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_documents_last_updated ON documents(last_updated);

-- Embeddings indexes
CREATE INDEX idx_embeddings_document_chunk ON embeddings(document_id, chunk_index);
CREATE INDEX idx_embeddings_article_ref ON embeddings(article_ref) WHERE article_ref IS NOT NULL;

-- Conversations indexes
CREATE INDEX idx_conversations_user_updated ON conversations(user_id, updated_at DESC);
CREATE INDEX idx_conversations_status ON conversations(status);

-- Messages indexes
CREATE INDEX idx_messages_conversation_created ON messages(conversation_id, created_at ASC);

-- Citations indexes
CREATE INDEX idx_citations_message ON citations(message_id);
CREATE INDEX idx_citations_document ON citations(document_id);

-- ============================================================================
-- MIGRATION 002: pgvector Setup
-- ============================================================================

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Add vector column to embeddings table
ALTER TABLE embeddings ADD COLUMN vector vector(1536);
ALTER TABLE embeddings ALTER COLUMN vector SET NOT NULL;

-- Create HNSW index for vector similarity search
-- Parameters: m=16 (connections per layer), ef_construction=64 (build-time accuracy)
CREATE INDEX embeddings_vector_idx ON embeddings
USING hnsw (vector vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

COMMENT ON INDEX embeddings_vector_idx IS 'HNSW index for cosine similarity search (m=16, ef_construction=64, expected <50ms for top-5 retrieval)';

-- Create GIN index for BM25 full-text search (French language)
CREATE INDEX embeddings_fts_idx ON embeddings
USING gin (to_tsvector('french', chunk_text));

COMMENT ON INDEX embeddings_fts_idx IS 'GIN index for BM25 keyword search with French stop words and Snowball stemmer';

-- ============================================================================
-- MIGRATION 003: Row-Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE citations ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- RLS Policies: users
-- ----------------------------------------------------------------------------

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (id = auth.uid());

-- Admins can view all users
CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ----------------------------------------------------------------------------
-- RLS Policies: documents
-- ----------------------------------------------------------------------------

-- All authenticated users can view documents
CREATE POLICY "Authenticated users can view documents"
  ON documents FOR SELECT
  USING (auth.role() = 'authenticated');

-- Only admins can manage documents (insert, update, delete)
CREATE POLICY "Admins can manage documents"
  ON documents FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ----------------------------------------------------------------------------
-- RLS Policies: embeddings
-- ----------------------------------------------------------------------------

-- All authenticated users can view embeddings (RAG retrieval)
CREATE POLICY "Authenticated users can view embeddings"
  ON embeddings FOR SELECT
  USING (auth.role() = 'authenticated');

-- Only admins can manage embeddings (insert, update, delete)
CREATE POLICY "Admins can manage embeddings"
  ON embeddings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ----------------------------------------------------------------------------
-- RLS Policies: conversations
-- ----------------------------------------------------------------------------

-- Users can manage their own conversations
CREATE POLICY "Users can manage own conversations"
  ON conversations FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Admins can view all conversations (audit trail)
CREATE POLICY "Admins can view all conversations"
  ON conversations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ----------------------------------------------------------------------------
-- RLS Policies: messages
-- ----------------------------------------------------------------------------

-- Users can view and insert messages in their own conversations
CREATE POLICY "Users can view messages in own conversations"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE id = messages.conversation_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert messages in own conversations"
  ON messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE id = conversation_id AND user_id = auth.uid()
    )
  );

-- ----------------------------------------------------------------------------
-- RLS Policies: citations
-- ----------------------------------------------------------------------------

-- Users can view citations for their own messages
CREATE POLICY "Users can view citations in own messages"
  ON citations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM messages m
      JOIN conversations c ON m.conversation_id = c.id
      WHERE m.id = citations.message_id AND c.user_id = auth.uid()
    )
  );

-- System can insert citations (via service role key, bypasses RLS)
-- No explicit policy needed - service role key has superuser privileges

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function: Update conversation.updated_at timestamp on new message
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET updated_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Update conversation timestamp on message insert
CREATE TRIGGER trigger_update_conversation_timestamp
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_timestamp();

-- Function: Auto-generate conversation title from first user message
CREATE OR REPLACE FUNCTION auto_generate_conversation_title()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'user' THEN
    UPDATE conversations
    SET title = LEFT(NEW.content, 60)
    WHERE id = NEW.conversation_id AND title IS NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-generate title on first user message
CREATE TRIGGER trigger_auto_generate_conversation_title
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_conversation_title();

-- ============================================================================
-- SEED DATA (MVP - 5 official documents metadata)
-- ============================================================================

-- Insert 5 official French documents (embeddings added later via admin ingestion)
INSERT INTO documents (title, source_type, source_url, version, last_updated, status) VALUES
  (
    'BOFiP - Guide de Création SAS 2024',
    'bofip',
    'https://bofip.impots.gouv.fr/bofip/12345-PGP.html',
    '2024-Q3',
    '2024-09-15',
    'active'
  ),
  (
    'Code Général des Impôts (Articles 206-209)',
    'legifrance',
    'https://www.legifrance.gouv.fr/codes/section_lc/LEGITEXT000006069577/LEGISCTA000006162552/',
    '2024-09-01',
    '2024-10-01',
    'active'
  ),
  (
    'INPI - Modèles de Statuts SAS',
    'inpi',
    'https://www.inpi.fr/fr/services-et-prestations/formulaires-et-modeles-actes/modele-statuts-sas',
    '2024-01-15',
    '2024-01-15',
    'active'
  ),
  (
    'Légifrance - Articles L227-1 à L227-20 (SAS)',
    'legifrance',
    'https://www.legifrance.gouv.fr/codes/section_lc/LEGITEXT000005634379/LEGISCTA000006161260/',
    '2024-09-15',
    '2024-10-10',
    'active'
  ),
  (
    'Urssaf - Déclarations Année 1 (SAS)',
    'urssaf',
    'https://www.urssaf.fr/portail/home/employeur/creer/choisir-une-forme-juridique/la-societe-par-actions-simplifi.html',
    '2024-Q2',
    '2024-07-01',
    'active'
  );

-- ============================================================================
-- PERFORMANCE TUNING (PostgreSQL configuration recommendations)
-- ============================================================================

-- Recommended PostgreSQL settings for pgvector performance:
-- shared_buffers = 256MB (or 25% of RAM)
-- effective_cache_size = 1GB (or 50% of RAM)
-- maintenance_work_mem = 64MB (for HNSW index building)
-- work_mem = 16MB (for query execution)
-- max_parallel_workers_per_gather = 2 (for parallel index scans)

-- Supabase Cloud free tier defaults are sufficient for MVP (<1000 chunks)

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify pgvector extension is enabled
SELECT * FROM pg_extension WHERE extname = 'vector';

-- Verify HNSW index was created
SELECT indexname, tablename, indexdef
FROM pg_indexes
WHERE tablename = 'embeddings' AND indexname = 'embeddings_vector_idx';

-- Verify RLS is enabled on all tables
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND tablename IN ('users', 'documents', 'embeddings', 'conversations', 'messages', 'citations');

-- Count seed documents
SELECT source_type, COUNT(*) as count
FROM documents
WHERE status = 'active'
GROUP BY source_type;

-- Expected output:
-- | source_type  | count |
-- |-------------|-------|
-- | bofip       | 1     |
-- | legifrance  | 2     |
-- | inpi        | 1     |
-- | urssaf      | 1     |
