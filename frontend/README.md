# GameMatch frontend

Astro + React + Tailwind v4 frontend for the FastAPI game recommender.
Based on the Dark Minimal template (MIT) by Andres Hernandez.

## Run (development)

1. Start the backend on port 8000:   `uvicorn main:app --reload --port 8000`
2. In this folder:                   `npm install` then `npm run dev`
3. Open http://localhost:4321

The dev server proxies `/api/*` to `http://localhost:8000/*` (so `/api/games` -> `/games`).
Change the target with the `BACKEND_URL` environment variable.

## Production

`npm run build` creates `dist/`. If the API lives on another domain, set
`PUBLIC_API_URL=https://api.example.com` (see `.env.example`) before building and
add your site's address to `allow_origins` in the backend's CORS settings.
