# AI Code Review Assistant — Backend

NestJS + TypeORM + PostgreSQL backend for the AI Code Review Assistant.

## Setup
1. `npm install`
2. Copy `.env.example` to `.env` and fill in DB credentials + JWT secret
3. Create a Postgres database matching `DB_NAME` in `.env`
4. `npm run start:dev`

## Stack
- NestJS (backend framework)
- PostgreSQL + TypeORM (database)
- JWT (auth)
- tree-sitter (code parsing — added later)

## Structure
See `src/` — one folder per feature module (auth, users, projects, files, parsing, ai-providers, reviews, chat).