# Backend

Node.js Express relay server that sits between the frontend and the CLI daemon machines.

## Features

- Machine registration and discovery
- Relay commands from the frontend to the correct daemon
- Shared context store for multi-agent collaboration
- WebSocket support for real-time results
- Optional Bearer token authentication

## Quick Start

```bash
npm install

# Optional: protect with an auth token
export BACKEND_AUTH_TOKEN=my-secret-token

npm start
```

Server runs on port `3001` by default.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | HTTP port |
| `BACKEND_AUTH_TOKEN` | *(empty)* | Bearer token for API auth |
| `DAEMON_AUTH_TOKEN` | *(empty)* | Token forwarded to daemons as `X-Auth-Token` |
| `ALLOWED_ORIGINS` | `http://localhost:3000` | Comma-separated CORS origins |

## API Reference

### `GET /api/health`
Returns `{ status: "ok" }`.

### `GET /api/machines`
Returns all registered daemon machines.

### `POST /api/machines`
Register a daemon machine.

**Body:**
```json
{ "name": "John's Laptop", "daemonUrl": "http://192.168.1.10:5001", "daemonId": "optional-uuid" }
```

### `POST /api/execute`
Relay a prompt to a registered machine.

**Body:**
```json
{ "machineId": "<id>", "agent": "copilot", "prompt": "write a hello world script", "flags": [] }
```

### `GET /api/context` / `POST /api/context`
Get/set shared agent context (same interface as the daemon context endpoint).

### WebSocket `/ws`
Connect to receive real-time broadcast events from all execution results.

## Running Tests

```bash
npm test
```

## Deployment

### Render / Heroku
```bash
# Set environment variables in the dashboard, then:
git push heroku main
```

Or using Render's `render.yaml` (see `/scripts/render.yaml`).
