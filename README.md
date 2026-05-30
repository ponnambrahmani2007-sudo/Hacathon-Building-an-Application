# WorkFlow

AI-powered employee accountability and task management backed by PostgreSQL.

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env` from `.env.example` and fill in PostgreSQL, Gemini, Twilio, and JWT values.

3. Create the database, tables, triggers, and seeded managers:

```bash
npm run db:setup
```

Seeded manager logins:

- `akash` / `akash`
- `shiva` / `shiva`

4. Run the API and frontend:

```bash
npm run dev:server
npm run dev
```

The frontend runs on `http://localhost:5173` and the API on `http://localhost:4000`.

## Database

The setup script creates PostgreSQL database `"Task-Management-System"` and these tables:

- `users`
- `tasks`
- `work_logs`
- `audit_logs`
- `password_otps`

It also installs update timestamp triggers and task completion trigger logic.
