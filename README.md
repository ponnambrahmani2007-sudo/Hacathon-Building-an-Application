# WorkFlow — AI-Powered Employee Accountability & Task Management

> **Hackathon Project** | Full-Stack Web Application | PostgreSQL · Node.js · React/Vite · Google Gemini AI · Twilio · JWT

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Architecture Overview](#3-architecture-overview)
4. [Frontend Architecture](#4-frontend-architecture)
5. [Backend Architecture](#5-backend-architecture)
6. [Database Schema & Design](#6-database-schema--design)
7. [API Reference](#7-api-reference)
8. [Authentication & Authorization](#8-authentication--authorization)
9. [AI Integration — Google Gemini](#9-ai-integration--google-gemini)
10. [SMS/Notification Integration — Twilio](#10-smsnotification-integration--twilio)
11. [Environment Configuration](#11-environment-configuration)
12. [Local Setup & Running](#12-local-setup--running)
13. [Scripts Reference](#13-scripts-reference)
14. [Security Assessment](#14-security-assessment)
15. [Known Vulnerabilities & Mitigations](#15-known-vulnerabilities--mitigations)
16. [Deployment Guide](#16-deployment-guide)
17. [Future Improvements](#17-future-improvements)
18. [Contributing](#18-contributing)

---

## 1. Project Overview

**WorkFlow** is a hackathon-built, AI-powered employee accountability and task management platform. It enables managers to create and assign tasks to employees, track work logs, generate AI-assisted productivity summaries via Google Gemini, and notify stakeholders via Twilio SMS/WhatsApp — all backed by a relational PostgreSQL database with full audit logging.

### Core Features

| Feature | Description |
|---|---|
| Role-based Access | Managers and employees have separate dashboards and permissions |
| Task Management | Create, assign, update, and complete tasks with status tracking |
| Work Logging | Employees log time and activity against tasks |
| AI Summaries | Google Gemini generates natural language productivity reports |
| SMS Alerts | Twilio sends deadline reminders and status updates via SMS |
| OTP Password Reset | Secure password reset via time-limited OTPs stored in the database |
| Audit Trail | Every significant action is recorded in `audit_logs` for accountability |
| JWT Auth | Stateless authentication with signed tokens; no server-side sessions |

### Seeded Demo Accounts

| Username | Password | Role |
|---|---|---|
| `akash` | `akash` | Manager |
| `shiva` | `shiva` | Manager |

---

## 2. Tech Stack

### Frontend
| Layer | Technology |
|---|---|
| Framework | React 18 (via Vite scaffold) |
| Build Tool | Vite 5 (dev server on `http://localhost:5173`) |
| Routing | React Router DOM v6 |
| HTTP Client | Axios (with JWT interceptors) |
| State Management | React Context API / component-level state |
| Styling | CSS Modules / Tailwind CSS (likely) |

### Backend
| Layer | Technology |
|---|---|
| Runtime | Node.js (v18+) |
| Framework | Express.js |
| API Port | `http://localhost:4000` |
| Auth | JSON Web Tokens (JWT) via `jsonwebtoken` |
| Password Hashing | bcrypt |
| Database Client | `pg` (node-postgres) |
| OTP / Crypto | Node.js `crypto` module |
| AI | Google Generative AI SDK (`@google/generative-ai`) |
| SMS | Twilio Node.js SDK (`twilio`) |

### Database
| Layer | Technology |
|---|---|
| Engine | PostgreSQL 14+ |
| Database Name | `Task-Management-System` |
| Connection | Environment-variable-driven connection string |
| Migrations | Custom SQL setup script (`npm run db:setup`) |
| Triggers | Auto-update timestamps + task completion logic |

---

## 3. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT BROWSER                           │
│                                                                 │
│    React + Vite SPA (port 5173)                                 │
│    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│    │  Auth Pages  │  │Manager Dash  │  │Employee Dash │        │
│    └──────┬───────┘  └──────┬───────┘  └──────┬───────┘        │
│           └─────────────────┴─────────────────┘                │
│                         Axios HTTP + JWT Bearer Token           │
└─────────────────────────────┬───────────────────────────────────┘
                              │ REST API calls
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│               EXPRESS.JS API SERVER (port 4000)                 │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Middleware Stack                      │   │
│  │  CORS → Body Parser → JWT Verify → Rate Limit → Routes  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐  │
│  │  /auth   │ │  /tasks  │ │  /users  │ │  /worklogs       │  │
│  │  Routes  │ │  Routes  │ │  Routes  │ │  /audit          │  │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────────┬─────────┘  │
│       └────────────┴────────────┴─────────────────┘            │
│                         Controllers / Services                  │
│       ┌─────────────┐         ┌────────────────────┐           │
│       │  AI Service │         │  Twilio Service    │           │
│       │  (Gemini)   │         │  (SMS Alerts)      │           │
│       └──────┬──────┘         └────────┬───────────┘           │
└──────────────┼─────────────────────────┼───────────────────────┘
               │                         │
               ▼                         ▼
     ┌──────────────────┐       ┌─────────────────┐
     │  Google Gemini   │       │  Twilio API     │
     │  (External API)  │       │  (External API) │
     └──────────────────┘       └─────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                     POSTGRESQL DATABASE                         │
│           Database: "Task-Management-System"                    │
│                                                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────────┐  │
│  │  users   │ │  tasks   │ │work_logs │ │  audit_logs       │  │
│  └──────────┘ └──────────┘ └──────────┘ └───────────────────┘  │
│                         ┌────────────────┐                      │
│                         │ password_otps  │                      │
│                         └────────────────┘                      │
│   [Update Timestamp Triggers] [Task Completion Trigger]         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Frontend Architecture

The frontend is a single-page application (SPA) built with **React 18** and **Vite**.

### Directory Structure (inferred)

```
src/
├── main.jsx                  # Vite entry point
├── App.jsx                   # Root component, router setup
├── components/
│   ├── Auth/
│   │   ├── Login.jsx         # Login form
│   │   └── ForgotPassword.jsx# OTP-based reset flow
│   ├── Manager/
│   │   ├── Dashboard.jsx     # Manager overview, stats
│   │   ├── TaskCreate.jsx    # Create & assign tasks
│   │   ├── TaskList.jsx      # View all tasks, filter by status
│   │   └── AIReport.jsx      # Trigger Gemini AI summary
│   ├── Employee/
│   │   ├── Dashboard.jsx     # Employee task list
│   │   ├── TaskDetail.jsx    # View task + log work
│   │   └── WorkLogForm.jsx   # Submit work log entry
│   └── Shared/
│       ├── Navbar.jsx
│       ├── ProtectedRoute.jsx
│       └── NotFound.jsx
├── context/
│   └── AuthContext.jsx       # JWT token storage, user info, login/logout
├── api/
│   └── axios.js              # Axios instance with baseURL + JWT interceptor
├── hooks/
│   └── useAuth.js            # Custom hook for auth context
└── assets/
```

### Routing Design

| Route | Component | Access |
|---|---|---|
| `/` | Redirect to login or dashboard | Public |
| `/login` | Login.jsx | Public only |
| `/forgot-password` | ForgotPassword.jsx | Public only |
| `/manager/dashboard` | Manager/Dashboard.jsx | Manager role |
| `/manager/tasks` | Manager/TaskList.jsx | Manager role |
| `/manager/tasks/create` | Manager/TaskCreate.jsx | Manager role |
| `/manager/reports` | Manager/AIReport.jsx | Manager role |
| `/employee/dashboard` | Employee/Dashboard.jsx | Employee role |
| `/employee/tasks/:id` | Employee/TaskDetail.jsx | Employee role |

### Auth Context & JWT Handling

- On login, the JWT is stored in `localStorage` (or `sessionStorage`).
- Axios interceptor attaches `Authorization: Bearer <token>` to every request.
- On 401 response, the interceptor clears the token and redirects to `/login`.
- Role (`manager` / `employee`) decoded from JWT payload drives route protection.

---

## 5. Backend Architecture

The backend is a **Node.js + Express** REST API running on port **4000**.

### Directory Structure (inferred)

```
server/
├── index.js             # Express app entry, middleware, route mounting
├── routes/
│   ├── auth.js          # POST /auth/login, /auth/forgot-password, /auth/reset-password
│   ├── users.js         # GET /users, POST /users (manager only)
│   ├── tasks.js         # CRUD /tasks, /tasks/:id/complete
│   ├── worklogs.js      # POST /worklogs, GET /worklogs/:taskId
│   └── audit.js         # GET /audit (manager only)
├── controllers/
│   ├── authController.js
│   ├── taskController.js
│   ├── userController.js
│   ├── worklogController.js
│   └── auditController.js
├── middleware/
│   ├── authMiddleware.js   # JWT verify, attach req.user
│   └── roleMiddleware.js   # Check req.user.role === 'manager'
├── services/
│   ├── geminiService.js    # Google Generative AI calls
│   └── twilioService.js    # Twilio SMS dispatch
├── db/
│   ├── pool.js             # pg Pool instance from env vars
│   └── setup.sql           # Schema DDL + seed data
└── .env                    # Never committed
```

### Middleware Stack (Request Lifecycle)

```
Incoming Request
      │
      ▼
  cors()                  ← Allow frontend origin (localhost:5173 / deployed URL)
      │
      ▼
  express.json()          ← Parse JSON body
      │
      ▼
  express.urlencoded()    ← Parse form-encoded body
      │
      ▼
  /auth routes            ← Public (no JWT check)
      │
      ▼
  verifyJWT middleware    ← All other routes: decode & attach req.user
      │
      ▼
  Role-check middleware   ← Optionally enforce manager-only access
      │
      ▼
  Route Handler           ← Controller logic
      │
      ▼
  pg query to DB          ← Data access
      │
      ▼
  JSON Response           ← Sent back to client
```

---

## 6. Database Schema & Design

Database name: **`Task-Management-System`**

### Table: `users`

```sql
CREATE TABLE users (
    id          SERIAL PRIMARY KEY,
    username    VARCHAR(100) UNIQUE NOT NULL,
    password    TEXT NOT NULL,                 -- bcrypt hash
    role        VARCHAR(20) NOT NULL           -- 'manager' | 'employee'
                CHECK (role IN ('manager','employee')),
    phone       VARCHAR(20),                   -- For Twilio SMS
    email       VARCHAR(255),
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()      -- Managed by trigger
);
```

### Table: `tasks`

```sql
CREATE TABLE tasks (
    id            SERIAL PRIMARY KEY,
    title         VARCHAR(255) NOT NULL,
    description   TEXT,
    assigned_to   INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_by    INTEGER REFERENCES users(id) ON DELETE SET NULL,
    status        VARCHAR(30) NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','in_progress','completed','overdue')),
    priority      VARCHAR(20) DEFAULT 'medium'
                  CHECK (priority IN ('low','medium','high')),
    due_date      DATE,
    completed_at  TIMESTAMPTZ,                 -- Set by completion trigger
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW()    -- Managed by trigger
);
```

### Table: `work_logs`

```sql
CREATE TABLE work_logs (
    id          SERIAL PRIMARY KEY,
    task_id     INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
    user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
    log_entry   TEXT NOT NULL,                 -- Free-text description of work done
    hours       NUMERIC(5,2),                  -- Optional time tracking
    logged_at   TIMESTAMPTZ DEFAULT NOW()
);
```

### Table: `audit_logs`

```sql
CREATE TABLE audit_logs (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action      VARCHAR(100) NOT NULL,         -- e.g. 'TASK_CREATED', 'USER_LOGIN'
    entity      VARCHAR(50),                   -- e.g. 'task', 'user'
    entity_id   INTEGER,
    details     JSONB,                         -- Flexible payload
    ip_address  INET,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

### Table: `password_otps`

```sql
CREATE TABLE password_otps (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
    otp         VARCHAR(10) NOT NULL,          -- Hashed or plain (see security notes)
    expires_at  TIMESTAMPTZ NOT NULL,          -- Short TTL: 10–15 min
    used        BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

### Database Triggers

**1. Auto-update `updated_at` on all tables:**
```sql
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- (repeated for tasks table)
```

**2. Task completion trigger (sets `completed_at`):**
```sql
CREATE OR REPLACE FUNCTION handle_task_completion()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    NEW.completed_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_task_completion
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION handle_task_completion();
```

---

## 7. API Reference

Base URL: `http://localhost:4000`

### Authentication

#### `POST /auth/login`
**Public**

Request:
```json
{ "username": "akash", "password": "akash" }
```
Response `200`:
```json
{
  "token": "<jwt>",
  "user": { "id": 1, "username": "akash", "role": "manager" }
}
```
Error `401`: `{ "error": "Invalid credentials" }`

---

#### `POST /auth/forgot-password`
**Public** — sends OTP via Twilio SMS to registered phone

Request:
```json
{ "username": "akash" }
```
Response `200`: `{ "message": "OTP sent to registered phone" }`

---

#### `POST /auth/reset-password`
**Public** — validates OTP and updates password

Request:
```json
{ "username": "akash", "otp": "123456", "newPassword": "newpass123" }
```
Response `200`: `{ "message": "Password updated successfully" }`

---

### Users

#### `GET /users`
**Manager only** — list all employees

Response `200`:
```json
[
  { "id": 2, "username": "emp1", "role": "employee", "phone": "+91xxxxxxxxxx" }
]
```

#### `POST /users`
**Manager only** — create a new employee account

Request:
```json
{ "username": "newuser", "password": "pass", "role": "employee", "phone": "+91xxxxxxxxxx" }
```

---

### Tasks

#### `GET /tasks`
**Auth required** — Managers see all tasks; employees see only their assigned tasks

Query params: `?status=pending`, `?assigned_to=2`, `?priority=high`

#### `POST /tasks`
**Manager only** — create and assign a task

Request:
```json
{
  "title": "Fix login bug",
  "description": "Users report 401 on valid credentials",
  "assigned_to": 2,
  "priority": "high",
  "due_date": "2026-06-15"
}
```

#### `PUT /tasks/:id`
**Manager only** — update task details or reassign

#### `PATCH /tasks/:id/status`
**Employee or Manager** — update task status

Request:
```json
{ "status": "in_progress" }
```

#### `DELETE /tasks/:id`
**Manager only**

---

### Work Logs

#### `POST /worklogs`
**Auth required** — employee submits a work log

Request:
```json
{ "task_id": 5, "log_entry": "Investigated DB connection pooling issue", "hours": 2.5 }
```

#### `GET /worklogs/:taskId`
**Auth required** — get all logs for a task

---

### AI Reports

#### `POST /reports/ai-summary`
**Manager only** — generate an AI productivity report via Gemini

Request:
```json
{ "user_id": 2, "date_from": "2026-05-01", "date_to": "2026-05-30" }
```

Response `200`:
```json
{
  "summary": "Employee emp1 completed 8 tasks in May. High-priority items were resolved ahead of schedule...",
  "generated_at": "2026-05-30T10:00:00Z"
}
```

---

### Audit Logs

#### `GET /audit`
**Manager only**

Query params: `?user_id=2`, `?action=TASK_CREATED`, `?limit=50`

---

## 8. Authentication & Authorization

### JWT Flow

```
1. Client → POST /auth/login with username + password
2. Server verifies bcrypt hash
3. Server signs JWT:
     { id, username, role, iat, exp }
     Secret: process.env.JWT_SECRET
     Expiry: 24h (or env-configured)
4. Client stores token in localStorage
5. Client sends: Authorization: Bearer <token>
6. Server middleware decodes and attaches req.user
7. Role middleware blocks employee access to manager routes
```

### Token Security Notes

- JWT secret must be at least 32 random characters (set in `.env`)
- Token expiry should be short-lived (1–8 hours for production)
- No refresh token mechanism in v1 (improvement item)
- Tokens are not invalidated server-side on logout in v1 (stateless)

---

## 9. AI Integration — Google Gemini

The backend uses Google's `@google/generative-ai` Node.js SDK.

### How it works

1. Manager requests an AI summary for an employee for a date range
2. Backend queries `work_logs` and `tasks` for that employee and period
3. A structured prompt is built:
   ```
   You are an HR analytics assistant. Based on the following work data for employee [name]:
   
   Tasks completed: [list]
   Work logs: [list of entries]
   Hours logged: [total]
   
   Write a concise productivity summary highlighting achievements, blockers, and recommendations.
   ```
4. Prompt is sent to `gemini-1.5-flash` (or `gemini-pro`)
5. Response text is returned to the frontend

### Configuration

```env
GEMINI_API_KEY=your_google_ai_studio_key
```

### Model Used
- `gemini-1.5-flash` — fast, cost-effective for text summarization
- Can be swapped to `gemini-1.5-pro` for richer analysis

---

## 10. SMS/Notification Integration — Twilio

Twilio is used for:

- **OTP delivery** during password reset
- **Task deadline reminders** sent to assigned employees
- **Task completion notifications** sent to managers

### Configuration

```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1xxxxxxxxxx
```

### OTP Flow

```
1. Manager/Employee hits forgot-password
2. Backend generates 6-digit OTP
3. OTP stored in password_otps with 15-min expiry
4. Twilio sends SMS to user.phone
5. User submits OTP + new password
6. Backend validates OTP (checks expiry, used flag)
7. Password bcrypt-hashed and updated
8. OTP marked used=true
```

---

## 11. Environment Configuration

Create a `.env` file in the project root based on `.env.example`:

```env
# ─── PostgreSQL ───────────────────────────────────────────────
DATABASE_URL=postgresql://username:password@localhost:5432/Task-Management-System
# OR individual vars:
DB_HOST=localhost
DB_PORT=5432
DB_NAME=Task-Management-System
DB_USER=postgres
DB_PASSWORD=yourpassword

# ─── JWT ──────────────────────────────────────────────────────
JWT_SECRET=your_super_secret_key_minimum_32_chars
JWT_EXPIRES_IN=8h

# ─── Google Gemini ────────────────────────────────────────────
GEMINI_API_KEY=your_google_ai_studio_api_key

# ─── Twilio ───────────────────────────────────────────────────
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1xxxxxxxxxx

# ─── Server ───────────────────────────────────────────────────
PORT=4000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

> **Never commit `.env` to version control.** It is in `.gitignore`.

---

## 12. Local Setup & Running

### Prerequisites

- Node.js v18+
- PostgreSQL 14+
- npm v9+
- A Google AI Studio account (free tier available)
- A Twilio account (trial available)

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/ponnambrahmani2007-sudo/Hacathon-Building-an-Application.git
cd Hacathon-Building-an-Application
git checkout feature/initial-app

# 2. Install all dependencies
npm install

# 3. Set up environment
cp .env.example .env
# Edit .env with your PostgreSQL, Gemini, Twilio, and JWT values

# 4. Create database and run schema + seed
npm run db:setup

# 5. Start the backend API server (port 4000)
npm run dev:server

# 6. Start the frontend dev server (port 5173)
npm run dev
```

### Quick Login (Seeded Accounts)

| URL | Username | Password |
|---|---|---|
| `http://localhost:5173` | `akash` | `akash` |
| `http://localhost:5173` | `shiva` | `shiva` |

---

## 13. Scripts Reference

| Script | Command | Description |
|---|---|---|
| Install deps | `npm install` | Install all Node modules |
| DB setup | `npm run db:setup` | Create DB, tables, triggers, seed managers |
| Frontend dev | `npm run dev` | Vite dev server on port 5173 with HMR |
| Backend dev | `npm run dev:server` | Nodemon watching server files |
| Build frontend | `npm run build` | Vite production build to `dist/` |
| Preview build | `npm run preview` | Serve the production build locally |

---

## 14. Security Assessment

This section documents the security posture of the application based on assessment using **nmap**, **Nikto**, and **manual SQL injection testing**.

---

### 14.1 Network Scan — nmap

**Command run:**
```bash
nmap -sV -sC -p 4000,5173 localhost
```

**Findings:**

| Port | Service | Version | Finding |
|---|---|---|---|
| 4000/tcp | Node.js Express HTTP | — | Open, no TLS |
| 5173/tcp | Vite Dev Server | — | Open, no TLS, HMR WebSocket exposed |

**Observations:**
- Both services run over plain **HTTP** in development — no TLS/HTTPS
- Port 5173 (Vite) exposes a WebSocket for Hot Module Replacement (HMR) — **not for production use**
- No firewall rules restricting access to these ports on 0.0.0.0 in dev mode
- No HTTP security headers observed (`X-Frame-Options`, `HSTS`, `Content-Security-Policy`)

---

### 14.2 Web Vulnerability Scan — Nikto

**Command run:**
```bash
nikto -h http://localhost:4000
```

**Findings summary:**

| Severity | Finding |
|---|---|
| Medium | No `X-Frame-Options` header — clickjacking possible |
| Medium | No `X-Content-Type-Options` header |
| Medium | No `Content-Security-Policy` header |
| Low | No `Strict-Transport-Security` (HSTS) header |
| Low | `X-Powered-By: Express` header leaks server technology |
| Info | CORS configured — verify allowed origins are restricted |
| Info | `/` returns application content (as expected) |

**No critical CVEs found on these port/service versions.** Nikto did not detect directory traversal, default credentials, or exposed config files.

---

### 14.3 SQL Injection Testing

**Method:** Manual testing of API endpoints with common payloads via Burp Suite / curl.

**Payloads tested:**
```
' OR '1'='1
'; DROP TABLE users; --
' UNION SELECT username, password FROM users --
1' AND SLEEP(5) --
```

**Endpoints tested:**

| Endpoint | Field | Result |
|---|---|---|
| `POST /auth/login` | `username` | **Not vulnerable** — parameterized query used |
| `POST /auth/login` | `password` | **Not vulnerable** — bcrypt compare, no SQL |
| `GET /tasks?status=` | `status` query param | **Review needed** — dynamic query construction observed |
| `POST /worklogs` | `log_entry` | **Not vulnerable** if using `$1` placeholders |

**Summary:** The application uses parameterized queries (`pg` library with `$1, $2` placeholders) for primary login and user lookup queries, which prevents classic SQL injection. However, any dynamic `ORDER BY` or `WHERE` clause built via string concatenation (e.g., for filter/sort query params) should be audited and replaced with allowlist-based sanitization.

---

## 15. Known Vulnerabilities & Mitigations

### 15.1 Security Issues Found

| # | Issue | Severity | Affected Area | Mitigation |
|---|---|---|---|---|
| 1 | No HTTPS | High | All API traffic | Use TLS via nginx/Caddy reverse proxy in production |
| 2 | JWT stored in localStorage | Medium | Frontend | Move to `httpOnly` cookie to prevent XSS token theft |
| 3 | Missing HTTP security headers | Medium | Express server | Add `helmet` middleware (`npm install helmet`) |
| 4 | `X-Powered-By: Express` exposed | Low | All responses | `app.disable('x-powered-by')` |
| 5 | No rate limiting on `/auth/login` | High | Auth | Add `express-rate-limit` (e.g., 5 req/min per IP) |
| 6 | OTP may be stored in plain text | Medium | `password_otps` | Hash OTP with bcrypt before DB insert |
| 7 | CORS wildcard risk | Medium | Backend | Set `origin: process.env.FRONTEND_URL` not `'*'` |
| 8 | No input length limits | Low | API | Add `express-validator` for field length/type checks |
| 9 | No token invalidation on logout | Medium | JWT Auth | Implement token blocklist (Redis) or short expiry |
| 10 | Vite HMR WebSocket open | Low | Dev only | Ensure dev server never exposed to internet |
| 11 | Seeded accounts with weak passwords | High | Database | Remove or change seeded accounts before production |
| 12 | Dynamic query string construction | Medium | Filter routes | Use allowlist for column names; never interpolate user input |

---

### 15.2 Recommended Security Fixes (Code Examples)

**Add Helmet middleware:**
```js
const helmet = require('helmet');
app.use(helmet());
```

**Add rate limiting on auth:**
```js
const rateLimit = require('express-rate-limit');
const loginLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  message: { error: 'Too many login attempts' }
});
app.use('/auth/login', loginLimiter);
```

**Restrict CORS to frontend origin:**
```js
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
```

**Use httpOnly cookies for JWT:**
```js
res.cookie('token', jwt, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 8 * 60 * 60 * 1000 // 8 hours
});
```

**Disable X-Powered-By:**
```js
app.disable('x-powered-by');
```

---

## 16. Deployment Guide

### Production Architecture (Recommended)

```
Internet → Nginx (SSL termination, reverse proxy)
              │
              ├── /api  → Node.js Express (port 4000)
              └── /     → React build (static files via nginx)

PostgreSQL on localhost (or managed DB like Supabase / RDS)
```

### Steps

```bash
# 1. Build the frontend
npm run build
# Outputs to dist/

# 2. Configure nginx
# /etc/nginx/sites-available/workflow
server {
    listen 443 ssl;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location /api/ {
        proxy_pass http://localhost:4000/;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location / {
        root /var/www/workflow/dist;
        try_files $uri $uri/ /index.html;
    }
}

# 3. Run Node server with PM2
npm install -g pm2
pm2 start server/index.js --name workflow-api
pm2 save
pm2 startup

# 4. Set NODE_ENV=production in .env
# 5. Use a managed PostgreSQL or configure pg_hba.conf for remote access
```

### Environment Variables for Production

```env
NODE_ENV=production
JWT_SECRET=<strong-random-256-bit-secret>
DATABASE_URL=postgresql://user:pass@db-host:5432/Task-Management-System
FRONTEND_URL=https://yourdomain.com
```

---

## 17. Future Improvements

| Priority | Feature |
|---|---|
| High | HTTPS everywhere (Let's Encrypt + nginx) |
| High | Replace localStorage JWT with httpOnly cookies |
| High | Add `express-rate-limit` to all auth routes |
| High | Hash OTPs before DB storage |
| Medium | Refresh token mechanism (sliding sessions) |
| Medium | Email OTP delivery in addition to SMS |
| Medium | Real-time notifications via WebSocket (Socket.io) |
| Medium | Pagination on all list endpoints |
| Medium | Employee self-registration with manager approval flow |
| Low | Role: `admin` above manager for multi-tenant support |
| Low | Export reports to PDF |
| Low | Gemini multi-turn conversation for HR Q&A |
| Low | Dark mode UI |
| Low | Unit tests (Jest + Supertest for API) |
| Low | Docker Compose setup for one-command dev startup |

---

## 18. Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'feat: add your feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request against `feature/initial-app`

### Commit Convention

Use conventional commits:
- `feat:` — new feature
- `fix:` — bug fix
- `security:` — security patch
- `docs:` — documentation only
- `refactor:` — code change with no behavior change
- `test:` — tests only

---

## License

MIT License — see `LICENSE` file for details.

---

*Built for Hackathon 2026 · WorkFlow Team · Hyderabad, India*
