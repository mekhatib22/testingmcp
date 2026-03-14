# Frontend

Mobile-friendly React web app for interacting with AI CLIs from any device.

## Features

- Select target machine (laptop, dev server, Android via Termux)
- Pick AI agent: GitHub Copilot, OpenAI Codex, Anthropic Claude, Google Gemini
- Input prompts and view real-time results
- Run history with one-click replay
- Settings modal (backend URL + auth token)
- Dark theme optimised for mobile

## Quick Start

```bash
npm install

# Point at your backend (optional if serving from the same origin)
echo "VITE_BACKEND_URL=http://localhost:3001" > .env.local

npm run dev
```

App runs at `http://localhost:3000`.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_BACKEND_URL` | *(same origin)* | URL of the backend relay server |

## Building for Production

```bash
npm run build
```

Output is in `dist/`. Deploy to [Vercel](https://vercel.com) or any static host.

### Vercel Deployment

```bash
npm i -g vercel
vercel --prod
```

Set `VITE_BACKEND_URL` as an environment variable in the Vercel dashboard.

## Running Tests

```bash
npm test
```
