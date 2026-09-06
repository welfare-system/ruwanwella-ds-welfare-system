# 🚀 100% Free Cloud Deployment Guide ($0.00 / Month)

A complete, production-ready guide to deploying the **Staff Welfare Management System** to the cloud with **zero monthly costs**, using:
- 🐘 **[Neon](https://neon.tech/)** (Free Serverless PostgreSQL Database - 0.5 GiB, autoscaling, no credit card required)
- ⚡ **[Render](https://render.com/)** (Free Express Node.js Web Service - permanent public HTTPS URL, no credit card required)
- ▲ **[Vercel](https://vercel.com/)** (Free Next.js Frontend Hosting - global CDN edge network, no credit card required)

---

## 📐 100% Free Cloud Architecture & Public URLs

```
 ┌────────────────────────────────────────────────────────────────────────┐
 │                           CLIENT BROWSER                               │
 │         Desktop / Tablet / Smartphone (Sinhala UI & Rs. LKR)           │
 └───────────────────┬───────────────────────────────▲────────────────────┘
                     │                               │
                     │ HTTPS                         │ API JSON Requests
                     │ (Next.js 15+ App Router)      │ (Bearer JWT Tokens)
                     ▼                               │
 ┌──────────────────────────────────────┐ ┌──────────┴────────────────────┐
 │       ▲ VERCEL (Free Hobby)          │ │     ⚡ RENDER (Free Tier)     │
 │  • Public: https://[app].vercel.app  │ │  • Public: https://[api].onrender.com
 │  • Next.js App Router (Turbopack)    │ │  • Express 4 API Web Service  │
 │  • lib/api.ts Centralized Resolver   │ │  • Dynamic CORS (Vercel allow)│
 │  • Cold-Start Graceful Notice        │ │  • 0.0.0.0 Binding & Health   │
 └──────────────────────────────────────┘ └──────────┬────────────────────┘
                                                     │
                                                     │ Pooled PostgreSQL
                                                     │ Connection (SSL)
                                                     ▼
                                          ┌───────────────────────────────┐
                                          │     🐘 NEON (Free Tier)       │
                                          │  • ep-[id].region.neon.tech   │
                                          │  • PostgreSQL 16+ Serverless  │
                                          │  • Auto-table init & seeding  │
                                          └───────────────────────────────┘
```

---

## 📋 Cloud Architecture Options

You can deploy the Staff Welfare Management System using either of two 100% free deployment architectures:

### 🌟 Option A: 1-Click All-in-One Vercel Fullstack (RECOMMENDED)
Deploy **both** the Next.js frontend and the Express backend as a **single unified project on Vercel**!
- **Zero Cold Starts**: Serverless functions wake in ~50ms (unlike container spin-down delays).
- **Zero CORS Issues**: Frontend & Backend share the same domain (`https://[app].vercel.app`).
- **Zero External Bots**: No keep-alive pingers or background cron jobs required.
- **Single Setup**: Just connect your repository to Vercel and paste your `DATABASE_URL`.

| Component | Platform | Free Tier | Public Live URL | Setup Time |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend + Backend API** | **Vercel** | Hobby (Free) | `https://[app-name].vercel.app` | **~2 Minutes** |
| **Database** | **Neon** | Serverless Free | `ep-[pooler].neon.tech` | **~1 Minute** |

---

### ⚡ Option B: Decoupled Multi-Service (Vercel + Render / Railway)
Deploy the Next.js frontend on Vercel and the Express backend in a container on Render or Railway.

| Component | Platform | Free Tier | Public Live URL | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend** | **Vercel** | Hobby (Free) | `https://[app].vercel.app` | Global edge CDN |
| **Backend** | **Render / Railway** | Free Web Service | `https://[api].onrender.com` | Requires keep-alive ping on Render |
| **Database** | **Neon** | Serverless Free | `ep-[pooler].neon.tech` | AWS US-East-2 co-located |

---

## 🐘 Step 1: Provision Neon PostgreSQL (Free Database)

1. Go to **[console.neon.tech](https://console.neon.tech/)** and sign up for free (using GitHub or Google).
2. Click **Create Project**:
   - **Project Name**: `welfare-db`
   - **Region**: Choose the region closest to your users (e.g. *Singapore `ap-southeast-1`* for Asia or *US East*).
   - **Postgres Version**: 16 (default).
3. In your Neon Project Dashboard, look at the **Connection Details** card:
   - Ensure **Pooled connection** is selected.
   - Copy the connection string. It has this format:
     ```
     postgresql://[username]:[password]@[ep-xyz.region.neon.tech]/neondb?sslmode=require
     ```
4. **Save this connection string** as your `DATABASE_URL`.
   > 💡 **Auto-Init**: You do not need to run manual SQL migrations! On initial connection, the Express backend automatically executes `CREATE TABLE IF NOT EXISTS` for all 6 tables and populates default members, loans, contributions, transactions, settings, and demo user accounts.

---

## ⚡ Step 2: Deploy Backend to Render (Free API Service)

### Option A: Using Render Blueprints (Fastest / 1-Click Setup)

1. Log in to **[dashboard.render.com](https://dashboard.render.com/)** (Free sign-up with GitHub).
2. In the top-right corner, click **New +** -> **Blueprint**.
3. Connect your GitHub repository.
4. Render will detect the root [`render.yaml`](file:///d:/next/render.yaml) file automatically.
5. When prompted for environment variables:
   - **`DATABASE_URL`**: Paste your Neon pooled connection string from Step 1.
   - **`CLIENT_URL`**: Enter `https://your-welfare-app.vercel.app` (you can update this with your final Vercel URL).
6. Click **Apply**. Render will build and launch your backend web service.

---

### Option B: Manual Web Service Setup on Render

1. On the Render Dashboard, click **New +** -> **Web Service**.
2. Connect your GitHub repository.
3. Fill in the service configuration:
   - **Name**: `welfare-backend-api` (choose an available name)
   - **Region**: Match your Neon region (e.g. *Singapore* or *Oregon*)
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`
4. Expand **Advanced**:
   - **Health Check Path**: `/api/health`
5. Under **Environment Variables**, add the following:

| Key | Value | Notes |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Enables production caching |
| `PORT` | `5000` | Render injects this dynamically |
| `DATABASE_URL` | `postgresql://[user]:[pass]@[neon-host]/neondb?sslmode=require` | Your Neon connection string |
| `CLIENT_URL` | `https://your-app.vercel.app` | Your Vercel frontend URL |
| `JWT_SECRET` | *(Any random 64-char string)* | Token signing key |
| `JWT_EXPIRES_IN` | `24h` | Session validity duration |

6. Click **Create Web Service**.
7. Once deployed, copy your **Public Live URL**:
   ```
   https://welfare-backend-api.onrender.com
   ```
8. Verify the health check in your browser:
   `https://welfare-backend-api.onrender.com/api/health` -> should return `{"status":"ok","database":"connected"}`.

---

## ▲ Step 3: Deploy Frontend to Vercel (Free Next.js App)

1. Go to **[vercel.com](https://vercel.com/)** and log in with GitHub.
2. Click **Add New...** -> **Project**.
3. Select and import your GitHub repository.
4. In the **Configure Project** screen:
   - **Project Name**: `welfare-system` (or your preferred name)
   - **Framework Preset**: `Next.js`
   - **Root Directory**: Click **Edit** and choose `frontend` *(Mandatory)*.
5. Under **Environment Variables**, add:

| Key | Value | Example |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | Your Render Public URL | `https://welfare-backend-api.onrender.com` |

> ⚠️ **Important**: Do **not** include a trailing slash `/` at the end of the URL.

6. Click **Deploy**.
7. In ~60 seconds, Vercel will assign your permanent public live URL:
   ```
   https://welfare-system.vercel.app
   ```

---

## 🔗 Step 4: Finalize CORS on Render

1. Go back to your **Render Dashboard** -> Select your backend service.
2. Navigate to the **Environment** tab.
3. Update `CLIENT_URL` with your final live Vercel URL:
   ```
   https://welfare-system.vercel.app
   ```
4. Click **Save Changes**. Render will automatically reload with zero downtime.

> 💡 **Preview PR Deployments**: The backend's dynamic CORS policy automatically permits all Vercel preview URLs (`*.vercel.app`), so branch and pull request previews will connect seamlessly without any manual configuration!

---

## ⏱️ Step 5: Prevent Render Free Tier Sleep (100% Free Keep-Alive)

On Render's free tier, services spin down after 15 minutes of inactivity, causing a 30-second cold-start delay when accessed again. You can keep your free service always awake and responsive at $0 cost using either method:

### Option A: Free External Ping (Recommended - 2 Minutes Setup)
1. Sign up for free at **[cron-job.org](https://cron-job.org/)** or **[UptimeRobot](https://uptimerobot.com/)**.
2. Create a new monitor / cron job:
   - **URL**: `https://your-backend.onrender.com/api/health`
   - **Interval**: Every `10 minutes`
3. This sends a lightweight ping to `/api/health` around the clock, keeping your free Render instance active with 0s latency!

### Option B: Built-in GitHub Actions Workflow
This repository includes an automated keep-alive workflow:
- Path: [`.github/workflows/render-keepalive.yml`](file:///d:/next/.github/workflows/render-keepalive.yml)
- How to enable: Go to **GitHub Repository Settings** -> **Secrets and variables** -> **Actions** -> Add Secret `RENDER_BACKEND_URL` with value `https://your-backend.onrender.com`.

---

## 🧪 Step 6: Smoke Test Your Live Cloud System

- [ ] **1. Backend Health**: Open `https://your-backend.onrender.com/api/health` in your browser. Verify `"status":"ok"` and `"database":"connected"`.
- [ ] **2. Frontend Live App**: Open `https://your-frontend.vercel.app`. Verify that the Sinhala interface, currency figures in `Rs.`, and header `🟢 වලාකුළු සක්‍රියයි` pill appear.
- [ ] **3. Admin Login**: Click **🛡️ පද්ධති පරිපාලක** (1-Click Demo) or enter:
  - **Email**: `admin@welfare.org`
  - **Password**: `AdminPassword123!`
  - Verify that the Dashboard Summary and Member list populate from your Neon database.
- [ ] **4. Member Self-Service**: Log out and click **👤 Marcus Thorne** (1-Click Demo) or enter:
  - **Email**: `marcus.thorne@org.internal`
  - **Password**: `MemberPassword123!`
  - Verify access is restricted to Marcus's personal contributions and loan records.
- [ ] **5. Add Transaction / Member**: Record a new income, expense, or member. Refresh the browser to confirm persistent storage in your Neon PostgreSQL database.
