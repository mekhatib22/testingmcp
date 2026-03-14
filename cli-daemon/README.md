# CLI Daemon

A Python/Flask HTTP server that runs on any machine (laptop, server, Termux) and exposes AI CLIs over a local or tunnelled HTTP API.

## Supported Agents

| ID | Tool | Env Variable Required |
|----|------|-----------------------|
| `copilot` | GitHub Copilot CLI (`gh copilot suggest`) | – (requires `gh` auth) |
| `codex` | OpenAI Codex CLI | `OPENAI_API_KEY` |
| `claude` | Anthropic Claude CLI | `ANTHROPIC_API_KEY` |
| `gemini` | Google Gemini CLI | `GEMINI_API_KEY` |

## Quick Start

```bash
# Install dependencies
pip install -r requirements.txt

# (Optional) set auth token to protect your daemon
export DAEMON_AUTH_TOKEN=my-secret-token
export MACHINE_NAME="Johns-Laptop"

# Start the server
python app.py
```

The daemon will be reachable at `http://localhost:5001`.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `5001` | Port to listen on |
| `MACHINE_NAME` | hostname | Display name for this machine |
| `DAEMON_ID` | random UUID | Unique ID for this daemon instance |
| `DAEMON_AUTH_TOKEN` | *(empty)* | If set, all `/api/*` routes require `X-Auth-Token` header |
| `ALLOWED_ORIGINS` | `*` | CORS allowed origins |
| `COMMAND_TIMEOUT` | `60` | Max seconds a CLI command may run |
| `FLASK_DEBUG` | `false` | Enable Flask debug mode |

## API Reference

### `GET /api/health`
Returns daemon status. No authentication required.

### `GET /api/agents`
Lists all supported agents and whether they appear installed/configured.

### `POST /api/execute`
Execute a prompt via an AI CLI.

**Body:**
```json
{
  "agent": "copilot",
  "prompt": "write a bash script to list files",
  "flags": []
}
```

**Response:**
```json
{
  "agent": "copilot",
  "machine": "Johns-Laptop",
  "timestamp": "2026-01-01T00:00:00+00:00",
  "result": {
    "returncode": 0,
    "stdout": "...",
    "stderr": "",
    "success": true
  }
}
```

### `GET /api/context`
Retrieve shared collaborative context store.

### `POST /api/context`
Set a key in the shared context store.

**Body:**
```json
{ "key": "task", "value": "Summarise the codebase" }
```

## Running Tests

```bash
pip install pytest
pytest tests/
```

## Deployment on Termux (Android)

```bash
pkg install python
pip install -r requirements.txt
export MACHINE_NAME="My-Android"
python app.py
```

Use [ngrok](https://ngrok.com) or [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/) to expose the daemon to the internet.
