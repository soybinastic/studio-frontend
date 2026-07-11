# Mini Streaming Studio — Frontend

Modern, responsive studio UI for live sessions with WebRTC (mediasoup), host controls, recording, and streaming.

## Stack

- **Vite 8** + **React 19** + **TypeScript**
- **Tailwind CSS v4** + shadcn-style components
- **mediasoup-client** + **protoo-client** for SFU room access
- **next-themes** for light/dark mode

## Prerequisites

Run all three services locally:

```bash
# 1. Mediasoup SFU (WebSocket on :4443)
cd ../mediasoup-backend/server && nvm use && ./start.sh

# 2. Compositor API (HTTP on :8000)
cd ../compositor-backend && source .venv/bin/activate && python manage.py runserver 8000

# 3. Studio frontend (Vite on :5173)
npm install
cp .env.example .env
npm run dev
```

## Environment

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_COMPOSITOR_API_URL` | `http://localhost:8000/api/v1` | Compositor REST API base URL |

## Routes

| Path | Role |
|------|------|
| `/` | Host — create a session |
| `/join/:sessionId?token=…` | Guest — validate invite and join |
| `/studio/:sessionId` | Live studio (host or guest) |

## Features

- **Host flow:** Create session → enter studio → copy invite link
- **Guest flow:** Open invite URL → enter display name → join room
- **Live A/V grid:** Responsive participant tiles (mobile → tablet → desktop)
- **Host controls:** Layout (CONTAIN / THUMBNAIL), recording, RTMP/HLS streaming, end session
- **Theme:** Light/dark toggle in header
- **Polish:** Toasts, leave/end confirmations, beforeunload warning in room

## Build

```bash
npm run build
npm run preview
```

## Architecture notes

- Browser tiles show **peer WebRTC media** via mediasoup SFU.
- **Compositor output** (recording/streaming) is server-side; layout controls affect recorded/live output, not the in-browser grid.
- Session context (peer ID, WS URL, invite link) is stored in `sessionStorage` for page refresh within the same tab.
