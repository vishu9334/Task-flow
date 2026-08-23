# TaskFlow - System Architecture & Technical Design

## 1. Overview
TaskFlow is a production-grade, multi-tenant project and task management backend built with Node.js, Express, PostgreSQL, Prisma, Redis, and BullMQ. The system is designed around **Layered Clean Architecture**, strict **Tenant Isolation**, **Token-based Security**, and **Reliable Asynchronous Background Job Processing**.

---

## 2. Layered Clean Architecture

The codebase enforces strict separation of concerns across four decoupled layers:

```
┌─────────────────────────────────────────────────────────────┐
│                    HTTP / Transport Layer                   │
│          (Express Routes, Middlewares, Rate Limiters)       │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                       Controller Layer                      │
│      (Extracts params/body/context, calls Services,         │
│               returns unified ApiResponse)                  │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                        Service Layer                        │
│   (Business logic, Cross-Tenant validation, Domain rules,   │
│           BullMQ job triggers, Domain error throws)         │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│            Data Layer (Contracts & Implementations)         │
│       (I*Repository contracts, Prisma PostgreSQL queries,   │
│          soft delete filters, transactions, pagination)     │
└─────────────────────────────────────────────────────────────┘
```

### Layer Responsibilities:
1. **Routes & Middleware (`src/routes/`, `src/middleware/`)**:
   - Handles route mounting, authentication verification (`authenticate`), rate limiting (`authLimiter`), and organization context resolution (`attachOrganization`).
2. **Controllers (`src/controllers/`)**:
   - HTTP transport handlers.
   - Extracts request body, path params, query strings, authenticated user and organization context.
   - Never contains direct database queries or heavy business logic.
   - Returns consistent `ApiResponse` payload.
3. **Services (`src/services/`)**:
   - Contains 100% of domain business logic.
   - Enforces cross-tenant validation (`orgId` matching).
   - Enforces business rules (assignee org membership check, role checks, duplicate slugs).
   - Enqueues background jobs via BullMQ.
   - Throws standard `ApiError` instances.
4. **Data Layer (`src/data/contracts/`, `src/data/implimentations/`)**:
   - Abstract repository contracts define interfaces (`IProjectRepository`, `ITaskRepository`, `IOrganizationRepository`).
   - Implementation classes (`PostgresProjectData`, `PostgresTaskData`, `PostgresOrganizationData`) interact directly with Prisma ORM.

---

## 3. Multi-Tenant Data Isolation Strategy

TaskFlow implements **Shared Database, Shared Schema (Row-Level Logical Isolation)**:

```
[ Incoming HTTP Request ]
          │
          ▼
[ authMiddleware ] ────────────► Decodes JWT, extracts userId & default organizationId
          │
          ▼
[ organizationMiddleware ] ────► Checks 'x-organization-id' header or token orgId
                                 Verifies active membership in PostgreSQL
                                 Attaches req.organizationId & req.membership
          │
          ▼
[ Service & Data Layers ] ─────► All DB operations scoped by `where: { orgId }` or
                                 validate `project.orgId === req.organizationId`
```

### Cross-Tenant Security Rules:
- If a user attempts to view, update, delete, or link a resource (project or task) belonging to another organization, the service immediately aborts and throws `403 CROSS_TENANT_ACCESS_FORBIDDEN`.
- When creating or assigning tasks, the system validates that the target assignee has active membership in the same organization.
- Soft-delete operations (`deletedAt: new Date()`) ensure resources are hidden from standard queries while preserving referential history.

---

## 4. Authentication & Token Lifecycle

Authentication combines Redis-backed ephemeral state with PostgreSQL persistence and dual-token rotation:

```
[ User Registration ]
        │
        ├─► Validate inputs -> Hash password (bcrypt 12 rounds)
        ├─► Generate 6-digit OTP -> Store pending user in Redis (TTL: 120s)
        └─► Enqueue BullMQ 'send-otp' job -> Mock/Brevo email sent
        
[ OTP Verification ]
        │
        ├─► Validate OTP against Redis
        ├─► Persist verified User & default Organization in PostgreSQL (Atomic Transaction)
        └─► Generate JWT Access Token (15m) & Cryptographic Refresh Token (7d)
        
[ Login & Token Refresh ]
        │
        ├─► Validate credentials -> Issue JWT Access Token in HttpOnly cookie
        ├─► Hash Refresh Token (SHA-256) -> Store in PostgreSQL
        └─► On Refresh: Rotate tokens (revoke old refresh token, issue new pair)
```

---

## 5. Background Job Processing & Worker Protocol

```
[ HTTP Request: Assign Task ]
            │
            ▼
   [ TaskService ]
            │
            ├─► Database: Assign user to task (PostgreSQL)
            │
            └─► Queue: Add 'send-task-assigned' job to BullMQ
                     │
                     ▼
             [ Redis Queue: email-notifications ]
                     │
         ┌───────────┴───────────┐
         ▼                       ▼
  [ Email Worker ]         [ Retry Policy ]
  Processes job:           - Max Attempts: 3
  Sends notification       - Exponential backoff:
  via Brevo / Mock API       1s ➔ 2s ➔ 4s
         │                       │
         ├─► Success             └─► 3 Failures Exhausted:
         │   (Status: completed)     Route to 'email-notifications-dead-letter'
         │                           (Status: failed)
```

### Job Status Inspection:
- `GET /jobs/:id` queries the BullMQ queue to return job state (`pending`, `active`, `completed`, `failed`).

---

## 6. Technical Decisions & Tradeoffs

| Decision | Rationale | Tradeoff |
| :--- | :--- | :--- |
| **Row-Level Tenancy** | Lightweight, cost-effective, simple migrations via Prisma. | Requires strict service-layer `where: { orgId }` enforcement. |
| **Redis Temporary Registration** | Keeps DB clean from unverified spam registrations; automatic expiry via TTL (120s). | Redis availability is required during registration. |
| **BullMQ for Queues** | Production-ready Redis queue with built-in retries, exponential backoff, and dead-letter handling. | Requires Redis connection in addition to relational database. |
| **Pure JS Service Validation** | High performance, zero extra dependency weight, fully complies with PDF specifications. | Does not generate automatic TypeScript types. |
