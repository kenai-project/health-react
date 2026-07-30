# AI Health Assistant Expansion — Architecture & Design

> **Status**: Design Document (Pre-Implementation)  
> **Date**: 2026-07-30  
> **Scope**: Voice, Documents, Vision, Health Features, Knowledge modules

---

## Table of Contents

1. [Overall Architecture Diagram](#1-overall-architecture-diagram)
2. [Folder Structure](#2-folder-structure)
3. [Database Schema Changes](#3-database-schema-changes)
4. [Backend API Design](#4-backend-api-design)
5. [Frontend Component Structure](#5-frontend-component-structure)
6. [Recommended Ollama Models](#6-recommended-ollama-models)
7. [Implementation Roadmap](#7-implementation-roadmap)
8. [Risk Analysis & Complexity](#8-risk-analysis--complexity)

---

## 1. Overall Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            CLIENT (React + Vite)                            │
│                                                                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐  │
│  │ Voice    │ │ Document │ │ Vision   │ │ Health   │ │ Knowledge        │  │
│  │ Module   │ │ Module   │ │ Module   │ │ Features │ │ Module           │  │
│  │          │ │          │ │          │ │ Module   │ │                  │  │
│  │ - STT UI │ │ - PDF    │ │ - Image  │ │ - Dash-  │ │ - Chat History   │  │
│  │ - TTS UI │ │   Viewer │ │   Upload │ │   board  │ │ - Search         │  │
│  │ - Wake   │ │ - Doc    │ │ - Camera │ │ - Trends │ │ - Multi-lang     │  │
│  │   Word   │ │   Viewer │ │ - OCR    │ │ - Remind │ │ - Profile Memory │  │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └────────┬─────────┘  │
│       │            │            │            │                │            │
│       └────────────┴────────────┴────────────┴────────────────┘            │
│                              │                                             │
│                    ┌─────────▼──────────┐                                  │
│                    │  Shared Services   │                                  │
│                    │  (api.js, Auth,    │                                  │
│                    │   WebSocket)       │                                  │
│                    └─────────┬──────────┘                                  │
└──────────────────────────────┼─────────────────────────────────────────────┘
                               │ HTTP / WebSocket
                               │
┌──────────────────────────────▼─────────────────────────────────────────────┐
│                          FASTAPI BACKEND                                    │
│                                                                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐  │
│  │ Voice    │ │ Document │ │ Vision   │ │ Health   │ │ Knowledge        │  │
│  │ Router   │ │ Router   │ │ Router   │ │ Features │ │ Router           │  │
│  │          │ │          │ │          │ │ Router   │ │                  │  │
│  │ /voice   │ │ /docs    │ │ /vision  │ │ /health  │ │ /knowledge       │  │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └────────┬─────────┘  │
│       │            │            │            │                │            │
│  ┌────▼────┐  ┌────▼────┐ ┌────▼────┐ ┌────▼────┐ ┌─────────▼─────────┐  │
│  │ Voice   │  │ Document│ │ Vision  │ │ Health  │ │ Knowledge         │  │
│  │ Service │  │ Service │ │ Service │ │ Service │ │ Service           │  │
│  │         │  │         │ │         │ │         │ │                   │  │
│  │ - STT   │  │ - PDF   │ │ - Image │ │ - Trend │ │ - Embeddings      │  │
│  │ - TTS   │  │   Parse │ │   Analy │ │ - Remin │ │ - Vector Search   │  │
│  │ - Wake  │  │ - OCR   │ │ - OCR   │ │ - Summa │ │ - Chat History    │  │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └────────┬─────────┘  │
│       │            │            │            │                │            │
│       └────────────┴────────────┴────────────┴────────────────┘            │
│                              │                                             │
│                    ┌─────────▼──────────┐                                  │
│                    │   Core Services    │                                  │
│                    │  (LLM, Auth, DB)   │                                  │
│                    └─────────┬──────────┘                                  │
└──────────────────────────────┼─────────────────────────────────────────────┘
                               │
          ┌────────────────────┼────────────────────┐
          │                    │                    │
          ▼                    ▼                    ▼
   ┌────────────┐     ┌──────────────┐     ┌──────────────┐
   │ PostgreSQL │     │   Ollama     │     │  File Store  │
   │  (SQLite)  │     │              │     │  (local fs)  │
   │            │     │ - Chat Model │     │              │
   │ - Users    │     │ - Vision     │     │ - Uploads/   │
   │ - Records  │     │   Model      │     │ - Documents/ │
   │ - Chats    │     │ - Embedding  │     │ - Images/    │
   │ - Docs     │     │   Model      │     │ - Exports/   │
   │ - Vectors  │     │ - STT Model  │     │              │
   │ - Remind   │     │   (whisper)  │     │              │
   └────────────┘     └──────────────┘     └──────────────┘
```

### Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Vector Store** | ChromaDB (embedded, no separate server) | Local-first, Python-native, minimal deps, persists to disk |
| **Embeddings** | Ollama embedding models (nomic-embed-text) | Keeps everything in Ollama, no extra Python packages |
| **STT/TTS** | Web Speech API (browser-native) + Ollama Whisper fallback | Zero deps for basic voice; Whisper for accuracy |
| **OCR** | PaddleOCR (free) or Tesseract via pytesseract | Both are free, local, no API keys |
| **File Storage** | Local filesystem with path hashing | Simple, private, no S3 dependency |
| **Reminders** | APScheduler (in-process) | No Redis/celery needed for simple scheduling |
| **WebSocket** | FastAPI WebSocket for real-time chat/voice | Already in FastAPI, no extra deps |
| **Multi-language** | Ollama handles this natively | No translation API needed |

---

## 2. Folder Structure

### Backend Additions

```
backend/
├── api/
│   ├── routes/
│   │   ├── voice.py              # NEW: STT/TTS endpoints
│   │   ├── documents.py          # NEW: Upload/analyze documents
│   │   ├── vision.py             # NEW: Image upload & analysis
│   │   ├── health_features.py    # NEW: Dashboard, trends, reminders
│   │   └── knowledge.py          # NEW: Chat history, search, memory
│   └── websocket/
│       └── chat.py               # NEW: WebSocket for real-time chat
│
├── services/
│   ├── voice_service.py          # NEW: STT (Whisper), TTS (gTTS/piper)
│   ├── document_service.py       # NEW: PDF/DOCX/XLSX parsing
│   ├── vision_service.py         # NEW: Image analysis via Ollama vision
│   ├── ocr_service.py            # NEW: OCR (PaddleOCR/Tesseract)
│   ├── health_features_service.py# NEW: Trends, summaries, reminders
│   ├── knowledge_service.py      # NEW: Embeddings, vector search, history
│   ├── rag_service.py            # NEW: RAG pipeline (retrieve + augment)
│   └── reminder_service.py       # NEW: APScheduler-based reminders
│
├── db/
│   ├── models.py                 # MODIFIED: Add new tables
│   └── migrate.py                # MODIFIED: Auto-create new tables
│
├── storage/                      # NEW: File storage directory
│   ├── uploads/
│   │   ├── documents/
│   │   ├── images/
│   │   └── audio/
│   └── exports/
│
├── vector_store/                 # NEW: ChromaDB persistence
│   └── chroma_db/
│
└── requirements.txt              # MODIFIED: Add new dependencies
```

### Frontend Additions

```
frontend/src/
├── features/
│   ├── voice/                    # NEW: Voice conversation module
│   │   ├── components/
│   │   │   ├── VoiceButton.jsx       # Mic button with recording state
│   │   │   ├── VoiceWaveform.jsx     # Audio visualization
│   │   │   └── WakeWordToggle.jsx    # Wake word enable/disable
│   │   └── hooks/
│   │       └── useSpeechRecognition.js  # Web Speech API hook
│   │
│   ├── documents/                # NEW: Document upload & analysis
│   │   ├── components/
│   │   │   ├── DocumentUploader.jsx   # Drag & drop upload
│   │   │   ├── DocumentViewer.jsx     # PDF/DOCX preview
│   │   │   ├── DocumentList.jsx       # List of uploaded docs
│   │   │   └── AnalysisResult.jsx     # AI analysis display
│   │   └── pages/
│   │       └── DocumentsPage.jsx
│   │
│   ├── vision/                   # NEW: Image & camera module
│   │   ├── components/
│   │   │   ├── ImageUploader.jsx      # Upload or drag image
│   │   │   ├── CameraCapture.jsx      # Camera capture UI
│   │   │   ├── ImagePreview.jsx       # Preview with annotations
│   │   │   └── VisionAnalysis.jsx     # AI vision results
│   │   └── pages/
│   │       └── VisionPage.jsx
│   │
│   ├── health-features/          # NEW: AI health dashboard
│   │   ├── components/
│   │   │   ├── HealthDashboard.jsx    # AI-powered dashboard
│   │   │   ├── TrendChart.jsx         # Health trend visualization
│   │   │   ├── DailySummary.jsx       # AI daily summary
│   │   │   ├── ReminderList.jsx       # Medication/appointment list
│   │   │   └── ReminderForm.jsx       # Create reminder
│   │   └── pages/
│   │       └── HealthFeaturesPage.jsx
│   │
│   └── knowledge/                # NEW: Knowledge & memory module
│       ├── components/
│       │   ├── ChatHistory.jsx        # Browse past conversations
│       │   ├── SearchConversations.jsx # Search through history
│       │   ├── LanguageSelector.jsx   # Multi-language picker
│       │   └── ProfileMemory.jsx      # What AI remembers about user
│       └── pages/
│           └── KnowledgePage.jsx
│
├── app/
│   ├── routes.jsx                # MODIFIED: Add new routes
│   ├── components/
│   │   └── Sidebar.jsx           # MODIFIED: Add new nav items
│   └── services/
│       └── api.js                # MODIFIED: Add new API methods
│
└── styles/
    └── index.css                 # MODIFIED: Voice/recording styles
```

---

## 3. Database Schema Changes

### New Tables

```sql
-- ============================================================
-- 1. Conversation Memory (long-term chat history)
-- ============================================================
CREATE TABLE conversations (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title           VARCHAR(200),           -- Auto-generated summary
    language        VARCHAR(10) DEFAULT 'en',
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_conversations_user ON conversations(user_id);

CREATE TABLE conversation_messages (
    id              SERIAL PRIMARY KEY,
    conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    role            VARCHAR(20) NOT NULL,   -- 'user', 'assistant', 'system'
    content         TEXT NOT NULL,
    metadata        JSONB,                  -- {source: "voice|text|vision", language: "en", ...}
    embedding_id    VARCHAR(100),           -- Reference to vector store ID
    created_at      TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_messages_conversation ON conversation_messages(conversation_id);
CREATE INDEX idx_messages_created ON conversation_messages(created_at);

-- ============================================================
-- 2. Documents (uploaded files)
-- ============================================================
CREATE TABLE documents (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    filename        VARCHAR(500) NOT NULL,
    original_name   VARCHAR(500) NOT NULL,
    file_type       VARCHAR(50) NOT NULL,   -- 'pdf', 'docx', 'xlsx', 'csv', 'txt'
    file_size       BIGINT,
    storage_path    VARCHAR(1000) NOT NULL, -- Local filesystem path
    content_text    TEXT,                   -- Extracted text content
    summary         TEXT,                   -- AI-generated summary
    metadata        JSONB,                  -- {pages: 5, author: "...", ...}
    analyzed        BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_documents_user ON documents(user_id);
CREATE INDEX idx_documents_type ON documents(file_type);

-- ============================================================
-- 3. Images (uploaded/captured)
-- ============================================================
CREATE TABLE images (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    filename        VARCHAR(500) NOT NULL,
    original_name   VARCHAR(500) NOT NULL,
    file_type       VARCHAR(20) NOT NULL,   -- 'jpg', 'png', 'webp'
    file_size       BIGINT,
    storage_path    VARCHAR(1000) NOT NULL,
    source          VARCHAR(20) DEFAULT 'upload', -- 'upload', 'camera'
    ocr_text        TEXT,                   -- Extracted text via OCR
    analysis        TEXT,                   -- AI vision analysis
    metadata        JSONB,                  -- {width, height, has_text, ...}
    created_at      TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_images_user ON images(user_id);

-- ============================================================
-- 4. Reminders (medication & appointments)
-- ============================================================
CREATE TABLE reminders (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type            VARCHAR(30) NOT NULL,   -- 'medication', 'appointment', 'general'
    title           VARCHAR(300) NOT NULL,
    description     TEXT,
    scheduled_at    TIMESTAMP NOT NULL,
    recurring       VARCHAR(50),            -- 'daily', 'weekly', 'monthly', NULL = once
    medication_name VARCHAR(200),           -- For medication type
    dosage          VARCHAR(100),           -- e.g. "500mg"
    notified        BOOLEAN DEFAULT FALSE,
    active          BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_reminders_user ON reminders(user_id);
CREATE INDEX idx_reminders_scheduled ON reminders(scheduled_at);
CREATE INDEX idx_reminders_active ON reminders(active) WHERE active = TRUE;

-- ============================================================
-- 5. User Profile Memory (what AI knows about user)
-- ============================================================
CREATE TABLE user_profile_memory (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    key             VARCHAR(100) NOT NULL,  -- e.g. 'allergies', 'conditions', 'preferences'
    value           TEXT NOT NULL,
    source          VARCHAR(50) DEFAULT 'ai', -- 'ai_extracted', 'user_input', 'document'
    confidence      FLOAT DEFAULT 1.0,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, key)
);
CREATE INDEX idx_profile_memory_user ON user_profile_memory(user_id);

-- ============================================================
-- 6. Health Trends (cached AI analysis)
-- ============================================================
CREATE TABLE health_trends (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    trend_type      VARCHAR(50) NOT NULL,   -- 'weight', 'bmi', 'sleep', 'calories', 'water'
    period          VARCHAR(20) NOT NULL,   -- '7d', '30d', '90d', '1y'
    direction       VARCHAR(20),            -- 'up', 'down', 'stable'
    change_value    FLOAT,
    change_percent  FLOAT,
    insight         TEXT,                   -- AI-generated insight
    generated_at    TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, trend_type, period)
);
CREATE INDEX idx_trends_user ON health_trends(user_id);

-- ============================================================
-- 7. Daily Health Summaries (AI-generated)
-- ============================================================
CREATE TABLE daily_summaries (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    summary_date    DATE NOT NULL,
    summary         TEXT NOT NULL,
    mood_estimate   VARCHAR(50),            -- AI-inferred mood
    highlights      JSONB,                  -- Key achievements
    concerns        JSONB,                  -- Areas needing attention
    generated_at    TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, summary_date)
);
CREATE INDEX idx_summaries_user_date ON daily_summaries(user_id, summary_date);
```

### Modified Tables

```sql
-- Add to existing users table
ALTER TABLE users ADD COLUMN preferred_language VARCHAR(10) DEFAULT 'en';
ALTER TABLE users ADD COLUMN profile_memory JSONB DEFAULT '{}';
ALTER TABLE users ADD COLUMN wake_word_enabled BOOLEAN DEFAULT FALSE;
```

### ChromaDB Collections (not SQL)

| Collection Name | Purpose | Embedding Model |
|----------------|---------|-----------------|
| `user_{id}_documents` | Document chunks for RAG | nomic-embed-text |
| `user_{id}_conversations` | Conversation memory | nomic-embed-text |
| `user_{id}_knowledge` | User profile & extracted facts | nomic-embed-text |

---

## 4. Backend API Design

### 4.1 Voice Module (`/api/voice`)

| Method | Endpoint | Description | Request | Response |
|--------|----------|-------------|---------|----------|
| POST | `/api/voice/stt` | Speech-to-Text (audio file) | `multipart: audio_file` | `{ text, confidence, language }` |
| POST | `/api/voice/stt/stream` | STT via WebSocket | WebSocket binary audio | `{ text, is_final }` |
| POST | `/api/voice/tts` | Text-to-Speech | `{ text, voice? }` | `audio/wav` binary |
| GET | `/api/voice/status` | Check voice service health | — | `{ whisper_available, tts_available }` |

### 4.2 Document Module (`/api/documents`)

| Method | Endpoint | Description | Request | Response |
|--------|----------|-------------|---------|----------|
| POST | `/api/documents/upload` | Upload document | `multipart: file` | `{ id, filename, type, status }` |
| GET | `/api/documents` | List user's documents | `?type=pdf&page=1` | `[{ id, filename, type, created_at }]` |
| GET | `/api/documents/{id}` | Get document details | — | `{ id, filename, type, content_text, summary }` |
| DELETE | `/api/documents/{id}` | Delete document | — | `{ success }` |
| POST | `/api/documents/{id}/analyze` | AI analyze document | — | `{ analysis, disclaimer }` |
| POST | `/api/documents/{id}/extract` | Extract text from document | — | `{ text, pages, metadata }` |
| GET | `/api/documents/{id}/download` | Download original file | — | Binary file |

### 4.3 Vision Module (`/api/vision`)

| Method | Endpoint | Description | Request | Response |
|--------|----------|-------------|---------|----------|
| POST | `/api/vision/analyze` | Analyze image with AI | `multipart: image` | `{ analysis, disclaimer }` |
| POST | `/api/vision/ocr` | OCR on image | `multipart: image` | `{ text, confidence, blocks }` |
| POST | `/api/vision/upload` | Upload image to library | `multipart: image` | `{ id, filename, ocr_text? }` |
| GET | `/api/vision` | List user's images | `?page=1` | `[{ id, filename, source, created_at }]` |
| GET | `/api/vision/{id}` | Get image details | — | `{ id, filename, analysis, ocr_text }` |
| DELETE | `/api/vision/{id}` | Delete image | — | `{ success }` |
| POST | `/api/vision/capture` | Save camera capture | `multipart: image` | `{ id, filename }` |

### 4.4 Health Features Module (`/api/health`)

| Method | Endpoint | Description | Request | Response |
|--------|----------|-------------|---------|----------|
| GET | `/api/health/dashboard` | AI-powered dashboard | — | `{ trends, summary, insights }` |
| GET | `/api/health/trends/{type}` | Get trend analysis | `?period=30d` | `{ direction, change, insight }` |
| GET | `/api/health/summary/daily` | Get today's AI summary | — | `{ summary, highlights, concerns }` |
| POST | `/api/health/summary/generate` | Generate daily summary | — | `{ summary, highlights, concerns }` |
| GET | `/api/health/insights` | Personalized health insights | — | `{ insights: [{ type, message, priority }] }` |

### 4.5 Reminders Module (`/api/reminders`)

| Method | Endpoint | Description | Request | Response |
|--------|----------|-------------|---------|----------|
| GET | `/api/reminders` | List user's reminders | `?active=true` | `[{ id, type, title, scheduled_at }]` |
| POST | `/api/reminders` | Create reminder | `{ type, title, scheduled_at, ... }` | `{ id, ... }` |
| PUT | `/api/reminders/{id}` | Update reminder | `{ title, scheduled_at, ... }` | `{ id, ... }` |
| DELETE | `/api/reminders/{id}` | Delete reminder | — | `{ success }` |
| POST | `/api/reminders/{id}/dismiss` | Dismiss notification | — | `{ success }` |

### 4.6 Knowledge Module (`/api/knowledge`)

| Method | Endpoint | Description | Request | Response |
|--------|----------|-------------|---------|----------|
| GET | `/api/knowledge/conversations` | List conversations | `?page=1` | `[{ id, title, message_count, updated_at }]` |
| GET | `/api/knowledge/conversations/{id}` | Get conversation messages | — | `{ id, title, messages: [...] }` |
| DELETE | `/api/knowledge/conversations/{id}` | Delete conversation | — | `{ success }` |
| POST | `/api/knowledge/conversations/{id}/title` | Update title | `{ title }` | `{ success }` |
| GET | `/api/knowledge/search` | Search conversations | `?q=keyword&page=1` | `[{ conversation_id, message, score }]` |
| GET | `/api/knowledge/memory` | Get AI's memory of user | — | `{ memories: [{ key, value, source }] }` |
| POST | `/api/knowledge/memory` | Add/update memory | `{ key, value }` | `{ success }` |
| DELETE | `/api/knowledge/memory/{key}` | Delete memory | — | `{ success }` |
| PUT | `/api/knowledge/language` | Set preferred language | `{ language }` | `{ success }` |

### 4.7 WebSocket Endpoints

| Endpoint | Description | Messages |
|----------|-------------|----------|
| `ws://host/ws/chat?token=jwt` | Real-time chat with streaming | Client: `{ type: "message", content: "..." }` → Server: `{ type: "token", content: "..." }` + `{ type: "done", disclaimer: "..." }` |
| `ws://host/ws/voice?token=jwt` | Voice conversation (STT + chat + TTS) | Client: binary audio → Server: `{ type: "transcript", text: "..." }` → Server: `{ type: "reply", text: "..." }` → Server: binary audio (TTS) |

### 4.8 RAG Pipeline (Internal Service)

```
User Query
    │
    ▼
┌─────────────────┐
│ 1. Embed query  │ ← nomic-embed-text via Ollama
└────────┬────────┘
         │ vector
         ▼
┌─────────────────┐
│ 2. ChromaDB     │ ← Search user's collections
│    Similarity   │    (documents, conversations, knowledge)
└────────┬────────┘
         │ top-k chunks
         ▼
┌─────────────────┐
│ 3. Rerank       │ ← Optional: cross-encoder reranking
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 4. Build        │ ← Combine chunks into context
│    Context      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 5. LLM Chat     │ ← llama3.2 with augmented context
└─────────────────┘
```

---

## 5. Frontend Component Structure

### 5.1 Route Additions

```jsx
// In routes.jsx — new routes to add
{ path: 'ai/documents', element: <DocumentsPage /> },
{ path: 'ai/vision', element: <VisionPage /> },
{ path: 'ai/health', element: <HealthFeaturesPage /> },
{ path: 'ai/knowledge', element: <KnowledgePage /> },
```

### 5.2 Sidebar Additions

```jsx
// New navigation items for Sidebar
{ name: 'AI Documents', href: '/ai/documents', icon: FileText },
{ name: 'AI Vision', href: '/ai/vision', icon: Camera },
{ name: 'AI Health', href: '/ai/health', icon: Heart },
{ name: 'AI Knowledge', href: '/ai/knowledge', icon: BookOpen },
```

### 5.3 Component Tree

```
App
├── AuthLayout
│   ├── LoginPage
│   └── RegisterPage
│
└── MainLayout (ProtectedRoute)
    ├── Sidebar (with new nav items)
    ├── Header
    │   └── VoiceButton (global, always visible)
    └── Routes
        ├── HomePage
        ├── DashboardPage
        ├── RecordsPage
        ├── AnalyticsPage
        ├── ProfilePage
        ├── SettingsPage
        ├── LLMAssistantPage (enhanced with voice)
        ├── DocumentsPage (NEW)
        │   ├── DocumentUploader
        │   ├── DocumentList
        │   └── DocumentViewer + AnalysisResult
        ├── VisionPage (NEW)
        │   ├── ImageUploader / CameraCapture
        │   ├── ImagePreview
        │   └── VisionAnalysis
        ├── HealthFeaturesPage (NEW)
        │   ├── HealthDashboard
        │   ├── TrendChart
        │   ├── DailySummary
        │   └── ReminderList + ReminderForm
        └── KnowledgePage (NEW)
            ├── ChatHistory
            ├── SearchConversations
            ├── LanguageSelector
            └── ProfileMemory
```

### 5.4 Key Frontend Hooks

| Hook | Purpose | Dependencies |
|------|---------|-------------|
| `useSpeechRecognition` | Browser Web Speech API | None (browser native) |
| `useCamera` | Camera capture via MediaDevices | None (browser native) |
| `useWebSocket` | WebSocket connection management | None |
| `useVoiceChat` | Combined voice + chat flow | useSpeechRecognition + useWebSocket |

---

## 6. Recommended Ollama Models

### 6.1 Chat Model (Primary)

| Model | Size | RAM | Quality | Use Case |
|-------|------|-----|---------|----------|
| **llama3.2:3b** | 2.0 GB | 4 GB | Good | Default chat, fast responses |
| **llama3.2:latest** (1B) | 0.7 GB | 2 GB | Fair | Low-resource devices |
| **mistral:7b** | 4.1 GB | 8 GB | Better | Complex medical analysis |
| **mixtral:8x7b** | 26 GB | 48 GB | Best | High-end server (optional) |

**Recommendation**: Keep `llama3.2:latest` as default. Add `mistral:7b` as optional upgrade.

### 6.2 Vision Model

| Model | Size | RAM | Quality | Use Case |
|-------|------|-----|---------|----------|
| **llama3.2-vision:11b** | 7.9 GB | 16 GB | Good | Medical image analysis |
| **llava:7b** | 4.5 GB | 8 GB | Fair | General image understanding |
| **llava:13b** | 8.0 GB | 16 GB | Better | Detailed image analysis |

**Recommendation**: Use `llava:7b` as default (smaller, faster). Offer `llama3.2-vision:11b` for better medical image understanding.

### 6.3 Embedding Model

| Model | Size | RAM | Quality | Use Case |
|-------|------|-----|---------|----------|
| **nomic-embed-text** | 0.27 GB | 1 GB | Good | General embeddings for RAG |
| **all-minilm** | 0.13 GB | 0.5 GB | Fair | Lightweight, faster |
| **mxbai-embed-large** | 0.67 GB | 2 GB | Better | Higher quality retrieval |

**Recommendation**: Use `nomic-embed-text` as default (best balance of quality/size).

### 6.4 Speech Model (Optional)

| Model | Size | RAM | Quality | Use Case |
|-------|------|-----|---------|----------|
| **whisper:base** | 0.15 GB | 1 GB | Good | STT via Ollama |
| **whisper:small** | 0.5 GB | 2 GB | Better | More accurate STT |
| **whisper:medium** | 1.5 GB | 4 GB | Best | High-accuracy STT |

**Recommendation**: Use browser Web Speech API first (zero deps). Fall back to `whisper:base` via Ollama for better accuracy.

### 6.5 Total Storage Estimate

| Configuration | Models | Disk Space | RAM |
|--------------|--------|------------|-----|
| **Minimum** | llama3.2:1b + nomic-embed-text | ~1 GB | 3 GB |
| **Recommended** | llama3.2:3b + llava:7b + nomic-embed-text | ~7 GB | 12 GB |
| **Full** | mistral:7b + llama3.2-vision:11b + nomic-embed-text + whisper:small | ~13 GB | 20 GB |

---

## 7. Implementation Roadmap

### Phase 1: Foundation (Week 1-2) — ⭐ Low Risk

```
Goal: Set up infrastructure, file storage, and database migrations
```

| Task | Files | Dependencies |
|------|-------|-------------|
| 1.1 Create storage directory structure | `backend/storage/` | None |
| 1.2 Add new DB models (conversations, documents, images, reminders, memory, trends) | `backend/db/models.py` | None |
| 1.3 Update migration to create new tables | `backend/db/migrate.py` | 1.2 |
| 1.4 Add new dependencies to requirements.txt | `backend/requirements.txt` | None |
| 1.5 Create base file upload utility | `backend/services/file_utils.py` | 1.1 |
| 1.6 Set up ChromaDB vector store client | `backend/services/vector_store.py` | 1.4 |
| 1.7 Add embedding service (Ollama nomic-embed-text) | `backend/services/embedding_service.py` | 1.6 |
| 1.8 Create WebSocket chat endpoint | `backend/api/websocket/chat.py` | None |

**Estimated effort**: 5-7 days  
**Risk**: Low — mostly boilerplate, no complex logic  
**New dependencies**: `chromadb`, `sentence-transformers` (optional)

### Phase 2: Document Module (Week 3-4) — ⭐⭐ Medium Risk

```
Goal: Upload, parse, and analyze PDF/DOCX/XLSX/CSV files
```

| Task | Files | Dependencies |
|------|-------|-------------|
| 2.1 Create document parsing service (PDF, DOCX, XLSX, CSV) | `backend/services/document_service.py` | 1.2, 1.5 |
| 2.2 Create document API routes | `backend/api/routes/documents.py` | 2.1 |
| 2.3 Add document analysis via LLM | `backend/services/document_service.py` | 2.1, LLM service |
| 2.4 Create DocumentUploader component | `frontend/src/features/documents/components/` | None |
| 2.5 Create DocumentViewer component | `frontend/src/features/documents/components/` | None |
| 2.6 Create DocumentsPage | `frontend/src/features/documents/pages/` | 2.4, 2.5 |
| 2.7 Add document API methods to api.js | `frontend/src/app/services/api.js` | 2.2 |
| 2.8 Add route and sidebar link | `frontend/src/app/routes.jsx`, `Sidebar.jsx` | 2.6 |

**Estimated effort**: 5-7 days  
**Risk**: Medium — PDF parsing can be tricky with complex layouts  
**New dependencies**: `pypdf2` or `pdfplumber`, `python-docx`, `openpyxl` (already present), `pandas` (already present)

### Phase 3: Vision Module (Week 5-6) — ⭐⭐⭐ Medium-High Risk

```
Goal: Image upload, camera capture, OCR, and vision analysis
```

| Task | Files | Dependencies |
|------|-------|-------------|
| 3.1 Create OCR service (PaddleOCR/Tesseract) | `backend/services/ocr_service.py` | 1.4 |
| 3.2 Create vision analysis service (Ollama vision models) | `backend/services/vision_service.py` | LLM service |
| 3.3 Create vision API routes | `backend/api/routes/vision.py` | 3.1, 3.2 |
| 3.4 Create ImageUploader component | `frontend/src/features/vision/components/` | None |
| 3.5 Create CameraCapture component (useMediaDevices) | `frontend/src/features/vision/components/` | None |
| 3.6 Create VisionPage | `frontend/src/features/vision/pages/` | 3.4, 3.5 |
| 3.7 Add vision API methods to api.js | `frontend/src/app/services/api.js` | 3.3 |
| 3.8 Add route and sidebar link | `frontend/src/app/routes.jsx`, `Sidebar.jsx` | 3.6 |

**Estimated effort**: 5-7 days  
**Risk**: Medium-High — OCR accuracy varies, camera API has browser compatibility issues  
**New dependencies**: `pytesseract` (Tesseract) or `paddleocr`, `pillow` (already present)

### Phase 4: Voice Module (Week 7-8) — ⭐⭐⭐ Medium-High Risk

```
Goal: Speech-to-Text, Text-to-Speech, wake word
```

| Task | Files | Dependencies |
|------|-------|-------------|
| 4.1 Create STT service (Whisper via Ollama) | `backend/services/voice_service.py` | 1.4 |
| 4.2 Create TTS service (gTTS or piper) | `backend/services/voice_service.py` | 1.4 |
| 4.3 Create voice API routes | `backend/api/routes/voice.py` | 4.1, 4.2 |
| 4.4 Create useSpeechRecognition hook | `frontend/src/features/voice/hooks/` | None (browser API) |
| 4.5 Create VoiceButton component | `frontend/src/features/voice/components/` | 4.4 |
| 4.6 Create VoiceWaveform component | `frontend/src/features/voice/components/` | None |
| 4.7 Integrate voice into LLMAssistantPage | `frontend/src/app/pages/LLMAssistantPage.jsx` | 4.5, 4.6 |
| 4.8 Add voice API methods to api.js | `frontend/src/app/services/api.js` | 4.3 |

**Estimated effort**: 5-7 days  
**Risk**: Medium-High — Web Speech API inconsistent across browsers, TTS quality varies  
**New dependencies**: `gtts` (Google TTS, requires internet) or `piper-tts` (local, larger), `ollama` (already present for Whisper)

### Phase 5: Health Features (Week 9-10) — ⭐⭐ Medium Risk

```
Goal: AI dashboard, trends, daily summaries, reminders
```

| Task | Files | Dependencies |
|------|-------|-------------|
| 5.1 Create health trends analysis service | `backend/services/health_features_service.py` | LLM service, records service |
| 5.2 Create daily summary generation service | `backend/services/health_features_service.py` | 5.1 |
| 5.3 Create reminder service (APScheduler) | `backend/services/reminder_service.py` | 1.2 |
| 5.4 Create health features API routes | `backend/api/routes/health_features.py` | 5.1, 5.2, 5.3 |
| 5.5 Create HealthDashboard component | `frontend/src/features/health-features/components/` | None |
| 5.6 Create TrendChart component (recharts) | `frontend/src/features/health-features/components/` | recharts (already present) |
| 5.7 Create DailySummary component | `frontend/src/features/health-features/components/` | None |
| 5.8 Create ReminderList + ReminderForm | `frontend/src/features/health-features/components/` | None |
| 5.9 Create HealthFeaturesPage | `frontend/src/features/health-features/pages/` | 5.5-5.8 |
| 5.10 Add health API methods to api.js | `frontend/src/app/services/api.js` | 5.4 |
| 5.11 Add route and sidebar link | `frontend/src/app/routes.jsx`, `Sidebar.jsx` | 5.9 |

**Estimated effort**: 5-7 days  
**Risk**: Medium — reminder scheduling edge cases, trend calculation accuracy  
**New dependencies**: `apscheduler`

### Phase 6: Knowledge & Memory (Week 11-12) — ⭐⭐⭐ Medium-High Risk

```
Goal: Chat history, search, multi-language, profile memory, RAG
```

| Task | Files | Dependencies |
|------|-------|-------------|
| 6.1 Create RAG pipeline service | `backend/services/rag_service.py` | 1.6, 1.7, LLM service |
| 6.2 Create knowledge service (history, search, memory) | `backend/services/knowledge_service.py` | 6.1, 1.2 |
| 6.3 Create knowledge API routes | `backend/api/routes/knowledge.py` | 6.2 |
| 6.4 Create ChatHistory component | `frontend/src/features/knowledge/components/` | None |
| 6.5 Create SearchConversations component | `frontend/src/features/knowledge/components/` | None |
| 6.6 Create LanguageSelector component | `frontend/src/features/knowledge/components/` | None |
| 6.7 Create ProfileMemory component | `frontend/src/features/knowledge/components/` | None |
| 6.8 Create KnowledgePage | `frontend/src/features/knowledge/pages/` | 6.4-6.7 |
| 6.9 Integrate RAG into LLM chat | `backend/services/llm_service.py` | 6.1 |
| 6.10 Add knowledge API methods to api.js | `frontend/src/app/services/api.js` | 6.3 |
| 6.11 Add route and sidebar link | `frontend/src/app/routes.jsx`, `Sidebar.jsx` | 6.8 |

**Estimated effort**: 5-7 days  
**Risk**: Medium-High — RAG quality depends on chunking strategy and embedding quality  
**New dependencies**: `chromadb` (already in Phase 1)

### Phase 7: Polish & Integration (Week 13-14) — ⭐ Low Risk

```
Goal: Testing, performance optimization, edge cases, documentation
```

| Task | Description |
|------|-------------|
| 7.1 End-to-end testing of all modules | Manual + automated |
| 7.2 Error handling and edge cases | All API routes |
| 7.3 Performance optimization | Caching, lazy loading, pagination |
| 7.4 Mobile responsiveness | Test all new pages on mobile |
| 7.5 Documentation | Update README, API docs |
| 7.6 Security audit | File upload validation, rate limiting |

**Estimated effort**: 5-7 days  
**Risk**: Low — refinement phase

---

## 8. Risk Analysis & Estimated Complexity

### Risk Matrix

| Phase | Risk Level | Key Risks | Mitigation |
|-------|-----------|-----------|------------|
| **P1: Foundation** | 🟢 Low | ChromaDB version compatibility | Pin version, test with SQLite fallback |
| **P2: Documents** | 🟡 Medium | PDF parsing fails on complex layouts | Use pdfplumber (more robust), fallback to text extraction |
| **P3: Vision** | 🟠 Med-High | OCR accuracy on medical documents | Use PaddleOCR (better for text detection), allow manual correction |
| **P4: Voice** | 🟠 Med-High | Browser STT inconsistent | Fallback to Ollama Whisper, provide text input always |
| **P5: Health** | 🟡 Medium | Reminder timing accuracy | Use APScheduler with DB persistence, handle timezone |
| **P6: Knowledge** | 🟠 Med-High | RAG quality poor with small chunks | Tune chunk size (500-1000 chars), overlap (100 chars) |
| **P7: Polish** | 🟢 Low | Scope creep | Freeze features, only fix bugs |

### Complexity Estimates

| Metric | P1 | P2 | P3 | P4 | P5 | P6 | P7 | Total |
|--------|----|----|----|----|----|----|----|-------|
| **Backend files** | 5 | 3 | 3 | 3 | 4 | 3 | 0 | **21** |
| **Frontend files** | 0 | 6 | 6 | 5 | 7 | 6 | 0 | **30** |
| **New dependencies** | 2 | 2 | 1 | 1 | 1 | 0 | 0 | **7** |
| **DB tables** | 7 | 0 | 0 | 0 | 0 | 0 | 0 | **7** |
| **API endpoints** | 1 | 7 | 7 | 4 | 8 | 9 | 0 | **36** |
| **Person-days** | 7 | 7 | 7 | 7 | 7 | 7 | 5 | **47** |

### Dependency Graph

```
Phase 1 (Foundation)
    ├──► Phase 2 (Documents)
    ├──► Phase 3 (Vision)
    ├──► Phase 4 (Voice)
    ├──► Phase 5 (Health Features)
    └──► Phase 6 (Knowledge)
              │
              └──► Phase 7 (Polish)
```

Phases 2-6 can be developed in parallel after Phase 1 is complete.

### Ollama Model Pull Commands

```bash
# Minimum setup (Phase 1)
ollama pull llama3.2:latest
ollama pull nomic-embed-text

# Vision (Phase 3)
ollama pull llava:7b

# Voice STT (Phase 4)
ollama pull whisper:base

# Optional upgrades
ollama pull mistral:7b
ollama pull llama3.2-vision:11b
```

### New Python Dependencies

```txt
# Added to requirements.txt
chromadb>=0.5.0            # Vector store (Phase 1)
pypdf2>=3.0.0              # PDF parsing (Phase 2)
python-docx>=1.1.0         # DOCX parsing (Phase 2)
pytesseract>=0.3.10        # OCR (Phase 3)
gtts>=2.5.0                # Text-to-Speech (Phase 4)
apscheduler>=3.10.0        # Reminder scheduling (Phase 5)
```

### New Frontend Dependencies

```json
// Added to package.json (minimal — most features use browser APIs)
{
  "dependencies": {
    // No new major dependencies needed
    // Voice: Web Speech API (browser native)
    // Camera: MediaDevices API (browser native)
    // Documents: FileReader API (browser native)
    // Charts: recharts (already present)
  }
}
```

---

## Summary

| Aspect | Detail |
|--------|--------|
| **Total phases** | 7 |
| **Total timeline** | ~14 weeks (3.5 months) |
| **New backend files** | ~21 |
| **New frontend files** | ~30 |
| **New DB tables** | 7 |
| **New API endpoints** | ~36 |
| **New Python deps** | 7 (all free/open-source) |
| **New JS deps** | 0 (all browser native) |
| **Ollama models** | 3-5 (depending on config) |
| **Total disk (recommended)** | ~7 GB for Ollama models |
| **Total RAM (recommended)** | ~12 GB |
| **Privacy** | 100% local — no external API calls |