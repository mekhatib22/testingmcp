# MVP Multi-AI CLI Framework

Interact with **GitHub Copilot CLI**, **OpenAI Codex**, **Anthropic Claude**, and **Google Gemini** from your phone or any external device — without copying credentials or forwarding ports manually.

```
Phone / browser
     │
     ▼
 [Frontend]  ──HTTP──▶  [Backend relay]  ──HTTP──▶  [CLI Daemon]  ──exec──▶  AI CLIs
 React SPA               Node.js Express              Python Flask
 (Vercel)                (Render/Heroku)               (laptop / server / Termux)
```

---

## Repository Structure

```
.
├── cli-daemon/      Python/Flask daemon – runs on the machine that has the AI CLIs installed
├── backend/         Node.js relay – bridges the frontend and one or more daemons
├── frontend/        React web app – mobile-friendly UI
└── scripts/         Helper scripts for running and deploying each component
```

---

## Quick Start (Local)

### 1. Start the CLI Daemon (on your laptop / dev server)

```bash
cd cli-daemon
pip install -r requirements.txt

export MACHINE_NAME="My Laptop"
export DAEMON_AUTH_TOKEN="changeme"     # optional but recommended
python app.py
# Daemon is now on http://localhost:5001
```

### 2. Start the Backend

```bash
cd backend
npm install

export BACKEND_AUTH_TOKEN="changeme"
export DAEMON_AUTH_TOKEN="changeme"    # must match the daemon
export ALLOWED_ORIGINS="http://localhost:3000"
npm start
# Backend is now on http://localhost:3001
```

### 3. Start the Frontend

```bash
cd frontend
npm install
echo "VITE_BACKEND_URL=http://localhost:3001" > .env.local
npm run dev
# UI is now on http://localhost:3000
```

Open `http://localhost:3000` in your browser (or phone on the same network).

---

## Environment Variables

### CLI Daemon (`cli-daemon/`)

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `5001` | Port to listen on |
| `MACHINE_NAME` | hostname | Display name |
| `DAEMON_ID` | random UUID | Instance identifier |
| `DAEMON_AUTH_TOKEN` | *(empty)* | Shared secret; set to protect the daemon |
| `COMMAND_TIMEOUT` | `60` | Max seconds a CLI command may run |
| `ALLOWED_ORIGINS` | `*` | CORS allowed origins |

### Backend (`backend/`)

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | HTTP port |
| `BACKEND_AUTH_TOKEN` | *(empty)* | Bearer token for frontend→backend auth |
| `DAEMON_AUTH_TOKEN` | *(empty)* | Token forwarded to daemons |
| `ALLOWED_ORIGINS` | `http://localhost:3000` | Comma-separated CORS origins |

### Frontend (`frontend/`)

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_BACKEND_URL` | *(same origin)* | Backend relay URL |

---

## Supported AI Agents

| ID | CLI Tool | Required env var |
|----|----------|-----------------|
| `copilot` | `gh copilot suggest` | GitHub CLI auth (`gh auth login`) |
| `codex` | `codex` | `OPENAI_API_KEY` |
| `claude` | `claude` | `ANTHROPIC_API_KEY` |
| `gemini` | `gemini` | `GEMINI_API_KEY` |

---

## Deployment

### Frontend → Vercel

```bash
cd frontend && npm run build
npx vercel --prod
# Set VITE_BACKEND_URL in the Vercel dashboard
```

Or use the script: `bash scripts/deploy-frontend.sh`

### Backend → Render

Use `scripts/render.yaml` as your Render service configuration, or:

```bash
# Heroku
cd backend
heroku create my-ai-backend
heroku config:set BACKEND_AUTH_TOKEN=... ALLOWED_ORIGINS=https://myapp.vercel.app
git subtree push --prefix backend heroku main
```

### Daemon on Termux (Android)

```bash
pkg install python
pip install flask flask-cors
export MACHINE_NAME="Android Phone"
python cli-daemon/app.py
```

Use [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/) or [ngrok](https://ngrok.com) to expose the daemon URL to the backend.

---

## API Overview

### Daemon (`http://localhost:5001`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Status check |
| GET | `/api/agents` | List available agents |
| POST | `/api/execute` | Run `{ agent, prompt, flags? }` |
| GET/POST | `/api/context` | Shared key-value store |

### Backend (`http://localhost:3001`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Status check |
| GET/POST | `/api/machines` | List / register daemon machines |
| DELETE | `/api/machines/:id` | Remove a machine |
| POST | `/api/execute` | Relay `{ machineId, agent, prompt }` |
| GET/POST/DELETE | `/api/context` | Shared context store |
| WS | `/ws` | Real-time result stream |

---

## Running Tests

```bash
# Daemon
cd cli-daemon && pip install pytest flask flask-cors && pytest tests/

# Backend
cd backend && npm install && npm test

# Frontend
cd frontend && npm install && npm test
```

---

## Architecture Notes

- **Shared context** – both the daemon and backend expose a `/api/context` endpoint so multiple agents can read/write collaborative state during a session.
- **Multi-machine** – register as many daemons as you want; pick the target machine in the UI.
- **Auth** – the system uses two independent tokens: `BACKEND_AUTH_TOKEN` (frontend→backend) and `DAEMON_AUTH_TOKEN` (backend→daemon). You can disable either or both for local development.
- **Extensibility** – add new agents by appending to `SUPPORTED_AGENTS` in `cli-daemon/app.py`.
