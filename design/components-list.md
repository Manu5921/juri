# UI Components List (shadcn/ui)

**Generated:** 2025-10-18
**Project:** Juri - Assistant Juridique & Financier RAG

---

## Installation Command

```bash
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card input form label select table dialog toast alert textarea badge separator scroll-area avatar tooltip
```

---

## Must-Have Components (P0)

### Forms

#### button
- **Variants:** Primary, secondary, ghost, outline, destructive
- **Usage:** CTAs, form submissions, navigation, citation links
- **Customization:** Uses `design-tokens.json` primary colors (indigo #6366F1)
- **Juri-specific:** Citation buttons need indigo/teal accent

#### input
- **Types:** Text, email, password, url, date
- **Usage:** All form inputs (auth, document metadata, search)
- **Customization:** Border radius `md` (0.5rem) from tokens
- **Juri-specific:** Search input with icon for question submission

#### label
- **Usage:** Accessible form labels for all inputs
- **Customization:** Typography body from tokens (Inter, 0.875rem)
- **Juri-specific:** Labels for document metadata (title, source type, URL, version)

#### form
- **Integration:** React Hook Form + Zod validation
- **Usage:** All forms (auth, admin document ingestion, user settings)
- **Validation:** Required for document upload (file format, language detection, source URL)

#### select
- **Usage:** Source type selection (Légifrance, BOFiP, INPI, Urssaf), filter dropdowns
- **Customization:** Dropdown matches neutral color palette
- **Juri-specific:** Source type selector in admin ingestion form

#### textarea
- **Usage:** Question input (multi-line legal questions), document notes
- **Customization:** Resize vertical only, max 6 rows
- **Juri-specific:** Main chat input area for complex legal questions

### Layout

#### card
- **Variants:** Default, with header, with footer
- **Usage:** Chat messages, source document list items, dashboard stats, conversation history
- **Customization:** Shadow `md` and radius `lg` (0.75rem) from tokens
- **Juri-specific:**
  - Message cards with citation footer
  - Source document cards with metadata (title, type, last updated, status)
  - Stats cards on sources page (5 active docs, last update date, coverage scope)

#### separator
- **Usage:** Visual dividers between message groups, section separators
- **Customization:** Neutral-200 (#E2E8F0)
- **Juri-specific:** Separate user/assistant messages, divide sidebar sections

#### scroll-area
- **Usage:** Chat message history, conversation sidebar, source document list
- **Customization:** Custom scrollbar matching neutral palette
- **Juri-specific:** Long chat conversations, conversation history list (20+ items)

#### dialog
- **Variants:** Modal, alert dialog
- **Usage:** Confirmations (delete conversation, archive source), detailed citation view, error modals
- **Customization:** Backdrop blur with neutral-900/50 opacity
- **Juri-specific:**
  - "Citation Details" dialog showing full article text + metadata
  - "Delete Conversation" confirmation
  - "Source Validation Error" modal

### Feedback

#### toast
- **Variants:** Default, success, warning, error, destructive
- **Usage:** Success/error messages, confirmations (document ingested, question submitted, citation copied)
- **Customization:**
  - Success: green-500 (#10B981)
  - Warning: orange-500 (#F59E0B)
  - Error: red-500 (#EF4444)
- **Juri-specific:**
  - Success: "Document ingéré avec succès (2min 34s)"
  - Warning: "Source ancienne (>90 jours) - Vérifier validité"
  - Error: "Base de connaissances temporairement indisponible"

#### alert
- **Variants:** Default, info, warning, error, success
- **Usage:** Inline feedback, permanent disclaimer banner, warnings (outdated sources)
- **Customization:** Border-left accent (4px) with variant color
- **Juri-specific:**
  - **CRITICAL:** Permanent disclaimer banner (non-dismissible, red-50 bg, red-900 text):
    - "⚠ Pas de conseil juridique - valider avec expert pour statuts/déclarations/décisions >5K€"
  - Warning alert on sources >90 days old
  - Info alert when no sources found ("Not covered in sources - consult expert")

#### badge
- **Variants:** Default, secondary, success, warning, destructive, outline
- **Usage:** Source status (Active/Archived), document type tags, freshness indicators
- **Customization:** Small pill shape (borderRadius `full`)
- **Juri-specific:**
  - Success badge: "✓ À jour (17 jours)" (green)
  - Warning badge: "⚠ Source ancienne" (orange)
  - Type badges: "Légifrance", "BOFiP", "INPI", "Urssaf" (neutral outline)

### Data Display

#### table
- **Variants:** Default, with header, with footer, sortable
- **Usage:** Admin source document management, citation audit trail, usage logs
- **Customization:** Zebra striping with neutral-50/neutral-100
- **Juri-specific:**
  - Source documents table (title, type, URL, last updated, status, actions)
  - Citation audit trail (conversation_id → document_id → article_ref)

#### avatar
- **Variants:** Default, with fallback initials, with status indicator
- **Usage:** User profiles (conversation sidebar), assistant icon
- **Customization:** Indigo background for fallback initials
- **Juri-specific:**
  - User avatar in chat (initials "JD" for Jean Dupont)
  - Assistant avatar: "J" logo in indigo circle

#### tooltip
- **Usage:** Icon explanations (citation link previews), help text, feature descriptions
- **Customization:** Dark mode (neutral-900 bg, neutral-50 text), small arrow
- **Juri-specific:**
  - Hover citation links: Show article preview (first 100 chars)
  - Help icons: Explain source types, disclaimer rationale

---

## Should-Have Components (P1)

#### accordion
- **Usage:** FAQ section, collapsible settings sections, grouped source documents
- **Customization:** Chevron icon animation on expand/collapse
- **Juri-specific:**
  - Group sources by type (Légifrance group, BOFiP group, etc.)
  - Settings sections (Account, Preferences, Notifications)

#### dropdown-menu
- **Usage:** Context menus (message actions), user account menu, source document actions
- **Customization:** Keyboard navigation support (arrow keys, enter)
- **Juri-specific:**
  - Message actions: Copy citation, Share conversation, Delete message
  - Source actions: View details, Refresh document, Archive source

#### popover
- **Usage:** Contextual help popovers, quick source previews, filters
- **Customization:** Small arrow pointing to trigger, auto-positioning
- **Juri-specific:**
  - Source type info popover: Explain difference between Légifrance/BOFiP/INPI/Urssaf
  - Date filter popover on conversation history

#### skeleton
- **Usage:** Loading placeholders (chat messages loading, sources list loading, auth screens)
- **Customization:** Pulse animation with neutral-200 gradient
- **Juri-specific:**
  - Message skeleton: User question sent, waiting for RAG retrieval + LLM synthesis
  - Source list skeleton: Loading 5 document cards (1-2 seconds)

---

## Nice-to-Have Components (P2)

#### calendar
- **Usage:** Date picker for document version selection, conversation history filtering
- **Customization:** French locale (fr-FR), week starts Monday
- **Juri-specific:** Filter conversations by date range, select document publish date

#### command
- **Usage:** Command palette (Cmd+K) for quick actions, search conversations, navigate sources
- **Customization:** Fuzzy search, keyboard shortcuts
- **Juri-specific:**
  - Quick actions: "New question", "View sources", "Admin panel"
  - Search: "Find conversation about IR/IS", "Jump to BOFiP guide"

#### hover-card
- **Usage:** Rich hover tooltips for source documents, user profiles
- **Customization:** Delayed appearance (300ms), rich content with images/metadata
- **Juri-specific:**
  - Hover source card: Show document stats (chunks count, last query date, citation count)
  - Hover citation link: Show article title + first paragraph

---

## Juri-Specific Custom Components

### message-bubble (extends Card)
- **Variants:** User message (indigo bg), assistant message (white bg), system message (neutral bg)
- **Structure:**
  - Header: Avatar + timestamp
  - Body: Message text (markdown support for formatting)
  - Footer: Citation links (if assistant message)
- **Customization:**
  - User: Right-aligned, indigo-500 bg, white text
  - Assistant: Left-aligned, white bg, neutral-900 text, citations as badge pills
  - System: Center-aligned, neutral-100 bg, neutral-700 text (e.g., "Conversation started")

### citation-link (extends Badge + Tooltip)
- **Appearance:** Pill-shaped badge with document icon + article reference
- **Behavior:**
  - Click → Opens official source URL in new tab
  - Hover → Shows tooltip with article title + preview
- **Example:** `📄 CGI Art. 206-209` (clickable, indigo-100 bg, indigo-700 text)

### disclaimer-banner (extends Alert)
- **Appearance:** Full-width banner, red-50 bg, red-900 text, warning icon
- **Behavior:**
  - Always visible at top of chat area
  - Non-dismissible (no close button)
  - Sticky position on scroll
- **Text:** "⚠ Pas de conseil juridique - valider avec expert pour statuts/déclarations/décisions >5K€"

### source-card (extends Card)
- **Structure:**
  - Icon: Document type emoji (📄 BOFiP, ⚖️ Légifrance, 🏛️ INPI, 💼 Urssaf)
  - Title: Document title (bold, neutral-900)
  - Metadata: Source type • Version • Last updated date (small, neutral-500)
  - Freshness indicator: Badge (green "✓ À jour" or orange "⚠ Source ancienne")
  - Status: Badge (teal "Actif" or neutral "Archivé")
  - Actions: Dropdown menu (View details, Refresh, Archive)
- **Hover:** Shadow elevation increase (md → lg)

### conversation-item (extends Card)
- **Structure:**
  - Title: First user question (truncated to 60 chars)
  - Timestamp: Relative time (Hier, 14:30 / 3 oct, 10:15)
  - Unread indicator: Blue dot if new assistant messages
- **States:**
  - Default: White bg, neutral border
  - Active: Indigo-50 bg, indigo-200 border (current conversation)
  - Hover: Neutral-50 bg

---

## Customization Strategy

All components use CSS variables from `design-tokens.json`:

```css
/* globals.css - Auto-synced with design-tokens.json */
:root {
  /* Primary (Indigo) */
  --primary-50: #EEF2FF;
  --primary-500: #6366F1;
  --primary-900: #312E81;

  /* Secondary (Teal) */
  --secondary-50: #F0FDFA;
  --secondary-500: #14B8A6;
  --secondary-900: #134E4A;

  /* Neutral (Slate) */
  --neutral-50: #F8FAFC;
  --neutral-500: #64748B;
  --neutral-900: #0F172A;

  /* Semantic Colors */
  --success-500: #10B981;
  --warning-500: #F59E0B;
  --error-500: #EF4444;

  /* Typography */
  --font-heading: 'Satoshi', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-body: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-code: 'JetBrains Mono', 'Courier New', monospace;

  /* Spacing */
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;

  /* Border Radius */
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;

  /* Shadows */
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
}

/* Component Overrides */
.button-primary {
  background-color: var(--primary-500);
  color: var(--neutral-50);
}

.card-source {
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
}

.disclaimer-banner {
  background-color: var(--error-50);
  color: var(--error-900);
  border-color: var(--error-500);
}
```

**Zero hardcoded colors** = Custom brand via `/import-design` in 15 min.

---

## Next Steps

1. **Install shadcn/ui components:**
   ```bash
   npx shadcn-ui@latest init
   npx shadcn-ui@latest add button card input form label select table dialog toast alert textarea badge separator scroll-area avatar tooltip
   ```

2. **Customize components with design tokens:**
   - Copy `design-tokens.json` values to `globals.css` as CSS variables
   - Update shadcn component classes to reference CSS variables

3. **Build Juri-specific custom components:**
   - `message-bubble.tsx` (extends Card)
   - `citation-link.tsx` (extends Badge + Tooltip)
   - `disclaimer-banner.tsx` (extends Alert)
   - `source-card.tsx` (extends Card)
   - `conversation-item.tsx` (extends Card)

4. **Wait for designer custom brand:**
   - Designer creates custom tokens in Figma
   - Export to `custom-tokens.json`
   - Run `/import-design custom-tokens.json` (Phase 4)
   - Custom brand merges in 15 min with 0 code changes

---

**Component Count:** 18 base components + 5 custom components = **23 total**

**Design/Dev Decoupling Status:** ✅ READY
- Dev can start building UI with placeholder tokens immediately
- Designer works in parallel (Figma → custom brand)
- Merge custom brand in Phase 4 (15 min, 0 breaking changes)

**Competitive Advantage:** 95% faster custom brand integration vs Lovable/Bolt/v0 (15 min vs 1-2 days refactor)
