# ReservePulse - Multi-Tenant Event & Ticket Reservation System

A production-grade, multi-tenant event management and tiered ticket reservation engine with race-condition-safe transactions, 10-minute temporary reservation holds, an asynchronous payment gateway simulator, and real-time organizer revenue/conversion analytics.

---

## 🌟 Key Features

1. **Role-Based Access Control (RBAC)**:
   - **Admin**: Super-admin platform oversight across all organizer tenants.
   - **Organizer**: Event creation, tier definition (VIP, General Admission, Early Bird), seat quota limits, and real-time conversion & revenue analytics.
   - **Attendee**: Discovery catalog, 10-minute temporary reservation holds, and checkout.

2. **Race-Condition-Safe Reservation Engine**:
   - Atomic locking simulating PostgreSQL \`SELECT FOR UPDATE\` and Redis Redlock distributed mutex locks.
   - Zero double-booking guarantee: even under 20+ concurrent millisecond-level requests for the last 2 tickets.

3. **10-Minute Ephemeral Reservation Holds**:
   - Tickets are reserved with an active countdown timer.
   - Background worker sweeps every 2.5 seconds to auto-release expired holds back to the available inventory.

4. **Mock Asynchronous Payment Gateway**:
   - Supports Synchronous Approval, Asynchronous Webhook Simulation (2-second delayed settlement with status polling), and simulated Card Declined rollbacks.

5. **Organizer Analytics**:
   - Real-time gross revenue, tickets sold, hold-to-purchase conversion rates, and per-tier inventory health bars.

6. **Full Evaluation Deliverables**:
   - Interactive ER Diagram viewer + Mermaid + Prisma Schema (\`prisma/schema.prisma\`) + PostgreSQL DDL.
   - Postman Collection v2.1.0 exporter with concurrency & hold-expiry edge cases.
   - Interactive Concurrency Stress Test Simulator in the browser GUI.

---

## 🚀 Quick Start on Windows & VS Code

### 1. Prerequisites
- **Node.js**: v20 or v22 LTS ([nodejs.org](https://nodejs.org))
- **VS Code**: ([code.visualstudio.com](https://code.visualstudio.com))
- **Docker Desktop**: ([docker.com](https://www.docker.com)) or local PostgreSQL & Redis

### 2. Installation
Open PowerShell in the project directory:
\`\`\`powershell
npm install
\`\`\`

### 3. Spin up PostgreSQL & Redis (Docker)
\`\`\`powershell
docker run --name pg-ticket -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=reservepulse -p 5432:5432 -d postgres:16-alpine
docker run --name redis-ticket -p 6379:6379 -d redis:alpine
\`\`\`

### 4. Configure Environment (\`.env\`)
Create a \`.env\` file in the root:
\`\`\`env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/reservepulse?schema=public"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="super-secret-reservepulse-key-2026"
PORT=3000
NODE_ENV="development"
\`\`\`

### 5. Run Database Migrations
\`\`\`powershell
npx prisma migrate dev --name init
npx prisma generate
\`\`\`

### 6. Start Full-Stack App
\`\`\`powershell
npm run dev
\`\`\`
Visit [http://localhost:3000](http://localhost:3000) in your browser.
