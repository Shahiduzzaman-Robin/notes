# Notes by Robin (Life OS)

A high-performance, modern productivity and financial tracking application built with a unified Next.js architecture. Featuring glassmorphism design, real-time sync, and AI-powered note organization.

## 🚀 Key Features
- **Smart Note Taking**: Tiptap-based editor with PDF export and auto-save.
- **Workflow Tracker**: Kanban-style board for project management with drag-and-drop.
- **Personal Finance**: Transaction ledger with daily/monthly filtering and 50-day performance mode.
- **Unified API**: Serverless architecture using Next.js App Router.
- **Rich Aesthetics**: Premium glassmorphism UI with smooth animations.

## 🛠️ Tech Stack
- **Framework**: Next.js 16 (React 19)
- **State Management**: Zustand
- **Database**: MongoDB (Mongoose)
- **Styling**: Vanilla CSS (Custom Glassmorphism)
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **AI**: Google Gemini API

## 💻 Running Locally

1. **Environment Setup**
   Create a `frontend/.env.local` file with the following:
   ```env
   MONGO_URI=your_mongodb_uri
   JWT_SECRET=your_jwt_secret
   GEMINI_API_KEY=your_gemini_key
   ```

2. **Start the Application**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

3. **Access the App**
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🏗️ Architecture
The project has been migrated from a dual-server setup to a unified Next.js App Router architecture. All API endpoints are located in `frontend/src/app/api` and handle database interactions directly via Serverless functions.

## 📄 Deployment
The application is optimized for deployment on **Vercel**. Simply push the `frontend` directory (or the root if configured) to Vercel and provide the environment variables.
