# Claims Auditor UI

React dashboard for **ClaimsAuditor AI** — upload policies, run claim audits, review audit history, and chat with ingested policy documents using RAG.

## What it does

| View | Description |
|------|-------------|
| **Policy Ingestion** | Upload master EOC/policy files; watch live Docling + vector indexing progress |
| **Claims Audit Desk** | Select a policy, upload a claim, run the cognitive audit pipeline |
| **Auditing Console** | Browse past audit history and compare claim Markdown vs violation report |
| **RAG Assistant** | Ask questions about an ingested policy; answers grounded in vector-retrieved clauses |

## Tech stack

- **React 19** + **TypeScript**
- **Vite** — dev server and build
- **Tailwind CSS 4** — styling
- **Lucide React** — icons
- **react-markdown** — rendered chat responses
- **Nginx** — production static hosting (Docker)

## Prerequisites

- Node.js 22+ (for local dev)
- A running [claims-auditor-api](../claims-auditor-api/) backend on port **8000**

## Quick start (Docker — recommended)

### 1. Configure environment

```bash
cp .env.example .env.docker
```

Edit `.env.docker`:

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_WS_BASE_URL=ws://localhost:8000
UI_PORT=3000
```

> API and WebSocket URLs are **baked in at build time**. Rebuild the image if you change them.

### 2. Build and run

```bash
docker compose up -d --build
```

Open [http://localhost:3000](http://localhost:3000).

### 3. Log in

Use credentials created via the API (`POST /user/enroll`) or an existing account.

## Local development

### 1. Install dependencies

```bash
npm install
```

### 2. Configure API URLs

```bash
cp .env.example .env
```

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_WS_BASE_URL=ws://localhost:8000
```

### 3. Start dev server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) (Vite default).

Ensure the API `CORS_ORIGINS` includes `http://localhost:5173`.

## Production build

```bash
npm run build
npm run preview   # optional local preview of dist/
```

## Project layout

```
claims-auditor-ui/
├── src/
│   ├── App.tsx                 # Auth gate + providers
│   ├── components/
│   │   ├── DashboardLayout.tsx # Tab navigation shell
│   │   ├── PolicyIngestionView.tsx
│   │   ├── ClaimsAuditDesk.tsx
│   │   ├── AuditingConsole.tsx
│   │   ├── RagChatAssistant.tsx
│   │   ├── LoginScreen.tsx
│   │   └── SystemTerminal.tsx  # Live WebSocket log panel
│   ├── context/
│   │   ├── AuthContext.tsx     # JWT login/session
│   │   └── AppContext.tsx      # Policies list (from API)
│   ├── hooks/
│   │   └── useWebSocket.ts     # Pipeline event stream
│   ├── config/
│   │   ├── env.ts              # Vite env vars
│   │   └── endpoints.ts        # Centralized API paths
│   ├── lib/
│   │   └── api.ts              # Authenticated fetch helper
│   └── types/
│       └── api.ts              # Shared TypeScript types
├── Dockerfile                  # Node build → Nginx
├── docker-compose.yml
└── nginx.conf
```

## How it talks to the API

| UI action | API call |
|-----------|----------|
| Login | `POST /auth/login` → stores JWT in `localStorage` |
| Load policies | `GET /api/v1/ingestion/policy/` |
| Upload policy | `POST /api/v1/ingestion/policy/` + WebSocket on policy ID |
| Upload claim | `POST /api/v1/ingestion/claim/` + WebSocket on claim ID |
| Audit history | `GET /api/v1/ingestion/claim/` |
| View audit detail | `GET /api/v1/ingestion/claim/{id}` |
| RAG chat | `POST /api/v1/chat/query` |
| Live progress | `WS /ws/{id}?token=<jwt>` |

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_BASE_URL` | `http://localhost:8000` | REST API base URL (build-time) |
| `VITE_WS_BASE_URL` | `ws://localhost:8000` | WebSocket base URL (build-time) |
| `UI_PORT` | `3000` | Host port for Docker (runtime) |

## Common commands

```bash
# Dev server with hot reload
npm run dev

# Lint
npm run lint

# Rebuild Docker image after env change
docker compose up -d --build

# View container logs
docker compose logs -f ui
```

## Full stack setup

1. Start the API (and its DB + Docling services):

   ```bash
   cd ../claims-auditor-api
   docker compose up -d --build
   ```

2. Start the UI:

   ```bash
   cd ../claims-auditor-ui
   docker compose up -d --build
   ```

3. Register a user via the API, then log in at [http://localhost:3000](http://localhost:3000).

## Architecture

Backend design and component details: [https://github.com/gowtham943/claims-auditor-api/doc/architecture.md](../claims-auditor-api/doc/architecture.md)
