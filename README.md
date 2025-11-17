# MAKFR — Reviewer & Application Dashboard

This repository contains a small full-stack demo: a Node/Express server that manages application reviews and a React + Vite client with a Reviewer Dashboard UI.

This README explains how to run the project locally, where the important files are, and how to tweak the visual styles (the dashboard uses a grayscale design).

Made for local development. Keep secret keys out of version control.

If you need any help with environment setup or authentication (env vars, Firebase, API keys) please contact @altronxs or email kyleboy1010@gmail.com — they can provide the required credentials and guidance.

## Repo layout

- `server/` — Express API, file uploads, and AI + Firebase wiring. Run the server from here.
- `client/` — React + Vite frontend. The Reviewer Dashboard UI lives under `client/src/ReviewerDashboard.tsx` and styles are in `client/src/ReviewerDashboard.css`.
- `uploads/` — (server) directory used for uploaded resumes/files.

## Prerequisites

- Node.js (v18+ recommended)
- npm (comes with Node.js)

All commands below assume you're on Windows PowerShell (the repo owner uses PowerShell). Use a different shell if you prefer.

## Install dependencies

Open two terminals (or one at a time) and run:

PowerShell (server):

```powershell
cd server
npm install
```

PowerShell (client):

```powershell
cd client
npm install
```

## Environment

The server uses environment variables. Create or edit `server/.env` if present and provide any required keys. The project also includes a Firebase admin JSON at `server/makfr-hacc-firebase-adminsdk-fbsvc.json` — keep that secure and do not commit secrets to public repos.

## Run locally

Start the server (from `server/`):

```powershell
cd server
npm start
```

Start the client (from `client/`):

```powershell
cd client
npm run dev
```

The Vite dev server will print a localhost URL (usually `http://localhost:5173`). The client expects the API at `/api/...` so either run the server on the same host and port via a proxy or use the server's base URL (the client fetches relative paths by default).

## Key files and where to make changes

- Frontend UI: `client/src/ReviewerDashboard.tsx`

  - Selected application panel and the review form are here.
  - We moved inline styles into `client/src/ReviewerDashboard.css` and added readable classnames for hierarchy (e.g. `.rd-ai-review__decision`, `.rd-field__label`).

- Frontend styles: `client/src/ReviewerDashboard.css`

  - This file defines color variables and the grayscale theme. Edit font sizes and spacing here for global changes.

- Server: `server/server.js`
  - Express routes for reviewer endpoints live here. Typical endpoints used by the UI:
    - `GET /api/reviewer/stats` — summary counts
    - `GET /api/reviewer/applications` — list of job applications
    - `GET /api/reviewer/reviews` — existing AI/human reviews
    - `PUT /api/reviewer/finalize/:appId` — finalize a review

## Notes about styling and hierarchy

- The dashboard uses only black / white / gray tones for a clean, high-contrast look. If you want to change sizes or color shades, open `client/src/ReviewerDashboard.css` and modify the `--` variables near the top (for example `--muted`, `--card`).
- We added semantic classnames to make the visual hierarchy clearer. Prefer editing the CSS instead of sprinkling inline styles in the component.

## Troubleshooting

- If the client cannot reach the API, confirm the server is running and that CORS is allowed. By default the server uses `express` and `cors`.
- If node fails to start in `server/`, run `node server.js` directly to see errors. Check the `.env` and the Firebase admin JSON file if relevant.

## Development tips

- When editing styles, refresh the Vite page — hot module replacement (HMR) will usually update the UI instantly.
- To test finalize flow quickly, the dashboard has a "Quick" button which calls `PUT /api/reviewer/finalize/:appId` with default payload (see `client/src/ReviewerDashboard.tsx`).

## Contact / next steps

If you want, I can:

- Move more styles into CSS variables for theming
- Add a small CONTRIBUTING section or development scripts
- Add a sample `.env.example` showing required env keys

---


