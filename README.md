# AI Study Companion

An AI-powered learning workspace that turns your own study material into an active, evidence-grounded
learning loop — not just another "chat with a PDF" tool.

Organize what you're learning into **Spaces** and **Projects**, upload reference material, and let the
app connect everything together: an **AI Tutor** that answers *only* from your material (with
citations), an **Adaptive Quiz** that targets what you're actually weak on, **Concept Mastery**
tracking, **Growth Analysis**, and a clear **Recommended Next Step** — so studying feels like one
continuous journey instead of a pile of disconnected AI features.

> Built as a 3–4 day full-stack AI engineering prototype challenge.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [Testing](#testing)
- [Demo Access](#demo-access)
- [Known Limitations](#known-limitations)
- [AI Tools Used](#ai-tools-used)
- [Roadmap](#roadmap)

---

## Features

| Feature | Status |
|---|---|
| Authentication (register/login, sessions) | ✅ Implemented |
| Spaces (create, list) | ✅ Implemented |
| Projects within a Space (create, list) | ✅ Implemented |
| Data isolation (users only see their own Spaces/Projects) | ✅ Implemented + tested |
| Activity logging (creation events) | ✅ Implemented |
| Material upload (PDF) | 🚧 In progress |
| Background processing (chunking, embeddings) | 🚧 In progress |
| AI Tutor — grounded answers with citations | 🚧 Planned |
| Unsupported-question handling | 🚧 Planned |
| Adaptive Quiz + open-ended assessment | 🚧 Planned |
| Concept Mastery model | 🚧 Planned |
| Growth Analysis + Recommendations | 🚧 Planned |
| Project &amp; Global Analytics | 🚧 Planned |
| Admin Dashboard | 🚧 Planned |
| AI usage tracking &amp; evaluation view | 🚧 Planned |
| Deployment | 🚧 Planned |

See [Roadmap](#roadmap) for the full build order.

---

## Tech Stack

- **Frontend:** Next.js 15 (App Router), React, Tailwind CSS
- **Backend:** Next.js Server Actions + Route Handlers
- **ORM / Database:** Prisma + SQLite
- **Authentication:** Auth.js (NextAuth) — Credentials provider, JWT sessions, bcrypt-hashed passwords
- **AI / LLM:** Groq API (Llama-3) — Tutor responses, quiz generation, assessment grading
- **Background Processing:** In-app job runner backed by a `Job` table in SQLite

Full reasoning behind each choice is documented in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

---

## Architecture

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the full architecture document, including a
diagram of the system layers, key architectural decisions and trade-offs, data flow for the core
features (material upload, Tutor Q&A, adaptive quiz), and how authentication/authorization/data
isolation are enforced.

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm (or your preferred package manager)
- A [Groq API key](https://console.groq.com) (for AI features)

### Installation

```bash
# Clone the repo
git clone https://github.com/Kamalani09/ai-study-companion.git
cd ai-study-companion/frontend

# Install dependencies
npm install

# Copy the example environment file and fill in your values
cp .env.example .env
```

### Database setup

```bash
# Push the Prisma schema to your local SQLite database
npx prisma db push

# (Optional) Open Prisma Studio to inspect the database
npx prisma studio
```

### Run locally

```bash
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

See `.env.example` for the full list. At minimum you'll need:

| Variable | Description |
|---|---|
| `DATABASE_URL` | SQLite connection string (e.g. `file:./dev.db`) |
| `NEXTAUTH_SECRET` | Random secret used to sign session tokens |
| `NEXTAUTH_URL` | Base URL of the app (e.g. `http://localhost:3000`) |
| `GROQ_API_KEY` | API key for Groq (Llama-3) used by AI features |

Never commit a real `.env` file — only `.env.example` with placeholder values is tracked in git.

---

## Project Structure

```
ai-study-companion/
├── frontend/                 # Next.js application (frontend + backend in one)
│   ├── src/
│   │   ├── app/               # App Router pages, layouts, and Server Actions
│   │   │   ├── (dashboard)/    # Authenticated dashboard, spaces, projects
│   │   │   ├── login/          # Login/register UI
│   │   │   └── api/auth/       # NextAuth route handlers
│   │   ├── lib/                # Prisma client, server actions (space.ts, project.ts, etc.)
│   │   └── middleware.ts       # Route protection
│   ├── prisma/
│   │   └── schema.prisma       # User, Space, Project, Activity models
│   └── tests/                  # Isolation and business-logic tests
├── docs/
│   ├── ARCHITECTURE.md         # Full architecture document
│   └── AI_USAGE.md             # AI tools/prompts disclosure
├── PLAN.md                    # Implementation plan (tech stack, phased build order, data model)
└── README.md
```

---

## Testing

```bash
cd frontend
npm test
```

Current coverage prioritizes **data isolation** (the most consequential failure mode for this kind of
app): automated tests confirm one user cannot read or write another user's Spaces or Projects, in
addition to core create/list happy-path tests.

---

## Demo Access

_To be filled in once the app is deployed:_

- **Deployed URL:** _pending_
- **Demo user:** _pending_
- **Demo admin:** _pending_

---

## Known Limitations

- SQLite is used for rapid prototyping; it is not designed for concurrent multi-writer production
  load. Schema and queries are kept Postgres-compatible for an easy future migration.
- Embeddings are stored per-Project without a dedicated vector database — suitable for prototype-scale
  material volume, not for millions of chunks (see `docs/ARCHITECTURE.md` §4.4 for the migration path).
- Background processing runs in-process rather than via an external queue, so it does not scale
  horizontally across multiple server instances.
- Auth uses a simple Credentials provider (no OAuth) to minimize setup time for this prototype.

---

## AI Tools Used

This project was built with AI-assisted development (Claude for planning/prompt design, Antigravity
IDE for implementation). Full disclosure of tools, where each was used, and every prompt used during
development is in [`docs/AI_USAGE.md`](docs/AI_USAGE.md).

---

## Roadmap

Build phases, in order (✅ done, 🚧 in progress/planned):

1. ✅ Auth + Spaces + Projects (with data isolation)
2. 🚧 Material upload + background processing + retrieval/knowledge representation
3. ⬜ AI Tutor — grounded responses, citations, unsupported-question handling
4. ⬜ Adaptive Quiz + open-ended assessment evaluation
5. ⬜ Mastery model + Growth Analysis + Recommendations
6. ⬜ Project Analytics + Global Analytics
7. ⬜ Admin Dashboard
8. ⬜ Observability + AI usage/cost tracking + basic evaluation harness
9. ⬜ Reliability pass (retries, idempotency, failure handling) + deployment

---

## Author

**Raja Kamalani**
[GitHub](https://github.com/Kamalani09)
