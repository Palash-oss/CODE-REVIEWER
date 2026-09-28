# AI Usage Report (Mandatory Disclosure)

This document provides transparent disclosure of AI assistance used during the design, development, debugging, and testing of the **AI-Powered Code Review Assistant**, adhering to the assessment guidelines.

---

## 1. AI Tools Utilized

- **Antigravity AI (Google DeepMind)**: Primary pair-programming agent used for full-stack scaffolding, debugging TypeScript compilation issues, database error tracing, and UI design refactoring.
- **Google Gemini 2.5 Flash / 1.5 Flash**: Tested as cloud inference model for automated code review execution, AST prompt evaluation, and conversational code chat.
- **OpenAI GPT-4o-mini**: Integrated as standard cloud completion provider for comparative evaluation.

---

## 2. Prompts Used & Interaction Patterns

### Architecture & Feature Planning
> *"Design a production-grade full-stack architecture for an AI Code Review Assistant using NestJS, PostgreSQL, TypeORM, and Next.js 16 App Router. Support configurable AI providers (OpenAI, Ollama, LM Studio, Gemini) via an OpenAI-compatible interface."*

### File Ingestion & Database Exception Handling
> *"When users upload real repository ZIPs, PostgreSQL throws `invalid byte sequence for encoding UTF8: 0x00`. Inspect the zip extractor and file service to sanitize binary files, exclude junk directories like node_modules and .git, and write files in safe database batches."*

### Provider-Agnostic LLM Client
> *"Create a generic OpenAI-compatible provider in NestJS that handles /chat/completions for any base URL and model. Extract detailed error messages when providers return 429 quota exhausted or 401 invalid credentials so users get actionable feedback."*

### UI Theme Transformation
> *"Refactor the entire frontend UI from generic purple/blue gradients to an industrial, high-contrast monochrome/zinc dark theme styled like GitHub Dark / Linear. Ensure clean Monaco editor line highlights for Critical, High, Medium, and Low severity issues."*

---

## 3. Division of Labor: Generated vs. Manually Guided Code

### AI-Assisted Components
- **Tree-sitter AST & Static Scanner Regexes (`parsing/`)**: Generated regex patterns for credential detection (AWS keys, private keys, generic tokens) and AST traversal boilerplate for JavaScript, TypeScript, Python, and Go.
- **Safe JSON Extraction Utility (`reviews/utils/safe-json-parse.ts`)**: Regex logic for stripping markdown backticks (````json ... ````) and recovering from partially malformed LLM outputs.
- **Monaco Editor React Integration (`components/code-viewer.tsx`)**: Line decoration glyphs and CSS injection for highlighting specific code lines corresponding to review issues.
- **Git Cloning Subprocess Integration (`files/files.service.ts`)**: Promisified `child_process.exec` execution of `git clone --depth 1` into temporary directories.

### Manually Driven Engineering Decisions & Architecture
- **Choice of Provider-Agnostic Interface**: Decided to leverage the universal OpenAI `/chat/completions` protocol across all providers (OpenAI, Gemini, Ollama, LM Studio, Groq) rather than installing vendor-specific SDKs. This kept bundle size minimal and allowed zero-code-change support for newly emerging models.
- **Dynamic `.env` Hot-Reloading (`ai-provider-config.service.ts`)**: Implemented dynamic filesystem `.env` re-reading so developer API keys updated on disk take effect without requiring Node.js process restarts.
- **PostgreSQL 0x00 Null-Byte Filter**: Discovered that real repositories contain binary files (images, icons, `.git` pack objects) whose UTF-8 conversion introduces null bytes rejected by PostgreSQL `TEXT` columns. Implemented buffer inspection and sanitization to prevent 500 errors.
- **Decoupled Three-Pane Layout**: Designed an IDE-style workspace with independent file scrolling, full Monaco code viewing, and tabbed review/chat interaction.

---

## 4. Key Engineering Decisions & Trade-Offs

### 1. Unified OpenAI-Compatible Interface vs. Dedicated SDKs
- **Decision**: Used standard HTTP `fetch` matching the `/chat/completions` specification instead of installing `@google/genai`, `openai`, or `@langchain/core`.
- **Rationale**: Keeps the backend dependency graph lightweight, reduces attack surface, and enables instant compatibility with any local (Ollama/LM Studio) or cloud provider (Gemini, Groq, Together AI, OpenRouter) simply by changing Base URL.

### 2. Static AST Analysis + LLM Hybrid Pipeline
- **Decision**: Pre-scan code with deterministic Tree-sitter parsers and regex scanners, then inject findings into the LLM prompt.
- **Rationale**: Pure LLM reviews frequently miss hardcoded tokens or hallucinate line numbers. Grounding the prompt with automated static findings produces significantly higher accuracy and verifiable line numbers.

### 3. Shallow Git Cloning (`--depth 1`)
- **Decision**: Used `git clone --depth 1` with a 60-second execution timeout and temporary folder cleanup.
- **Rationale**: Avoids downloading complete git commit histories (which can be gigabytes), minimizing disk usage and speeding up imports to seconds.

---

## 5. Security & Verification Disclosure

- **No Secrets in Source Control**: All API keys, database credentials, and JWT secrets are stored exclusively in `.env` (ignored via `.gitignore`).
- **Input Validation**: All incoming DTOs are validated using `class-validator` and `ValidationPipe({ whitelist: true })`.
- **Path Traversal Protection**: Normalized all file paths to prevent directory traversal attacks during ZIP extraction and repository cloning.
