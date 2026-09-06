# 🛠️ Welfare Management System - Backend API Service

A modular, production-ready Express.js REST API with **Neon PostgreSQL** integration using `pg`, JWT session authentication with `bcryptjs`, dynamic CORS allowlisting, and automated database schema creation and seeding.

---

## 📦 Features & Modules

- **Database**: Neon Serverless PostgreSQL with connection pooling (`pg.Pool`) and SSL support.
- **Auto-Initialization**: Automatically creates all 6 relational tables (`members`, `loans`, `contributions`, `transactions`, `users`, `system_settings`) and seeds realistic default data on first startup.
- **Security & CORS**:
  - `trust proxy` enabled for cloud load balancers (Render, AWS, Heroku).
  - Dynamic CORS allowlist supporting `localhost`, custom `CLIENT_URL`, and regex matching for Vercel preview environments (`/\.vercel\.app$/`).
- **Graceful Lifecycle**: Handles `SIGTERM` / `SIGINT` signals and cleanly closes HTTP and database pools.

---

## 📡 REST API Endpoints

### 1. Health & Diagnostics
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Public | System status, database health, uptime, and version |
| `GET` | `/` | Public | Root API welcome message & endpoints catalog |

### 2. Authentication (`/api/auth`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Public | Authenticate user credentials & issue JWT token |
| `GET` | `/api/auth/me` | Authenticated | Retrieve current user profile & mapped member record |
| `POST` | `/api/auth/logout` | Public | Terminate active session |

### 3. Members Management (`/api/members`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/members` | Authenticated | List members with `search`, `department`, and `status` filters |
| `GET` | `/api/members/:id` | Authenticated | Detailed member profile with linked loans & contributions |
| `POST` | `/api/members` | Admin Only | Register a new member |
| `PUT` | `/api/members/:id` | Admin Only | Update member details & status |
| `DELETE` | `/api/members/:id` | Admin Only | Remove a member |

### 4. Loans Management (`/api/loans`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/loans` | Authenticated | List loans with `status`, `memberId`, and `search` filters |
| `GET` | `/api/loans/:id` | Authenticated | Retrieve single loan record details |
| `POST` | `/api/loans` | Authenticated | Submit a new loan application |
| `PATCH` | `/api/loans/:id/status` | Admin Only | Change loan status (`Pending`, `Approved`, `Active`, `Rejected`) |
| `POST` | `/api/loans/:id/pay` | Authenticated | Record repayment installment against loan |

### 5. Contributions Tracking (`/api/contributions`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/contributions` | Authenticated | List contribution receipts with filters |
| `POST` | `/api/contributions` | Authenticated | Record monthly contribution and auto-update member balance |

### 6. Incomes & Expenses (`/api/finance`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/finance/summary` | Authenticated | Aggregate incomes, expenses, net surplus, and category totals |
| `GET` | `/api/finance/transactions` | Authenticated | Filterable audit ledger of all vouchers |
| `GET` | `/api/finance/transactions/:id` | Authenticated | Specific transaction record |
| `POST` | `/api/finance/transactions` | Authenticated | Record new income (`INC-2026-XXX`) or expense (`EXP-2026-XXX`) |
| `DELETE` | `/api/finance/transactions/:id` | Admin Only | Delete an existing transaction record |

### 7. Fund Analytics & Preferences (`/api/fund`, `/api/settings`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/fund/summary` | Public | Real-time cash pool calculation and audit totals |
| `GET` | `/api/settings/system` | Public | Retrieve active organization preferences & currency |
| `PUT` | `/api/settings/system` | Admin Only | Update default rates & loan limits |
| `PUT` | `/api/settings/profile` | Authenticated | Update user profile and sync with member profile |
| `PUT` | `/api/settings/password` | Authenticated | Change user password with current password verification |

---

## ⚙️ Environment Variables

```ini
# Server Port (Render sets this dynamically)
PORT=5000

# Environment Mode
NODE_ENV=development

# Allowed Frontend Origins (comma-separated for multiple domains)
CLIENT_URL=http://localhost:3000

# Neon PostgreSQL Pooled Connection String
DATABASE_URL=postgresql://[user]:[password]@[ep-xyz.neon.tech]/neondb?sslmode=require

# JWT Token Configuration
JWT_SECRET=super_secret_welfare_jwt_key_2026_secure
JWT_EXPIRES_IN=24h
```

---

## 💻 Scripts

```bash
# Start server in production mode
npm start

# Start server in development watch mode
npm run dev

# Verify cloud configuration and database connectivity
node scripts/verify-cloud-env.js
```
