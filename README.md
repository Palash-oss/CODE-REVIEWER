# AI-Powered Code Review Assistant

A full-stack, production-oriented developer tool for uploading source code or repositories and receiving automated, multi-perspective AI code reviews and conversational code assistance. Supports cloud LLMs (OpenAI, Google Gemini, Groq) and local offline LLMs (Ollama, LM Studio) via OpenAI-compatible endpoints.

---

## 🌟 Key Features

### 1. Authentication & Security
- User registration and login with bcrypt-hashed passwords.
- JWT-based authentication with protected API endpoints and client-side auth context.
- Safe session restoration and logout handling.

### 2. Multi-Format Code Ingestion
- **ZIP Upload**: Ingest codebase archives with automatic junk folder filtering (`node_modules`, `.git`, `.next`, `dist`, etc.) and binary/null-byte sanitization.
- **Git / GitHub Repository Clone**: Directly clone any public Git/GitHub repository URL via shallow clone (`git clone --depth 1`).

### 3. Interactive Code Explorer
- Hierarchical file tree with collapsible directories.
- Full-featured **Monaco Editor** integration with syntax highlighting for TypeScript, JavaScript, Python, Go, JSON, Markdown, and more.
- Read-only viewing mode with precise line decorator and issue highlighting.

### 4. Multi-Template AI Review Engine
- **Security Review**: Scans for hardcoded secrets, injection risks, authentication flaws, and OWASP vulnerabilities.
- **Performance Review**: Detects algorithmic bottlenecks, N+1 queries, inefficient rendering loops, and unbounded operations.
- **Code Quality Review**: Evaluates naming clarity, separation of concerns, SOLID principles, and maintainability.
- **Architecture Analysis (Bonus)**: Evaluates module boundaries, coupling, cohesion, and scalability.
- **Test Generator (Bonus)**: Designs comprehensive unit/integration test specifications and edge case coverage.
- **Multi-File Scoping**: Review single files, custom file subsets, or the entire repository.
- **Severity Classification**: Categorizes issues into Critical, High, Medium, and Low severity with click-to-highlight line navigation in Monaco Editor.

### 5. Persistent Review History & Search
- Full history of past reviews per project.
- Real-time search across review summaries and issue findings.
- Inspect previous review reports with complete recommendations.

### 6. AI Code Chat (Context-Aware RAG)
- Interactive conversational chat with the codebase.
- AST keyword and slice retrieval providing targeted code context to the model.
- Persistent multi-turn chat sessions and message logs.

### 7. Configurable AI Providers
- **Google Gemini**: Free cloud tier with `gemini-2.5-flash`, `gemini-2.0-flash`, `gemini-1.5-flash`, and `gemini-2.5-pro`.
- **Ollama**: 100% free, local, and offline models (e.g. `llama3`, `qwen2.5-coder`). Zero API keys required.
- **LM Studio**: Local GUI server on port `1234`. Zero API keys required.
- **OpenAI**: Cloud API (`gpt-4o-mini`, `gpt-4o`).
- **Generic / Groq / OpenRouter**: Any OpenAI-compatible endpoint with custom Base URL and model identifiers.

---

## 🏗️ Repository Structure

```
ai-code-review-assistant/
├── backend/                  # NestJS + TypeORM + PostgreSQL Backend
│   ├── src/
│   │   ├── auth/            # JWT authentication & passport strategy
│   │   ├── users/           # User management
│   │   ├── projects/        # Project CRUD operations
│   │   ├── files/           # ZIP extraction, Git cloning & tree builder
│   │   ├── parsing/         # Tree-sitter AST parsing & static regex checks
│   │   ├── ai-providers/    # OpenAI-compatible engine, factory & presets
│   │   ├── reviews/         # Review templates, runner & safe JSON parser
│   │   ├── chat/            # Context retrieval & conversational sessions
│   │   └── health/          # Health check endpoint
│   ├── .env                 # Backend environment variables
│   └── package.json
├── frontend/                 # Next.js 16 (App Router) + Tailwind CSS v4
│   ├── app/
│   │   ├── login/           # User sign in page
│   │   ├── register/        # User sign up page
│   │   ├── projects/        # Project dashboard & creation modal
│   │   └── projects/[id]/   # Three-pane workspace, reviews & settings
│   ├── components/          # Reusable UI components & severity badges
│   ├── context/             # Client authentication state provider
│   ├── lib/api/             # Typed API client
│   ├── .env.local           # Frontend environment configuration
│   └── package.json
├── README.md                 # Setup guide and project documentation
├── ARCHITECTURE.md           # Detailed architectural and design documentation
└── AI_USAGE.md               # Mandatory disclosure of AI tools and prompts
```

---

## 🚀 Setup & Installation Instructions

### Prerequisites
- **Node.js**: v18+ (tested on Node v20/v24)
- **PostgreSQL**: v14+ running on `localhost:5432`
- **Git**: Installed and available in system PATH

---

### Step 1: Database Setup
Make sure PostgreSQL is running on port 5432. Connect to PostgreSQL and create the database:
```sql
CREATE DATABASE ai_code_review;
```
*(TypeORM automatically synchronizes and creates all database tables on initial backend boot).*

---

### Step 2: Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables in `backend/.env`:
   ```ini
   PORT=3001
   NODE_ENV=development

   # Database
   DB_HOST=localhost
   DB_PORT=5432
   DB_USERNAME=postgres
   DB_PASSWORD=postgres
   DB_NAME=ai_code_review

   # Auth
   JWT_SECRET=super_secret_code_reviewer_key_2026
   JWT_EXPIRES_IN=7d

   # AI Provider (Optional default fallback - can also be configured per-project in UI)
   GEMINI_API_KEY=AIzaSy...your_gemini_key_here
   AI_MODEL=gemini-2.5-flash
   AI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai
   AI_PROVIDER_TYPE=gemini
   ```
4. Build and start the development server:
   ```bash
   npm run build
   npm run dev
   ```
   The backend will be running on **`http://localhost:3001`**. Verify via health check: `http://localhost:3001/health`.

---

### Step 3: Frontend Setup
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Verify `frontend/.env.local`:
   ```ini
   NEXT_PUBLIC_API_URL=http://localhost:3001
   ```
4. Start the frontend development server:
   ```bash
   npm run dev
   ```
   The frontend will be running on **`http://localhost:3002`**.

---

## ⚙️ Environment Variables Summary

### Backend (`backend/.env`)
| Variable | Description | Default |
|---|---|---|
| `PORT` | Backend HTTP port | `3001` |
| `DB_HOST` | PostgreSQL host | `localhost` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_USERNAME` | PostgreSQL username | `postgres` |
| `DB_PASSWORD` | PostgreSQL password | `postgres` |
| `DB_NAME` | PostgreSQL database name | `ai_code_review` |
| `JWT_SECRET` | Secret key for signing JWT tokens | Custom secret string |
| `GEMINI_API_KEY` | Optional fallback key for Google Gemini | None |
| `OPENAI_API_KEY` | Optional fallback key for OpenAI | None |
| `AI_PROVIDER_TYPE` | Default provider (`gemini`, `openai`, `ollama`) | `gemini` |
| `AI_MODEL` | Default model identifier | `gemini-2.5-flash` |
| `AI_BASE_URL` | Base endpoint URL for completions | `https://generativelanguage.googleapis.com/v1beta/openai` |

### Frontend (`frontend/.env.local`)
| Variable | Description | Default |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Backend API root address | `http://localhost:3001` |

---

## 🧪 AI Model Connection Guide

### 1. Google Gemini (Free Cloud API)
1. Generate an API key at [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Go to **AI Provider** in the app navbar $\rightarrow$ Click **Gemini**.
3. Model is auto-set to `gemini-2.5-flash` (or click `gemini-2.0-flash` / `gemini-1.5-flash`).
4. Paste your `AIzaSy...` key and click **Save Configuration**.

### 2. Ollama (100% Free & Local — Zero API Key)
1. Download from [ollama.com](https://ollama.com).
2. Run in your terminal: `ollama run llama3` (or `ollama run qwen2.5-coder`).
3. In the app, select **Ollama** (`http://localhost:11434/v1`).
4. Leave the API key field blank and click **Save Configuration**.

### 3. LM Studio (Local GUI Server)
1. Download from [lmstudio.ai](https://lmstudio.ai).
2. Load any GGUF model and start the server under the **Local Server** tab (port `1234`).
3. In the app, select **LM Studio** (`http://localhost:1234/v1`).
4. Leave the API key field blank and click **Save Configuration**.

### 4. OpenAI (Cloud API)
1. Get an API key from [platform.openai.com](https://platform.openai.com).
2. In the app, select **OpenAI** (`https://api.openai.com/v1`, model `gpt-4o-mini`).
3. Paste your funded `sk-...` key and click **Save Configuration**.