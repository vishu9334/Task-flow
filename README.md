# TaskFlow - Backend Developer Technical Assignment

TaskFlow is a robust, lightweight multi-tenant project management backend built with Node.js, Express, PostgreSQL, Prisma, Redis, and BullMQ.

## Features Completed So Far
- **Database Architecture**: PostgreSQL schema with Prisma ORM (Users, Organizations, Members, Projects, Tasks, Assignments, Comments, RefreshTokens)
- **Multi-tenant Data Layer**: Clean separation (Routes -> Controllers -> Services -> Data Layer)
- **Authentication & Security**:
  - Redis-backed temporary registration with 120s TTL & OTP verification
  - Password hashing with bcrypt (cost factor: 12)
  - Short-lived JWT Access Tokens (15 min) in HttpOnly cookies
  - Long-lived SHA-256 Hashed Refresh Tokens (7 days) with rotation & revocation support
  - Rate limiting on Auth endpoints (10 req/min/IP)
- **Asynchronous Processing**: BullMQ job queue with exponential backoff retries & worker for email notifications (Brevo)

## Tech Stack
- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Cache & Queue**: Redis & BullMQ
- **Email Service**: Brevo API
