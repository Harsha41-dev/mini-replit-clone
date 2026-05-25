# Mini Replit Clone

Mini Replit Clone is a browser-based IDE inspired by Replit. It lets users create projects, edit files, run code, preview HTML pages, manage file history, and use a terminal directly from the browser.

Built with Express, TypeScript, React, SQLite, and Monaco Editor, the project includes authentication, project management, file operations, code execution, version history, and a full React frontend.

## Features

- Signup, login, logout, and cookie-based sessions
- Separate projects for each user
- Project templates for Node.js, Python, and HTML/CSS/JavaScript
- File explorer for browsing project files
- Create, edit, save, rename, duplicate, delete, upload, and download files
- Export a whole project as a ZIP
- Save and restore file versions
- Run JavaScript and Python files
- Preview HTML files in the app
- Use a WebSocket-powered terminal for common project commands
- Store users, projects, and file history in SQLite

## Tech Stack

- Backend: Express, TypeScript, Zod, SQLite
- Frontend: React, Vite, Monaco Editor
- Terminal: WebSocket
- Optional runner sandbox: Docker

## Folder Overview

```text
src/
  controllers/    handles API requests
  database/       SQLite setup
  middlewares/    auth and error handling
  repositories/   database queries
  routers/        API routes
  services/       main business logic
  validators/     request validation

frontend/
  src/
    api/          API client
    components/   React components
    utils/        helper functions

public/           built frontend files
data/             local database and saved project files
```

## Running The Project

Install packages:

```bash
npm install
```

Build everything:

```bash
npm run build
```

Start the dev server:

```bash
npm run dev
```

Open the app at:

```text
http://localhost:3001
```

To run the built app:

```bash
npm start
```

## Environment Variables

You can create a local `.env` file from the example:

```bash
cp .env.example .env
```

Example config:

```text
PORT=3001
AUTH_SECRET=change-this-secret-before-demo
RUNNER_MODE=auto
NODE_RUNNER_IMAGE=node:20-alpine
PYTHON_RUNNER_IMAGE=python:3.12-alpine
```

`RUNNER_MODE` decides how user code is executed:

- `auto` uses Docker if it is available, otherwise it falls back to local Node/Python
- `docker` only runs code through Docker
- `local` only uses the local Node/Python installation

## Docker

The app can also be started with Docker Compose:

```bash
docker compose up --build
```

The compose setup keeps app data inside `./data`. It can also mount the Docker socket, which is needed if the app container should start runner containers.
