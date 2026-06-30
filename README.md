# Origina

AI-powered startup analysis platform. Generate business artifacts — business model canvases, personas, SWOT analyses, roadmaps, and more — through natural language conversations.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | [Next.js 16](https://nextjs.org) |
| Language | TypeScript |
| Database | [Supabase](https://supabase.com) (PostgreSQL) |
| Auth | Supabase (email/password via Origina) |
| AI | DeepSeek |
| Rate Limiting | [Upstash Redis](https://upstash.com) |
| Document Export | PDF ([jsPDF](https://github.com/parallax/jsPDF)), DOCX ([docx](https://docx.js.org/)), PPTX ([PptxGenJS](https://github.com/gitbrent/PptxGenJS)) |

## Getting Started

### Prerequisites

- Node.js >= 18
- A Supabase project
- A DeepSeek API key
- An Upstash Redis instance

### Setup

1. Clone the repo:

```bash
git clone <repo-url>
cd origina
```

2. Install dependencies:

```bash
npm install
```

3. Copy the environment file and fill in your credentials:

```bash
cp .env.example .env.local
```

4. Apply database migrations:

```bash
# Run the migration files in supabase/migrations against your Supabase project
```

5. Start the dev server:

```bash
npm run dev
```

### Environment Variables

See `.env.example` for all required variables:

- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key (server-side only)
- `DEEPSEEK_API_KEY` — DeepSeek API key
- `UPSTASH_REDIS_REST_URL` — Upstash Redis REST URL
- `UPSTASH_REDIS_REST_TOKEN` — Upstash Redis REST token

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

## Project Structure

```
src/
├── app/               # Next.js App Router pages and API routes
│   ├── api/           # Backend API routes
│   ├── artifacts/     # Artifact hub page
│   ├── auth/          # Auth callbacks
│   ├── dashboard/     # Dashboard page
│   ├── login/         # Login page
│   ├── signup/        # Signup page
│   ├── projects/      # Project pages
│   └── settings/      # Settings page
├── components/        # React components
│   └── chat/          # Chat interface components
├── constants/         # Application constants
├── hooks/             # Custom React hooks
├── lib/               # Shared utilities
│   ├── ai/            # AI provider, generators, prompts
│   ├── api/           # API helpers
│   └── supabase/      # Database queries and client
├── styles/            # Global styles and design tokens
└── types/             # TypeScript type definitions
```

## Features

- **Conversational AI** — Chat interface that generates structured business artifacts
- **15 Artifact Types** — Business model canvas, personas, positioning statements, SWOT, competitor analysis, and more
- **Document Export** — Download artifacts as PDF, DOCX, or PPTX
- **Project Management** — Organize artifacts by project
- **Authentication** — Email/password via Supabase, branded as Origina
- **Rate Limiting** — Upstash Redis-based rate limiting on API routes

## Architecture

Artifacts are generated via a consolidated API route (`/api/ai/generate`) that routes requests to type-specific generator modules in `src/lib/ai/generators/`. Streaming responses are handled through a separate SSE endpoint (`/api/ai/assistant-stream`) for the chat interface.

Database access goes through Supabase with Row-Level Security. The admin (service role) client is used sparingly for server-to-server operations.
