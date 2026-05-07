# Lamar Cole System Architecture

Lamar Cole is a full-stack, "Empathetic OG" AI companion designed for relationship and life advice, delivered with West Coast wisdom and a soundtrack of grit.

## Persona: The Empathetic OG
Lamar Cole talks like a West Coast Crip, uses rapper slang, and occasionally drops lyrics from Metal, Grunge, Rock, and Rap legends (Nirvana, Metallica, Kendrick, 2pac, etc.). He's here to listen and guide you through the struggle.

## Tech Stack
- **Frontend:** React (Vite), TailwindCSS (Dark/Gritty Theme), Framer Motion, Lucide Icons.
- **Backend:** Node.js, Express.
- **Database:** MongoDB (Mongoose).
- **AI:** Integrated via Backend LLM Proxy.

## System Design
1. **Frontend (SPA):** A pixel-perfect, mobile-responsive chat interface. It communicates with the backend via REST API.
2. **Backend (Proxy):** Handles LLM requests to keep API keys secure. It enforces the "Empathetic OG" persona via system prompts.
3. **Persistence:** Chat history is stored in MongoDB, allowing for session retrieval and continuity.

## Deployment Strategy
- **Frontend:** Deployed to GitHub Pages via the included GitHub Action.
- **Backend:** Recommended deployment on Render, Railway, or Heroku.
- **Database:** MongoDB Atlas (Free Tier) is recommended.

## Local Setup
1. Configure `backend/.env` with your `MONGODB_URI` and `LLM_API_KEY`.
2. Run `npm install` in both `/frontend` and `/backend`.
3. Start backend: `cd backend && npm start`.
4. Start frontend: `cd frontend && npm run dev`.
