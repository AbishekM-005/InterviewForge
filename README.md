# InterviewForge

InterviewForge is a full-stack mock interview platform for live coding practice. It combines authenticated session management, Stream-powered video/chat, an in-browser code editor, a built-in problem library, and secure backend code execution for JavaScript, Python, and Java.

## What It Does

- Create and join live interview sessions
- Run video calls and in-session chat with Stream
- Solve coding problems in a Monaco-based editor
- Execute code through the backend with Docker sandboxing
- Practice with multiple languages: `javascript`, `python`, and `java`
- Track interview sessions and recent activity
- Authenticate users with Clerk

## Tech Stack

### Frontend

- React 19
- Vite
- React Router
- TanStack Query
- Tailwind CSS
- DaisyUI
- Monaco Editor
- Stream Video React SDK
- Stream Chat React

### Backend

- Node.js
- Express 5
- MongoDB with Mongoose
- Clerk Express middleware
- Stream server SDK
- Inngest
- Docker-based code runner

## Project Structure

```text
InterviewForge/
|-- backend/
|   |-- src/
|   |   |-- controllers/
|   |   |-- lib/
|   |   |-- middleware/
|   |   |-- models/
|   |   |-- routes/
|   |   `-- server.js
|   `-- package.json
|-- frontend/
|   |-- public/
|   |-- src/
|   |   |-- api/
|   |   |-- components/
|   |   |-- data/
|   |   |-- hooks/
|   |   |-- lib/
|   |   |-- pages/
|   |   |-- App.jsx
|   |   `-- main.jsx
|   `-- package.json
`-- README.md
```

## Core Features

### 1. Live Interview Sessions

- Hosts can create interview sessions
- Participants can join active sessions
- Session state is tracked on the backend
- Recent and active sessions are available from the dashboard

### 2. Realtime Video and Chat

- Stream is used for video calling and chat
- Session membership is validated before issuing chat tokens
- Screen sharing is supported in the call UI

### 3. Coding Workspace

- Monaco editor with language switching
- Problem descriptions with examples and constraints
- Output panel for execution results
- Starter templates for JavaScript, Python, and Java

### 4. Secure Code Execution

- Code execution is routed through `POST /api/code/execute`
- Access is protected by Clerk auth
- Execution is rate-limited
- Docker containers run with restricted resources and networking disabled
- Java class names are detected automatically from submitted code
- Runtime images are prepared on demand for Python and Java

## API Overview

### Session Routes

- `POST /api/sessions` - create a session
- `GET /api/sessions/active` - fetch active sessions
- `GET /api/sessions/my-recent` - fetch recent sessions for the signed-in user
- `GET /api/sessions/:id` - fetch one session
- `POST /api/sessions/:id/join` - join a session
- `POST /api/sessions/:id/end` - end a session

### Chat Routes

- `GET /api/chat/token?sessionId=...` - get a Stream token for a valid active session

### Code Execution Route

- `POST /api/code/execute` - execute submitted code for a supported language

### Health Route

- `GET /health` - backend health check

## Prerequisites

Before running the project locally, make sure you have:

- Node.js 18 or newer
- npm
- MongoDB connection string
- Docker Desktop or Docker Engine
- Clerk application keys
- Stream API credentials
- Inngest keys if you want background/event functionality enabled

## Installation

Clone the repository and install dependencies for both apps.

```bash
git clone https://github.com/AbishekM-005/InterviewForge.git
cd InterviewForge
npm install --prefix backend
npm install --prefix frontend
```

## Environment Variables

Create a `.env` file inside `backend/` and another inside `frontend/`.

### `backend/.env`

```env
PORT=5001
NODE_ENV=development
DB_URL=your_mongodb_connection_string
CLIENT_URL=http://localhost:5173

CODE_EXECUTION_RUNNER=docker
CODE_EXECUTION_TIMEOUT_MS=20000
CODE_EXECUTION_MAX_CODE_SIZE=20000
CODE_EXECUTION_RATE_LIMIT_MAX=30
CODE_EXECUTION_RATE_LIMIT_WINDOW_MS=60000

PISTON_API_URL=http://localhost:2000/api/v2
PISTON_AUTH_HEADER=
PISTON_AUTH_TOKEN=

INNGEST_EVENT_KEY=your_inngest_event_key
INNGEST_SIGNING_KEY=your_inngest_signing_key

STREAM_API_KEY=your_stream_api_key
STREAM_API_SECRET=your_stream_api_secret

CLERK_SECRET_KEY=your_clerk_secret_key
CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
```

Notes:

- `CLIENT_URL` can be a comma-separated list in production if you need multiple allowed origins.
- `CODE_EXECUTION_RUNNER` defaults to `docker`.
- `PISTON_*` values are optional unless you switch back to a Piston-based runner.
- Clerk middleware expects valid Clerk server-side credentials in the backend environment.

### `frontend/.env`

```env
VITE_API_URL=http://localhost:5001/api
VITE_STREAM_API_KEY=your_stream_api_key
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
```

## Running the App Locally

Start the backend and frontend in separate terminals.

### Backend

```bash
npm run dev --prefix backend
```

### Frontend

```bash
npm run dev --prefix frontend
```

Default local URLs:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5001`

## Available Scripts

### Root

```bash
npm run build
npm run start
```

### Frontend

```bash
npm run dev --prefix frontend
npm run build --prefix frontend
npm run lint --prefix frontend
npm run preview --prefix frontend
```

### Backend

```bash
npm run dev --prefix backend
npm run start --prefix backend
```

## Docker Code Execution

InterviewForge now uses a backend Docker runner by default.

### Supported languages

- JavaScript via `node:18-alpine`
- Python via `python:3.12-alpine`
- Java via `eclipse-temurin:17-jdk`

### Security controls

- No outbound network access inside execution containers
- Read-only root filesystem
- `tmpfs` work directories
- CPU, memory, and PID limits
- Dropped Linux capabilities
- `no-new-privileges`
- Auth-protected execution route
- Rate limiting on execution requests

### Notes

- The first Python or Java run may take longer while Docker pulls the runtime image.
- If image preparation takes too long, the backend returns a friendly retry message instead of raw Docker pull output.
- Java submissions do not have to be named `Main`; the backend detects the class name automatically.

## Production Build

Build the frontend:

```bash
npm run build --prefix frontend
```

Start the backend in production mode:

```bash
npm run start --prefix backend
```

The repository root also includes:

```bash
npm run build
npm run start
```

## Deployment Notes

### Frontend

- Deploy `frontend/` as a static site
- Build command:

```bash
npm install && npm run build
```

- Publish directory:

```bash
dist
```

### Backend

- Deploy `backend/` as a Node web service
- Start command:

```bash
npm run start
```

- Make sure the host can reach MongoDB, Clerk, and Stream
- Docker execution requires Docker access on the backend host

### Important production requirements

- Set `NODE_ENV=production`
- Set `CLIENT_URL` to your frontend domain
- Provide Clerk and Stream production credentials
- Make sure Docker is available if `CODE_EXECUTION_RUNNER=docker`

## Security Notes

- Backend routes for sessions, chat tokens, and code execution require authentication
- CORS is restricted using `CLIENT_URL`
- Code execution is validated and size-limited before running
- Execution is not exposed directly from the frontend to a public runtime
- Stream tokens are only issued to valid session members

## Troubleshooting

### Clerk errors

- Confirm `CLERK_SECRET_KEY` exists in `backend/.env`
- Confirm `VITE_CLERK_PUBLISHABLE_KEY` exists in `frontend/.env`
- Restart both dev servers after changing env files

### Stream connection issues

- Confirm `STREAM_API_KEY` and `STREAM_API_SECRET` are valid in the backend
- Confirm `VITE_STREAM_API_KEY` matches the same Stream app in the frontend

### Code execution issues

- Make sure Docker is installed and running
- Verify the backend process can execute the `docker` command
- First-run delays for Python and Java are normal while images are pulled

### CORS errors

- Confirm the frontend origin is included in `CLIENT_URL`
- In development, `localhost:5173` and `127.0.0.1:5173` are allowed automatically

## Current Quality Improvements

The codebase already includes several improvements:

- Auth protection on code execution
- Hardened Docker runner
- Smarter frontend query defaults
- Route-level lazy loading
- Improved screen sharing behavior
- Multi-language starter code coverage for the problem library

## License

This project is currently published without a dedicated open-source license file. Add one if you plan to distribute or accept outside contributions.
