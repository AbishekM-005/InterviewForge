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
- Code Execution: Piston API

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

## Notes
- The backend enforces CORS based on `CLIENT_URL` in production and allows common localhost origins in development.
- If you change the Stream or Clerk keys, restart the dev servers.
