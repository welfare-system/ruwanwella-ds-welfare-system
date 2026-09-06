# 🏛️ Staff Welfare Management System (සුබසාධක අරමුදල් කළමනාකරණ පද්ධතිය)

A modern, production-grade fullstack web application designed for organizational staff welfare associations. Built with a **Next.js** frontend, an **Express.js** backend, and a **Neon Serverless PostgreSQL** database, featuring 100% Sinhala (`si`) default UI, strict Sri Lankan Rupees (`Rs.`) financial calculations, mobile responsiveness, and 100% free cloud deployment readiness (Vercel + Render).

---

## ✨ Features & Capabilities

1. **📊 අරමුදල් දළ විශ්ලේෂණය (Fund Overview & Cash Flow Accounting)**:
   - Dynamic real-time cash pool calculation:
     $$\text{Cash Pool} = \text{Initial Reserve} + \text{Contributions} + \text{Repayments} + \text{Other Income} - \text{Disbursed Loans} - \text{Expenses}$$
   - Key audit metrics: Total cash reserves, loan repayments, outstanding debts, and external welfare balances.
2. **👥 සාමාජික කළමනාකරණය (Member Management)**:
   - Searchable and filterable members directory by department and status.
   - Comprehensive profiles tracking monthly dues, cumulative contributions, and linked loans.
   - Member registration and profile editing modals.
3. **💳 ණය පහසුකම් කළමනාකරණය (Loan Facilities & Repayments)**:
   - Automated monthly EMI and simple interest calculators.
   - 5-stage approval workflow (`Pending` ➔ `Approved` ➔ `Active` ➔ `Fully Repaid` / `Rejected`).
   - Loan repayment tracking with automatic principal reduction and next-due date adjustments.
4. **📑 දායකත්ව ලේඛනය (Contributions Tracking)**:
   - Automatic receipt generation (`REC-9000+`).
   - Tracks payroll deductions, direct bank transfers, and cash receipts.
   - Atomic database increment of each member's total contributed balance.
5. **💰 ආදායම් සහ වියදම් කළමනාකරණය (Income & Expense Tracking)**:
   - **ආදායම් (Incomes)**: ශාලා කුලිය (Hall rent), වෙළඳසැල් කුලිය (Shop rent), විශේෂ පරිත්‍යාග (Donations), අරමුදල් පොලිය (Interest).
   - **වියදම් (Expenses)**: මරණාධාර (Funeral aid), ක්‍රීඩා කටයුතු (Sports), ආගමික උත්සව (Festivals), නඩත්තු (Maintenance), පරිපාලන වියදම් (Admin).
   - Dynamic voucher numbering (`INC-2026-XXX` and `EXP-2026-XXX`).
6. **🔒 කාර්යභාර මත පදනම් වූ පිවිසුම (Role-Based JWT Authentication)**:
   - **පද්ධති පරිපාලක (Admin)**: Full administrative control, member approval, loan disbursements, and settings.
   - **සාමාජික (Member)**: Personalized self-service portal restricted to individual loan balances and receipts.
   - Passwords securely hashed with `bcryptjs`.
7. **⚙️ පද්ධති සැකසුම් (System Settings & Language)**:
   - 100% Sinhala (`si`) interface with a 1-click English (`en`) toggle.
   - Locked strictly to Sri Lankan Rupees (`Rs.` / `LKR`).
   - Configurable contribution rates and loan limits.
8. **📱 ජංගම දුරකථන සඳහා ප්‍රශස්තකරණය (Mobile Responsive)**:
   - Touch-friendly horizontal swipe tabs.
   - Bottom-sheet modals and full-width touch targets.
   - Mobile table swipe hints and compact vertical stacks.

---

## 🏗️ Architecture & Tech Stack

```
 ┌─────────────────────────────────────────────────────────────┐
 │                    CLIENT BROWSER                           │
 │         Desktop / Tablet / Smartphone (Sinhala UI)          │
 └──────────────┬───────────────────────────────▲──────────────┘
                │                               │
                │ HTTPS (Next.js SSR / Static)  │ JSON API Requests
                ▼                               │ (Bearer Token / JWT)
 ┌──────────────────────────────┐ ┌─────────────┴──────────────┐
 │     ▲ VERCEL (Frontend)      │ │     ⚡ RENDER (Backend)     │
 │  • Next.js 15+ App Router    │ │  • Express 4 API Service    │
 │  • Vanilla CSS Design System │ │  • Dynamic Cloud CORS       │
 │  • Centralized lib/api.ts    │ │  • Reverse Proxy Trust      │
 │  • Cold-start status banner  │ │  • 0.0.0.0 Port Binding     │
 └──────────────────────────────┘ └─────────────┬──────────────┘
                                                │
                                                │ Pooled Connection (SSL)
                                                ▼
                                 ┌──────────────────────────────┐
                                 │     🐘 NEON (PostgreSQL)     │
                                 │  • Serverless Database       │
                                 │  • Auto-table init & seeding │
                                 │  • pg Connection Pool        │
                                 └──────────────────────────────┘
```

- **Frontend**: Next.js 15+ (App Router, Turbopack, TypeScript), Vanilla CSS design system (Glassmorphism, Obsidian Dark palette).
- **Backend**: Express.js 4, `cors`, `dotenv`, `jsonwebtoken`, `bcryptjs`.
- **Database**: Neon Serverless PostgreSQL with `pg` connection pooling.
- **Cloud Hosting**: Vercel (Frontend, Free Hobby) + Render (Backend, Free Web Service).

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- Node.js 18+ installed.
- Optional: Neon PostgreSQL connection string (or run in local fallback mode).

### 2. Install Dependencies
```bash
# Install both backend and frontend dependencies
npm run install:all
```

### 3. Configure Environment Variables

**Backend (`backend/.env`)**:
```ini
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000
JWT_SECRET=super_secret_welfare_jwt_key_2026_secure
JWT_EXPIRES_IN=24h
# Optional: Neon PostgreSQL connection string
DATABASE_URL=
```

**Frontend (`frontend/.env.local`)**:
```ini
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### 4. Run Development Servers
In separate terminals or using the root scripts:

```bash
# Terminal 1: Start Backend (Port 5000)
npm run dev:backend

# Terminal 2: Start Frontend (Port 3000)
npm run dev:frontend
```

- **Frontend Application**: [http://localhost:3000](http://localhost:3000)
- **Backend Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## ⚡ Demo Accounts (1-Click Login)

| Role | Email | Password | Access Privileges |
| :--- | :--- | :--- | :--- |
| **🛡️ System Administrator** | `admin@welfare.org` | `AdminPassword123!` | Full control over members, loans, finance, settings |
| **👤 Member Self-Service** | `marcus.thorne@org.internal` | `MemberPassword123!` | Marcus Thorne's personal loans, balance & receipts |
| **👤 Chairperson** | `evelyn.vance@org.internal` | `MemberPassword123!` | Dr. Evelyn Vance's profile & contributions |

---

## 🌐 100% Free Cloud Deployment

This project includes complete Infrastructure-as-Code files for zero-cost deployment:
- [`render.yaml`](file:///d:/next/render.yaml) - 1-click Render backend deployment blueprint.
- [`vercel.json`](file:///d:/next/vercel.json) - Vercel Next.js deployment configuration.
- [`.github/workflows/render-keepalive.yml`](file:///d:/next/.github/workflows/render-keepalive.yml) - Free GitHub Actions cron keeping Render active.
- [`DEPLOYMENT.md`](file:///d:/next/DEPLOYMENT.md) - Complete step-by-step deployment guide for Neon, Render, and Vercel.

To verify your cloud configuration before deploying:
```bash
node backend/scripts/verify-cloud-env.js
```
