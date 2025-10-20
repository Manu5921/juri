# Data Model: Juri MVP - RAG Legal Assistant

**Date**: 2025-10-18
**Project**: Juri MVP
**Database**: PostgreSQL 15 + pgvector 0.5+ (Supabase Cloud)

---

## Entity Relationship Diagram

```
┌─────────────┐
│   users     │
└──────┬──────┘
       │
       │ 1:N
       │
┌──────▼──────────┐         ┌──────────────┐
│ conversations   │────────▶│  messages    │
└─────────────────┘    1:N  └──────┬───────┘
                                   │
                                   │ 1:N
                                   │
                             ┌─────▼──────┐
                             │  citations │
                             └─────┬──────┘
                                   │
                                   │ N:1
                                   │
┌─────────────┐              ┌─────▼──────┐
│  documents  │─────────────▶│ embeddings │
└─────────────┘         1:N  └────────────┘
```

---

## Entities

### 1. users

**Purpose**: Store authenticated PME founder users (session-based auth via Supabase Auth)

**Attributes**:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PRIMARY KEY, DEFAULT `gen_random_uuid()` | Unique user identifier (Supabase Auth UID) |
| `email` | `text` | UNIQUE, NOT NULL | User email (validated by Supabase Auth) |
| `full_name` | `text` | NULL | User full name (optional) |
| `role` | `text` | NOT NULL, DEFAULT 'user', CHECK IN ('user', 'admin') | User role (admin can upload documents) |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT `now()` | Account creation timestamp |
| `last_active_at` | `timestamptz` | NULL | Last login or query timestamp |

**Indexes**:
- PRIMARY KEY on `id`
- UNIQUE on `email`
- INDEX on `role` (for admin queries)

**Row-Level Security (RLS)**:
- Users can SELECT their own row (`id = auth.uid()`)
- Admins can SELECT all users (`role = 'admin'`)
- INSERT/UPDATE/DELETE handled by Supabase Auth triggers

---

### 2. documents

**Purpose**: Store metadata for indexed legal source documents (5 curated docs for MVP)

**Attributes**:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PRIMARY KEY, DEFAULT `gen_random_uuid()` | Unique document identifier |
| `title` | `text` | NOT NULL | Document title (e.g., "BOFiP - Guide Création SAS 2024") |
| `source_type` | `text` | NOT NULL, CHECK IN ('legifrance', 'bofip', 'inpi', 'urssaf') | Official source type |
| `source_url` | `text` | NOT NULL | Official URL to source document (e.g., legifrance.gouv.fr/...) |
| `file_path` | `text` | NULL | Supabase Storage file path (if uploaded PDF/HTML) |
| `version` | `text` | NOT NULL | Version identifier (e.g., "2024-Q3", "2024-09-15") |
| `last_updated` | `date` | NOT NULL | Date of last official update (from source) |
| `upload_date` | `timestamptz` | NOT NULL, DEFAULT `now()` | Date document was ingested into system |
| `status` | `text` | NOT NULL, DEFAULT 'active', CHECK IN ('active', 'archived') | Document status (archived if superseded) |
| `metadata` | `jsonb` | NULL | Additional metadata (page count, author, article range, etc.) |

**Indexes**:
- PRIMARY KEY on `id`
- INDEX on `source_type` (filter by source)
- INDEX on `status` (active documents only)
- INDEX on `last_updated` (freshness warnings)

**Row-Level Security (RLS)**:
- All authenticated users can SELECT (read-only access to sources list)
- Only admins can INSERT/UPDATE/DELETE (`role = 'admin'`)

---

### 3. embeddings

**Purpose**: Store document chunks with vector embeddings for hybrid retrieval (pgvector)

**Attributes**:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PRIMARY KEY, DEFAULT `gen_random_uuid()` | Unique embedding identifier |
| `document_id` | `uuid` | FOREIGN KEY → `documents(id)`, NOT NULL, ON DELETE CASCADE | Parent document reference |
| `chunk_text` | `text` | NOT NULL | Chunked text (500-1000 tokens, French legal content) |
| `chunk_index` | `int` | NOT NULL | Chunk position in document (0-indexed) |
| `vector` | `vector(1536)` | NOT NULL | OpenAI text-embedding-3-small embedding (1536 dimensions) |
| `article_ref` | `text` | NULL | Extracted article reference (e.g., "CGI Art. 206-209", "L227-1") |
| `page_number` | `int` | NULL | Page number in original document (if PDF) |
| `metadata` | `jsonb` | NULL | Additional metadata (token count, article title, section heading) |

**Indexes**:
- PRIMARY KEY on `id`
- FOREIGN KEY on `document_id` → `documents(id)` ON DELETE CASCADE
- **HNSW index on `vector`**: `CREATE INDEX ON embeddings USING hnsw (vector vector_cosine_ops) WITH (m = 16, ef_construction = 64);`
- INDEX on `document_id, chunk_index` (sequential chunk retrieval)
- INDEX on `article_ref` (citation linking)

**Row-Level Security (RLS)**:
- All authenticated users can SELECT (RAG retrieval)
- Only admins can INSERT/UPDATE/DELETE (document ingestion)

**Performance Notes**:
- HNSW index parameters: `m=16` (connections per layer), `ef_construction=64` (build-time accuracy), `ef_search=100` (query-time accuracy)
- Expected retrieval latency: <50ms for top-5 similarity search (500-1000 chunks)
- Index size: ~6MB (1536 dims × 4 bytes × 1000 chunks)

---

### 4. conversations

**Purpose**: Store chat sessions (grouping related messages between user and assistant)

**Attributes**:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PRIMARY KEY, DEFAULT `gen_random_uuid()` | Unique conversation identifier |
| `user_id` | `uuid` | FOREIGN KEY → `users(id)`, NOT NULL, ON DELETE CASCADE | Owner of conversation |
| `title` | `text` | NULL | Auto-generated title (first user question, truncated to 60 chars) |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT `now()` | Conversation start timestamp |
| `updated_at` | `timestamptz` | NOT NULL, DEFAULT `now()` | Last message timestamp |
| `status` | `text` | NOT NULL, DEFAULT 'active', CHECK IN ('active', 'archived') | Conversation status |

**Indexes**:
- PRIMARY KEY on `id`
- FOREIGN KEY on `user_id` → `users(id)` ON DELETE CASCADE
- INDEX on `user_id, updated_at DESC` (user's recent conversations)
- INDEX on `status` (active vs archived filter)

**Row-Level Security (RLS)**:
- Users can SELECT/INSERT/UPDATE/DELETE their own conversations (`user_id = auth.uid()`)
- Admins can SELECT all conversations (audit trail)

---

### 5. messages

**Purpose**: Store individual messages (user questions + assistant answers) within conversations

**Attributes**:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PRIMARY KEY, DEFAULT `gen_random_uuid()` | Unique message identifier |
| `conversation_id` | `uuid` | FOREIGN KEY → `conversations(id)`, NOT NULL, ON DELETE CASCADE | Parent conversation |
| `role` | `text` | NOT NULL, CHECK IN ('user', 'assistant', 'system') | Message sender (user question, assistant answer, system notice) |
| `content` | `text` | NOT NULL | Message text content (Markdown supported) |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT `now()` | Message timestamp |
| `metadata` | `jsonb` | NULL | Additional metadata (retrieved chunks count, LLM model used, latency, token count) |

**Indexes**:
- PRIMARY KEY on `id`
- FOREIGN KEY on `conversation_id` → `conversations(id)` ON DELETE CASCADE
- INDEX on `conversation_id, created_at ASC` (chronological message order)

**Row-Level Security (RLS)**:
- Users can SELECT/INSERT messages in their own conversations (via `conversation_id → user_id = auth.uid()`)
- No UPDATE/DELETE (immutable message history)

---

### 6. citations

**Purpose**: Store citation audit trail (link messages to source document chunks for traceability)

**Attributes**:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PRIMARY KEY, DEFAULT `gen_random_uuid()` | Unique citation identifier |
| `message_id` | `uuid` | FOREIGN KEY → `messages(id)`, NOT NULL, ON DELETE CASCADE | Assistant message containing citation |
| `document_id` | `uuid` | FOREIGN KEY → `documents(id)`, NOT NULL | Cited document |
| `embedding_id` | `uuid` | FOREIGN KEY → `embeddings(id)`, NULL | Specific chunk cited (if available) |
| `article_ref` | `text` | NOT NULL | Article reference (e.g., "CGI Art. 206-209") |
| `citation_url` | `text` | NOT NULL | Clickable URL to official source (Légifrance, BOFiP, INPI, Urssaf) |
| `citation_text` | `text` | NULL | Extracted citation snippet from message (e.g., "Selon BOFiP §120...") |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT `now()` | Citation creation timestamp |

**Indexes**:
- PRIMARY KEY on `id`
- FOREIGN KEY on `message_id` → `messages(id)` ON DELETE CASCADE
- FOREIGN KEY on `document_id` → `documents(id)`
- FOREIGN KEY on `embedding_id` → `embeddings(id)` (nullable)
- INDEX on `message_id` (retrieve all citations for a message)
- INDEX on `document_id` (citation frequency analytics)

**Row-Level Security (RLS)**:
- Users can SELECT citations for their own messages (via `message_id → conversation_id → user_id = auth.uid()`)
- Only system can INSERT (automated during RAG synthesis)
- No UPDATE/DELETE (immutable audit trail)

---

## State Transitions

### Document Lifecycle

```
[Uploaded by admin] → active → [Manual archive or superseded by new version] → archived
```

**Triggers**:
- `active`: Default status when document is ingested and embeddings generated
- `archived`: Admin action when document is outdated or replaced (prevents retrieval in RAG queries)

### Conversation Lifecycle

```
[User starts chat] → active → [User archives conversation] → archived
```

**Triggers**:
- `active`: Default status when first message is sent
- `archived`: User action to clean up conversation history (soft delete, can be restored)

---

## Validation Rules

### Document Upload (Admin Only)

| Field | Validation | Error Message |
|-------|------------|---------------|
| `title` | NOT NULL, length 3-200 chars | "Title required (3-200 characters)" |
| `source_type` | IN ('legifrance', 'bofip', 'inpi', 'urssaf') | "Invalid source type" |
| `source_url` | Valid URL, HTTPS only | "Invalid official source URL (HTTPS required)" |
| `version` | NOT NULL, format 'YYYY-QX' or 'YYYY-MM-DD' | "Version required (format: 2024-Q3 or 2024-09-15)" |
| `last_updated` | Valid date, not in future | "Last updated date invalid or in future" |
| File upload | PDF or HTML, max 50MB, French language | "Invalid file format (PDF/HTML only, max 50MB, French text)" |

### Message Submission (User)

| Field | Validation | Error Message |
|-------|------------|---------------|
| `content` | NOT NULL, length 10-5000 chars | "Question required (10-5000 characters)" |
| `content` | French language detected | "Questions en français uniquement" |
| Rate limit | Max 10 questions/hour per user | "Limite de questions atteinte (10/heure max)" |

---

## Performance Optimization

### pgvector Hybrid Search Query

**Retrieve top-5 chunks with 70% vector similarity + 30% BM25 keyword**:

```sql
-- Set search parameters (query-time accuracy)
SET LOCAL ivfflat.probes = 10;

WITH vector_search AS (
  SELECT
    e.id,
    e.chunk_text,
    e.article_ref,
    e.document_id,
    (1 - (e.vector <=> $1::vector)) AS similarity_score
  FROM embeddings e
  JOIN documents d ON e.document_id = d.id
  WHERE d.status = 'active'
  ORDER BY e.vector <=> $1::vector  -- Cosine distance (operator <=>)
  LIMIT 10
),
bm25_search AS (
  SELECT
    e.id,
    e.chunk_text,
    e.article_ref,
    e.document_id,
    ts_rank_cd(to_tsvector('french', e.chunk_text), plainto_tsquery('french', $2)) AS bm25_score
  FROM embeddings e
  JOIN documents d ON e.document_id = d.id
  WHERE
    d.status = 'active'
    AND to_tsvector('french', e.chunk_text) @@ plainto_tsquery('french', $2)
  ORDER BY bm25_score DESC
  LIMIT 10
)
SELECT
  COALESCE(v.id, b.id) AS id,
  COALESCE(v.chunk_text, b.chunk_text) AS chunk_text,
  COALESCE(v.article_ref, b.article_ref) AS article_ref,
  COALESCE(v.document_id, b.document_id) AS document_id,
  (COALESCE(v.similarity_score, 0) * 0.7 + COALESCE(b.bm25_score, 0) * 0.3) AS hybrid_score
FROM vector_search v
FULL OUTER JOIN bm25_search b ON v.id = b.id
ORDER BY hybrid_score DESC
LIMIT 5;
```

**Parameters**:
- `$1`: Query embedding vector (1536 dimensions, from OpenAI text-embedding-3-small)
- `$2`: User question text (for BM25 keyword search)

**Expected Performance**:
- Vector search: <30ms (HNSW index with ef_search=100)
- BM25 search: <20ms (GIN index on `to_tsvector('french', chunk_text)`)
- Total retrieval: <50ms

---

## Row-Level Security (RLS) Policies

### users

```sql
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
```

### documents

```sql
-- All authenticated users can view active documents
CREATE POLICY "Authenticated users can view documents"
  ON documents FOR SELECT
  USING (auth.role() = 'authenticated');

-- Only admins can insert/update/delete documents
CREATE POLICY "Admins can manage documents"
  ON documents FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

### embeddings

```sql
-- All authenticated users can view embeddings (RAG retrieval)
CREATE POLICY "Authenticated users can view embeddings"
  ON embeddings FOR SELECT
  USING (auth.role() = 'authenticated');

-- Only admins can insert/update/delete embeddings
CREATE POLICY "Admins can manage embeddings"
  ON embeddings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

### conversations

```sql
-- Users can manage their own conversations
CREATE POLICY "Users can manage own conversations"
  ON conversations FOR ALL
  USING (user_id = auth.uid());

-- Admins can view all conversations (audit trail)
CREATE POLICY "Admins can view all conversations"
  ON conversations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

### messages

```sql
-- Users can view/insert messages in their own conversations
CREATE POLICY "Users can manage messages in own conversations"
  ON messages FOR SELECT, INSERT
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE id = messages.conversation_id AND user_id = auth.uid()
    )
  );
```

### citations

```sql
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
```

---

## Migration Strategy

### Phase 1: Initial Schema (MVP)

**File**: `supabase/migrations/001_initial_schema.sql`

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table (synced with Supabase Auth)
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  full_name text,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at timestamptz NOT NULL DEFAULT now(),
  last_active_at timestamptz
);

-- Create documents table
CREATE TABLE documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  source_type text NOT NULL CHECK (source_type IN ('legifrance', 'bofip', 'inpi', 'urssaf')),
  source_url text NOT NULL,
  file_path text,
  version text NOT NULL,
  last_updated date NOT NULL,
  upload_date timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  metadata jsonb
);

-- Create embeddings table (pgvector added in next migration)
CREATE TABLE embeddings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  chunk_text text NOT NULL,
  chunk_index int NOT NULL,
  article_ref text,
  page_number int,
  metadata jsonb
);

-- Create conversations table
CREATE TABLE conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived'))
);

-- Create messages table
CREATE TABLE messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb
);

-- Create citations table
CREATE TABLE citations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  document_id uuid NOT NULL REFERENCES documents(id),
  embedding_id uuid REFERENCES embeddings(id),
  article_ref text NOT NULL,
  citation_url text NOT NULL,
  citation_text text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_documents_source_type ON documents(source_type);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_documents_last_updated ON documents(last_updated);
CREATE INDEX idx_embeddings_document_chunk ON embeddings(document_id, chunk_index);
CREATE INDEX idx_embeddings_article_ref ON embeddings(article_ref);
CREATE INDEX idx_conversations_user_updated ON conversations(user_id, updated_at DESC);
CREATE INDEX idx_conversations_status ON conversations(status);
CREATE INDEX idx_messages_conversation_created ON messages(conversation_id, created_at ASC);
CREATE INDEX idx_citations_message ON citations(message_id);
CREATE INDEX idx_citations_document ON citations(document_id);
```

### Phase 2: pgvector Setup

**File**: `supabase/migrations/002_pgvector_setup.sql`

```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Add vector column to embeddings table
ALTER TABLE embeddings ADD COLUMN vector vector(1536);
ALTER TABLE embeddings ALTER COLUMN vector SET NOT NULL;

-- Create HNSW index (m=16, ef_construction=64)
CREATE INDEX embeddings_vector_idx ON embeddings
USING hnsw (vector vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Create GIN index for BM25 full-text search (French)
CREATE INDEX embeddings_fts_idx ON embeddings
USING gin (to_tsvector('french', chunk_text));
```

### Phase 3: Row-Level Security

**File**: `supabase/migrations/003_rls_policies.sql`

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE citations ENABLE ROW LEVEL SECURITY;

-- [RLS policies defined in section above]
```

---

## Summary

**Total Tables**: 6 (users, documents, embeddings, conversations, messages, citations)

**Total Indexes**: 14 standard + 2 specialized (HNSW vector, GIN full-text)

**RLS Policies**: 11 policies (user isolation, admin privileges, audit trail)

**Estimated Storage** (MVP with 5 documents, 1000 chunks, 100 conversations):
- Documents: ~5KB (5 rows × 1KB metadata)
- Embeddings: ~6.5MB (1000 rows × 6.5KB per row = 1536 dims × 4 bytes + text)
- Conversations: ~50KB (100 rows × 500 bytes)
- Messages: ~200KB (200 rows × 1KB per message)
- Citations: ~100KB (500 rows × 200 bytes per citation)
- **Total**: ~7MB (well within Supabase free tier 500MB limit)

**Next Steps**:
- Generate `contracts/database.sql` with complete migration scripts
- Generate `contracts/openapi.yaml` with API endpoint specifications
- Generate `quickstart.md` with local Supabase setup instructions
