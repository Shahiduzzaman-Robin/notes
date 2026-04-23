# Productivity App

A full-stack, modern note-taking and productivity web application.

## Tech Stack
- Frontend: Next.js (React), Zustand, Framer Motion, Vanilla CSS (Glassmorphism design)
- Backend: Node.js, Express, MongoDB
- Authentication: JWT

## Running Locally

1. **Start the database**
   Ensure MongoDB setup is running locally on port 27017.

2. **Start Backend**
   ```bash
   cd backend
   npm install
   npm run dev
   ```

3. **Start Frontend**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## Deployment Notes
- Build frontend to static or deploy to Vercel.
- Deploy backend to render.com or Heroku.
- Setup MongoDB Atlas for DB hosting.
- Provide `JWT_SECRET` and `MONGO_URI` environment variables in production.
