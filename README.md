# InterviewForge

InterviewForge is a collaborative coding interview platform that combines real-time video calls, chat, and a live code editor. It supports session hosting and joining, shared problem prompts, and instant code execution for interview practice and pair programming.

## Features
- Real-time video calls and chat (Stream)
- Collaborative code editor with multi-language support
- Problem library with prompts, examples, and constraints
- Session management (create, join, end)
- Secure authentication (Clerk)

## Tech Stack
- Frontend: React, Vite, Tailwind CSS, DaisyUI, Monaco Editor, TanStack Query
- Realtime: Stream Video SDK, Stream Chat
- Backend: Node.js, Express, MongoDB (Mongoose), Inngest
- Auth: Clerk
- Code Execution: Self-hosted Piston (via backend proxy)

## Project Structure
- `frontend/`: React client
- `backend/`: Express API

## Setup

### 1) Install dependencies

From the repo root:

```bash
npm install --prefix backend
npm install --prefix frontend
```

### 2) Environment variables

Create `.env` files in `backend/` and `frontend/`.

`backend/.env`
```
PORT=5001
DB_URL=your_mongodb_connection_string
CLIENT_URL=http://localhost:5173
PISTON_API_URL=http://localhost:2000/api/v2
PISTON_AUTH_HEADER=
PISTON_AUTH_TOKEN=
CODE_EXECUTION_TIMEOUT_MS=20000
CODE_EXECUTION_MAX_CODE_SIZE=20000
CODE_EXECUTION_RATE_LIMIT_MAX=30
CODE_EXECUTION_RATE_LIMIT_WINDOW_MS=60000
INNGEST_EVENT_KEY=your_inngest_event_key
INNGEST_SIGNING_KEY=your_inngest_signing_key
STREAM_API_KEY=your_stream_api_key
STREAM_API_SECRET=your_stream_api_secret
```

`frontend/.env`
```
VITE_API_URL=http://localhost:5001/api
VITE_STREAM_API_KEY=your_stream_api_key
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
```

### 3) Run the app

In separate terminals:

```bash
npm run dev --prefix backend
npm run dev --prefix frontend
```

### 4) Run Piston locally (required for code execution)

Run your own Piston service (Docker example):

```bash
docker run --privileged -dit -v piston-data:/piston -p 2000:2000 --name piston_api ghcr.io/engineer-man/piston
```

If your image/tag differs, set the corresponding value in `PISTON_API_URL`.

## Render Deployment

### Architecture
- Render Service 1: `InterviewForge Backend` (Node web service)
- Render Service 2: `InterviewForge Frontend` (Static Site)
- External Service: `Piston API` on a VM/container host that supports privileged containers

### Backend service settings
- Build Command: `npm install --prefix backend`
- Start Command: `npm run start --prefix backend`
- Required env:
- `NODE_ENV=production`
- `PORT=10000` (or Render default)
- `DB_URL=...`
- `CLIENT_URL=https://<your-frontend-domain>`
- `PISTON_API_URL=https://<your-piston-service>/api/v2`
- `PISTON_AUTH_HEADER=` (optional)
- `PISTON_AUTH_TOKEN=` (optional)
- `INNGEST_EVENT_KEY=...`
- `INNGEST_SIGNING_KEY=...`
- `STREAM_API_KEY=...`
- `STREAM_API_SECRET=...`
- `CLERK_SECRET_KEY=...`

### Frontend static site settings
- Root Directory: `frontend`
- Build Command: `npm install && npm run build`
- Publish Directory: `dist`
- Required env:
- `VITE_API_URL=https://<your-backend-domain>/api`
- `VITE_STREAM_API_KEY=...`
- `VITE_CLERK_PUBLISHABLE_KEY=...`

### Piston service settings
- Piston official Docker deployment uses privileged mode for sandboxing.
- Host Piston on a provider that supports privileged Docker containers (for example: a VPS).
- Expose the API at `http://<host>:2000/api/v2` (or HTTPS behind reverse proxy).
- Set backend `PISTON_API_URL` to that endpoint.
- Restrict network access so only your backend can call it.

## Notes
- The backend enforces CORS based on `CLIENT_URL` in production and allows common localhost origins in development.
- If you change the Stream or Clerk keys, restart the dev servers.
- Frontend no longer calls public Piston directly. All code execution goes through backend route `POST /api/code/execute`.
