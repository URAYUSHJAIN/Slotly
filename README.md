# Slotly — Seamless Healthcare Scheduling

A full-stack web platform for booking healthcare appointments. Patients 
browse doctors and book slots; doctors manage their schedules and approve 
or reject appointment requests.

🌐 **Live:** [slotly.vercel.app](https://slotly.vercel.app) &nbsp;|&nbsp; 📦 **Repo:** [github.com/URAYUSHJAIN/Slotly](https://github.com/URAYUSHJAIN/Slotly)

🚧 **Work in progress** — this project is being built for a coding 
assessment. Full screenshots and feature list coming soon.

## Tech Stack

- **Frontend:** React (Vite) + Tailwind CSS v4 + React Router
- **Auth:** Neon Auth (`@neondatabase/neon-js`)
- **API:** Neon Data API (REST endpoints auto-generated from the database)
- **Database:** Neon (PostgreSQL 17) with Row Level Security
- **Deployment:** Vercel

## Local Setup

```bash
git clone https://github.com/URAYUSHJAIN/Slotly.git
cd Slotly/client
npm install
cp .env.example .env.local
# Fill in VITE_NEON_AUTH_URL and VITE_NEON_DATA_API_URL from your Neon console
npm run dev
```

App runs at http://localhost:5173
