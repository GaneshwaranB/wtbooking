export const PRISMA_SCHEMA_CONTENT = `// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum Role {
  ADMIN
  ORGANIZER
  ATTENDEE
}

enum HoldStatus {
  ACTIVE
  CONVERTED
  EXPIRED
  CANCELLED
}

enum OrderStatus {
  PENDING
  PAID
  FAILED
  REFUNDED
}

enum TransactionStatus {
  PROCESSING
  SUCCEEDED
  FAILED
}

model Tenant {
  id           String    @id @default(cuid())
  name         String
  slug         String    @unique
  contactEmail String
  verified     Boolean   @default(false)
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  users        User[]
  events       Event[]
  orders       Order[]

  @@index([slug])
}

model User {
  id        String   @id @default(cuid())
  tenantId  String?
  tenant    Tenant?  @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  email     String   @unique
  password  String   // bcrypt hashed
  name      String
  role      Role     @default(ATTENDEE)
  avatarUrl String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  holds     TicketReservationHold[]
  orders    Order[]

  @@index([tenantId])
  @@index([email])
}

model Event {
  id            String       @id @default(cuid())
  tenantId      String
  tenant        Tenant       @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  title         String
  slug          String
  description   String       @db.Text
  venueName     String
  city          String
  country       String
  isOnline      Boolean      @default(false)
  startsAt      DateTime
  endsAt        DateTime
  salesCutoffAt DateTime
  status        String       @default("PUBLISHED") // DRAFT, PUBLISHED, SOLD_OUT
  category      String
  bannerImage   String?
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt

  tiers         TicketTier[]
  holds         TicketReservationHold[]
  orders        Order[]

  @@unique([tenantId, slug])
  @@index([tenantId])
  @@index([salesCutoffAt])
}

model TicketTier {
  id            String       @id @default(cuid())
  eventId       String
  event         Event        @relation(fields: [eventId], references: [id], onDelete: Cascade)
  name          String
  description   String?
  price         Int          // Price in paise (e.g. 499900 = ₹4,999.00)
  totalCapacity Int
  heldCount     Int          @default(0)
  soldCount     Int          @default(0)
  maxPerOrder   Int          @default(4)
  version       Int          @default(1) // Optimistic locking counter
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt

  holds         TicketReservationHold[]
  orders        Order[]

  @@index([eventId])
}

model TicketReservationHold {
  id            String     @id @default(cuid())
  holdToken     String     @unique
  eventId       String
  event         Event      @relation(fields: [eventId], references: [id], onDelete: Cascade)
  tierId        String
  tier          TicketTier @relation(fields: [tierId], references: [id], onDelete: Cascade)
  userId        String
  user          User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  quantity      Int
  unitPrice     Int
  totalAmount   Int
  status        HoldStatus @default(ACTIVE)
  expiresAt     DateTime   // now + 10 minutes
  createdAt     DateTime   @default(now())

  @@index([tierId, status])
  @@index([expiresAt])
  @@index([userId])
}

model Order {
  id            String         @id @default(cuid())
  orderNumber   String         @unique
  tenantId      String
  tenant        Tenant         @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  eventId       String
  event         Event          @relation(fields: [eventId], references: [id], onDelete: Cascade)
  userId        String
  user          User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  tierId        String
  tier          TicketTier     @relation(fields: [tierId], references: [id], onDelete: Cascade)
  quantity      Int
  unitPrice     Int
  totalAmount   Int
  status        OrderStatus    @default(PENDING)
  holdToken     String?
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt

  transactions  Transaction[]

  @@index([tenantId])
  @@index([userId])
  @@index([eventId])
}

model Transaction {
  id               String            @id @default(cuid())
  orderId          String
  order            Order             @relation(fields: [orderId], references: [id], onDelete: Cascade)
  amount           Int
  currency         String            @default("INR")
  gateway          String            @default("RAZORPAY_SIMULATOR")
  gatewayReference String?
  status           TransactionStatus @default(PROCESSING)
  failureReason    String?
  createdAt        DateTime          @default(now())
  updatedAt        DateTime          @updatedAt

  @@index([orderId])
  @@index([gatewayReference])
}
`;

export const POSTGRES_SQL_DDL = `-- PostgreSQL DDL & Concurrency Safe Trigger
-- Run in psql or pgAdmin

CREATE TABLE "Tenant" (
  "id" VARCHAR(64) PRIMARY KEY,
  "name" VARCHAR(255) NOT NULL,
  "slug" VARCHAR(100) UNIQUE NOT NULL,
  "contactEmail" VARCHAR(255) NOT NULL,
  "verified" BOOLEAN DEFAULT FALSE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "User" (
  "id" VARCHAR(64) PRIMARY KEY,
  "tenantId" VARCHAR(64) REFERENCES "Tenant"("id") ON DELETE CASCADE,
  "email" VARCHAR(255) UNIQUE NOT NULL,
  "password" VARCHAR(255) NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "role" VARCHAR(32) NOT NULL DEFAULT 'ATTENDEE',
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Event" (
  "id" VARCHAR(64) PRIMARY KEY,
  "tenantId" VARCHAR(64) NOT NULL REFERENCES "Tenant"("id") ON DELETE CASCADE,
  "title" VARCHAR(255) NOT NULL,
  "slug" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "venueName" VARCHAR(255) NOT NULL,
  "city" VARCHAR(100),
  "country" VARCHAR(100),
  "startsAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "endsAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "salesCutoffAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "TicketTier" (
  "id" VARCHAR(64) PRIMARY KEY,
  "eventId" VARCHAR(64) NOT NULL REFERENCES "Event"("id") ON DELETE CASCADE,
  "name" VARCHAR(100) NOT NULL,
  "price" INTEGER NOT NULL,
  "totalCapacity" INTEGER NOT NULL,
  "heldCount" INTEGER NOT NULL DEFAULT 0,
  "soldCount" INTEGER NOT NULL DEFAULT 0,
  "maxPerOrder" INTEGER NOT NULL DEFAULT 4,
  CONSTRAINT chk_capacity CHECK ("heldCount" + "soldCount" <= "totalCapacity")
);

CREATE TABLE "TicketReservationHold" (
  "id" VARCHAR(64) PRIMARY KEY,
  "holdToken" VARCHAR(64) UNIQUE NOT NULL,
  "eventId" VARCHAR(64) NOT NULL REFERENCES "Event"("id") ON DELETE CASCADE,
  "tierId" VARCHAR(64) NOT NULL REFERENCES "TicketTier"("id") ON DELETE CASCADE,
  "userId" VARCHAR(64) NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "quantity" INTEGER NOT NULL,
  "unitPrice" INTEGER NOT NULL,
  "totalAmount" INTEGER NOT NULL,
  "status" VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
  "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================
-- RACE CONDITION PROTECTION: ATOMIC STORED FUNCTION WITH ROW LOCK
-- ==============================================================
CREATE OR REPLACE FUNCTION create_ticket_hold(
  p_event_id VARCHAR(64),
  p_tier_id VARCHAR(64),
  p_user_id VARCHAR(64),
  p_quantity INT,
  p_hold_token VARCHAR(64)
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_tier RECORD;
  v_available INT;
  v_cutoff TIMESTAMP WITH TIME ZONE;
BEGIN
  -- 1. Acquire exclusive row lock on TicketTier using SELECT FOR UPDATE
  SELECT * INTO v_tier
  FROM "TicketTier"
  WHERE "id" = p_tier_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'TIER_NOT_FOUND');
  END IF;

  -- 2. Validate event cut-off
  SELECT "salesCutoffAt" INTO v_cutoff FROM "Event" WHERE "id" = p_event_id;
  IF v_cutoff < CURRENT_TIMESTAMP THEN
    RETURN jsonb_build_object('success', false, 'error', 'SALES_CUTOFF_EXCEEDED');
  END IF;

  -- 3. Calculate true atomic availability
  v_available := v_tier."totalCapacity" - v_tier."heldCount" - v_tier."soldCount";
  IF v_available < p_quantity THEN
    RETURN jsonb_build_object('success', false, 'error', 'INSUFFICIENT_INVENTORY', 'available', v_available);
  END IF;

  -- 4. Update held count
  UPDATE "TicketTier"
  SET "heldCount" = "heldCount" + p_quantity
  WHERE "id" = p_tier_id;

  -- 5. Insert hold record with 10-minute expiry
  INSERT INTO "TicketReservationHold" (
    "id", "holdToken", "eventId", "tierId", "userId", "quantity",
    "unitPrice", "totalAmount", "status", "expiresAt"
  ) VALUES (
    'hld_' || gen_random_uuid(),
    p_hold_token,
    p_event_id,
    p_tier_id,
    p_user_id,
    p_quantity,
    v_tier."price",
    v_tier."price" * p_quantity,
    'ACTIVE',
    CURRENT_TIMESTAMP + INTERVAL '10 minutes'
  );

  RETURN jsonb_build_object(
    'success', true,
    'holdToken', p_hold_token,
    'remainingStock', v_available - p_quantity
  );
END;
$$;
`;

export const REDIS_LOCK_SNIPPET = `// src/services/redisLock.ts
import Redis from 'ioredis';
import { v4 as uuidv4 } from 'uuid';

export const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

/**
 * Distributed Lock using Redis SETNX with TTL (Redlock pattern)
 * Guarantees only 1 process can allocate seats at any millisecond.
 */
export async function acquireDistributedLock(
  resourceKey: string,
  ttlMs = 5000,
  maxRetries = 10,
  retryDelayMs = 150
): Promise<string | null> {
  const lockIdentifier = uuidv4();
  const lockKey = \`lock:\${resourceKey}\`;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    // PX: expire in ms, NX: only set if does not exist
    const result = await redis.set(lockKey, lockIdentifier, 'PX', ttlMs, 'NX');
    if (result === 'OK') {
      return lockIdentifier;
    }
    // Exponential jitter backoff
    await new Promise((res) => setTimeout(res, retryDelayMs + Math.random() * 50));
  }
  return null;
}

/**
 * Release lock safely using Lua script (verifies caller owns token)
 */
export async function releaseDistributedLock(
  resourceKey: string,
  lockIdentifier: string
): Promise<boolean> {
  const lockKey = \`lock:\${resourceKey}\`;
  const luaScript = \`
    if redis.call("get", KEYS[1]) == ARGV[1] then
      return redis.call("del", KEYS[1])
    else
      return 0
    end
  \`;

  const result = await redis.eval(luaScript, 1, lockKey, lockIdentifier);
  return result === 1;
}
`;

export const MERMAID_ER_DIAGRAM = `erDiagram
    TENANT ||--o{ USER : "has"
    TENANT ||--o{ EVENT : "hosts"
    TENANT ||--o{ ORDER : "owns"
    
    USER ||--o{ TICKET_RESERVATION_HOLD : "initiates"
    USER ||--o{ ORDER : "places"
    
    EVENT ||--|{ TICKET_TIER : "contains"
    EVENT ||--o{ TICKET_RESERVATION_HOLD : "reserves"
    EVENT ||--o{ ORDER : "contains"
    
    TICKET_TIER ||--o{ TICKET_RESERVATION_HOLD : "holds"
    TICKET_TIER ||--o{ ORDER : "purchases"
    
    ORDER ||--|{ TRANSACTION : "settles"

    TENANT {
        string id PK
        string name
        string slug UK
        string contactEmail
        boolean verified
        datetime createdAt
    }

    USER {
        string id PK
        string tenantId FK
        string email UK
        string password
        string name
        string role "ADMIN | ORGANIZER | ATTENDEE"
        datetime createdAt
    }

    EVENT {
        string id PK
        string tenantId FK
        string title
        string slug
        string venueName
        datetime startsAt
        datetime endsAt
        datetime salesCutoffAt
        string status
    }

    TICKET_TIER {
        string id PK
        string eventId FK
        string name "VIP | GA | EarlyBird"
        int price "in paise (INR)"
        int totalCapacity
        int heldCount "active 10-min holds"
        int soldCount "paid tickets"
        int maxPerOrder
    }

    TICKET_RESERVATION_HOLD {
        string id PK
        string holdToken UK
        string eventId FK
        string tierId FK
        string userId FK
        int quantity
        int totalAmount
        string status "ACTIVE | CONVERTED | EXPIRED"
        datetime expiresAt "now + 10 mins"
    }

    ORDER {
        string id PK
        string orderNumber UK
        string tenantId FK
        string eventId FK
        string userId FK
        string tierId FK
        int quantity
        int totalAmount
        string status "PENDING | PAID | FAILED"
    }

    TRANSACTION {
        string id PK
        string orderId FK
        int amount
        string currency "INR"
        string gateway "RAZORPAY_SIMULATOR"
        string gatewayReference
        string status "PROCESSING | SUCCEEDED | FAILED"
    }
`;
