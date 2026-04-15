# Rasa & Reality — Vedic Sutras AI Engine

## Overview

A full-stack web application that analyzes text for emotional essence (Rasa) and factual hallucination using three Vedic Sutras from the framework:
- **Sutra #13 — Natya Shastra / Rasa Sutras**: Sentiment/emotion analysis (15 Rasas)
- **Sutra #10 — Yoga Sutras of Patanjali**: Attention & noise filtering
- **Sutra #3 — Nyaya Sutras**: Logic & inference (5-step Pramana)

Built from the GitHub repo: https://github.com/divineearthly/Rasa-engine-.git

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite (artifacts/rasa-engine)
- **API framework**: Express 5 (artifacts/api-server)
- **Database**: PostgreSQL + Drizzle ORM
- **AI**: Gemini 2.5 Flash via Replit AI Integrations (no user API key needed)
- **Validation**: Zod (zod/v4), drizzle-zod
- **API codegen**: Orval (from OpenAPI spec)

## Key Features

- Analyzes text for dominant Rasa (emotion) from 15 extended Rasas
- Detects hallucinations and scores factual grounding
- Provides Vedic synthesis summary
- Analysis history stored in PostgreSQL, accessible via history panel
- Share analyses via encoded URL
- Export analysis as text report
- Dark/light mode toggle

## Artifacts

- **rasa-engine** (react-vite) at `/` — main frontend UI
- **api-server** (Express) at `/api` — backend with Gemini AI integration

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally
- `pnpm --filter @workspace/rasa-engine run dev` — run frontend locally

## Database Schema

- **rasa_analyses** — stores each analysis with text, rasa name/confidence/explanation, hallucination score/severity/statements, summary, timestamp

## Environment Variables

- `AI_INTEGRATIONS_GEMINI_BASE_URL` — auto-configured by Replit AI Integrations
- `AI_INTEGRATIONS_GEMINI_API_KEY` — auto-configured by Replit AI Integrations
- `DATABASE_URL` — PostgreSQL connection string (auto-configured)
- `SESSION_SECRET` — for session management
