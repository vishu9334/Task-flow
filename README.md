# TaskFlow - Backend Developer Technical Assignment

TaskFlow is a production-grade, multi-tenant project and task management backend built with Node.js, Express, PostgreSQL, Prisma, Redis, and BullMQ.

---

## 🌟 Key Architectural Features

- **Layered Clean Architecture**: Strict separation of concerns (Routes ➔ Controllers ➔ Services ➔ Repository Contracts ➔ Prisma Data Layer).
- **Multi-Tenant Logical Isolation**: Logical row-level tenant isolation with strict cross-tenant verification (`403 CROSS_TENANT_ACCESS_FORBIDDEN`).
- **Secure Authentication & RBAC**:
  - Redis-backed temporary registrations with 120s TTL and OTP verification.
  - Password hashing with `bcrypt` (12 salt rounds).
  - Short-lived JWT Access Tokens (15 min) in HttpOnly secure cookies.
  - Long-lived SHA-256 Hashed Refresh Tokens (7 days) with rotation & revocation.
  - Rate limiting on Auth routes (10 req/min/IP).
  - Role-Based Access Control (`ADMIN`, `MEMBER`, `USER`).
- **Project & Task Management**:
  - Full CRUD operations with Soft-Delete support.
  - Advanced task filtering (`status`, `priority`, `assignee`, `dueDate`, `search`).
  - Dual pagination options: Offset (`page`, `limit`) and Cursor (`cursor`, `limit`).
  - Dashboard status aggregations (`GET /dashboard/counts`).
- **Asynchronous Background Processing**:
  - BullMQ email notification queues with exponential backoff retries (1s ➔ 2s ➔ 4s).
  - Automatic routing to Dead-Letter Queue after 3 exhausted attempts.
  - Real-time job status inspection via `GET /jobs/:id`.
  - Fallback mock email logging when third-party email provider is unconfigured.
- **Interactive Documentation**:
  - Swagger UI accessible locally at `/api-docs`.
  - Complete Bruno API collection in `bruno/`.
- **Automated Testing Suite**: Unit and integration test suite passing with zero failures.

---

## 🚀 Quick Start with Docker Compose (Recommended)

To start the entire environment (API, Background Worker, PostgreSQL, Redis, Migrations & Database Seeding) with a single command:

```bash
docker compose up --build
```

### Services Started:
- **API Server**: `http://localhost:4000`
- **Swagger Documentation**: `http://localhost:4000/api-docs`
- **PostgreSQL**: `localhost:5433` (mapped from container 5432)
- **Redis**: `localhost:6380` (mapped from container 6379)
- **Worker**: Processes BullMQ email jobs in background

---

## 💻 Local Development Setup

### 1. Prerequisites
- Node.js >= 20.x
- PostgreSQL >= 16.x
- Redis >= 7.x

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables
Copy `.env.example` to `.env` and adjust credentials as needed:
```bash
cp .env.example .env
```

### 4. Database Setup & Seeding
```bash
# Push Prisma schema to PostgreSQL
npx prisma db push

# Seed the database with demo organizations, users, projects, and tasks
npm run seed
```

### 5. Start Development Server
```bash
# Runs both API server and Background Worker concurrently
npm run dev
```

---

## 🧪 Automated Testing

TaskFlow includes comprehensive unit and integration tests covering Authentication, Task CRUD, Cross-Tenant 403 checks, Pagination, and Dashboard aggregations:

```bash
npm test
```

---

## 📖 API Documentation & Bruno Collection

### 1. Swagger / OpenAPI UI
When the server is running, visit:
- **Swagger UI:** [http://localhost:4000/api-docs](http://localhost:4000/api-docs)
- **OpenAPI JSON:** [http://localhost:4000/api-docs.json](http://localhost:4000/api-docs.json)

### 2. Bruno Collection
The project contains a pre-configured Bruno collection in the `bruno/` directory:
1. Open the **Bruno** desktop client.
2. Click **Open Collection** and select the `server/bruno` folder.
3. Select the **Local** environment (`baseUrl: http://localhost:4000`).

---

## 👥 Seed Accounts for Testing

| Email | Password | Role | Organization |
| :--- | :--- | :--- | :--- |
| `john.doe@taskflow.dev` | `Password123!` | ADMIN | Acme Technologies |
| `jane.smith@taskflow.dev` | `Password123!` | MEMBER | Acme Technologies |
| `bruce.wayne@taskflow.dev` | `Password123!` | MEMBER | Acme Technologies |
| `tony.stark@stark.dev` | `Password123!` | ADMIN | Stark Enterprises |
| `peter.parker@stark.dev` | `Password123!` | MEMBER | Stark Enterprises |

---

## 🏛️ System Architecture

Detailed system architecture diagrams, multi-tenant isolation flows, token lifecycle models, and background queue designs are documented in [ARCHITECTURE.md](./ARCHITECTURE.md).
