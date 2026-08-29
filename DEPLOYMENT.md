# 🚀 BizClear Deployment Guide

This guide covers deploying BizClear to **Vercel** (Frontend) and **Render / Railway** (Backend), along with Supabase and Gemini AI configuration.

---

## 1. Prerequisites & Environment Setup

Ensure you have your external service credentials ready:
- **Supabase Project URL & Keys** (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`)
- **Google Gemini API Key** (`GEMINI_API_KEY`)

---

## 2. Deploying Backend on Render / Railway

### Option A: Render (Recommended)

1. Go to [Render Dashboard](https://dashboard.render.com/) and click **New +** -> **Web Service**.
2. Connect your GitHub repository.
3. Configure the service settings:
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
4. Under **Environment Variables**, add:
   - `NODE_ENV`: `production`
   - `PORT`: `10000`
   - `SUPABASE_URL`: `https://<your-project>.supabase.co`
   - `SUPABASE_ANON_KEY`: `<your-supabase-anon-key>`
   - `SUPABASE_SERVICE_ROLE_KEY`: `<your-supabase-service-role-key>`
   - `GEMINI_API_KEY`: `<your-gemini-api-key>`
   - `JWT_SECRET`: `<a-strong-random-string>`
   - `FRONTEND_URL`: `https://<your-vercel-domain>.vercel.app,http://localhost:5173`
5. Click **Create Web Service**.
6. Copy your deployed backend URL (e.g., `https://bizclear-api.onrender.com`).

---

### Option B: Railway

1. Go to [Railway Dashboard](https://railway.app/) and click **New Project** -> **Deploy from GitHub repo**.
2. Set **Root Directory** to `/backend`.
3. In **Variables**, add the same environment variables as listed above.
4. Generate a public domain under **Settings -> Networking**.

---

## 3. Deploying Frontend on Vercel

1. Go to [Vercel Dashboard](https://vercel.com/new) and import your Git repository.
2. Under **Project Settings**:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend` (Click Edit and choose `frontend`)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Under **Environment Variables**, add:
   - `VITE_SUPABASE_URL`: `https://<your-project>.supabase.co`
   - `VITE_SUPABASE_ANON_KEY`: `<your-supabase-anon-key>`
   - `VITE_API_URL`: `https://<your-backend-url>.onrender.com` (Your deployed backend URL without trailing slash)
4. Click **Deploy**.
5. Once deployed, copy your Vercel URL and ensure it is included in your backend's `FRONTEND_URL` environment variable.

---

## 4. Health Check Verification

Once both services are deployed:
- **Backend**: Visit `https://<your-backend-url>/health` (should return `{ "status": "ok", ... }`)
- **Frontend**: Visit `https://<your-vercel-app>.vercel.app` (test authentication, entrepreneur roadmap, officer portal, and AI features)
