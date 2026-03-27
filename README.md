# colbyschulz.com

Personal website built with React, TypeScript, and Vite. Live at [colbyschulz.com](https://colbyschulz.com).

## Stack

- **Framework** — React 19 + TypeScript
- **Build tool** — Vite
- **Styling** — SCSS Modules
- **Font** — Syne (Google Fonts)
- **API** — Vercel serverless functions + Anthropic SDK
- **Deployment** — Vercel

## Getting started

**Prerequisites:** Node (via nvm), [Vercel CLI](https://vercel.com/docs/cli) (`npm i -g vercel`)

```bash
nvm use
npm install
cp .env.example .env   # add ANTHROPIC_API_KEY
vercel dev             # runs Vite + API routes together
```

> `npm run dev` only starts Vite — it won't serve `/api/chat`. Use `vercel dev` for local development.

## Project structure

```
colby-schulz-website/
├── src/
│   ├── app.tsx                   # Root component
│   ├── components/
│   │   ├── bouncing-text/        # rAF-based physics animation
│   │   ├── grain-overlay/        # Canvas film grain (throttled to 24fps)
│   │   ├── control-panel/        # Radix UI slider controls
│   │   ├── chat/                 # Chat UI (ChatMessage, ChatInput)
│   │   └── error-boundary/       # Class component with retry
│   └── hooks/
│       └── use-chat.ts           # Streaming chat hook
├── api/
│   ├── chat.ts                   # POST /api/chat — main endpoint
│   └── _utils/
│       ├── cors.ts               # Origin whitelist + CORS headers
│       ├── validation.ts         # Message structure + injection detection
│       ├── rate-limiter.ts       # Per-IP in-memory rate limiting
│       └── content-loader.ts     # Builds system prompt from /content
├── content/                      # Markdown files loaded into system prompt
│   ├── bio.md
│   ├── resume.md
│   ├── projects.md
│   └── interests.md
├── .env.example                  # Required env vars
└── vercel.json                   # Build config for Vercel
```

## API

### `POST /api/chat`

Proxies a conversation to Claude and streams the response back as plain text.

**Request lifecycle:**

1. CORS preflight check
2. Per-IP rate limit check (20 req/hour, in-memory)
3. JSON parse + message validation (structure, 500-char limit, injection patterns)
4. Stream from Anthropic API (`claude-sonnet-4-6`, max 1024 tokens)
5. Forward `content_block_delta` text chunks to client via `ReadableStream`

**Request body:**
```json
{ "messages": [{ "role": "user", "content": "..." }] }
```

**Response:** `text/plain` stream. The `useChat` hook reads it chunk-by-chunk via `ReadableStream` and appends to the assistant message in state.

**System prompt:** Built once at cold start by reading all `.md` files from `/content` and concatenating them. Update the markdown files to change what the assistant knows.

**Environment variables:**

| Variable | Required | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | Yes | Anthropic API key |
| `ALLOWED_ORIGIN` | No | Production domain for CORS (defaults to `http://localhost:5173`) |
