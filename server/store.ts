import {
  Tenant,
  User,
  Event,
  TicketTier,
  TicketReservationHold,
  Order,
  Transaction,
  WorkerLog,
} from '../src/types/index.ts';

// Pre-seeded tenants
export const tenants: Tenant[] = [
  {
    id: 'tenant_apex',
    name: 'Apex Systems Global Events',
    slug: 'apex-events',
    contactEmail: 'organizer@apexevents.io',
    verified: true,
    createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
  },
  {
    id: 'tenant_echo',
    name: 'Echo Cultural & Festival Productions',
    slug: 'echo-festivals',
    contactEmail: 'contact@echofestivals.com',
    verified: true,
    createdAt: new Date(Date.now() - 45 * 86400000).toISOString(),
  },
];

// Pre-seeded users with distinct roles
export const users: User[] = [
  {
    id: 'user_admin',
    email: 'admin@reservepulse.io',
    name: 'Alex Rivera (Super Admin)',
    role: 'ADMIN',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
  },
  {
    id: 'user_organizer_apex',
    tenantId: 'tenant_apex',
    email: 'marcus@apexevents.io',
    name: 'Marcus Vance (Apex Events)',
    role: 'ORGANIZER',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
  },
  {
    id: 'user_organizer_echo',
    tenantId: 'tenant_echo',
    email: 'elena@echofestivals.com',
    name: 'Elena Rostova (Echo Productions)',
    role: 'ORGANIZER',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80',
  },
  {
    id: 'user_attendee_jane',
    email: 'jane.attendee@gmail.com',
    name: 'Jane Doe (Attendee)',
    role: 'ATTENDEE',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
  },
  {
    id: 'user_attendee_liam',
    email: 'liam.attendee@gmail.com',
    name: 'Liam Chen (Attendee)',
    role: 'ATTENDEE',
  },
];

// Pre-seeded Events & Tiers
export const events: Event[] = [
  {
    id: 'evt_tech_summit_2026',
    tenantId: 'tenant_apex',
    organizerName: 'Apex Systems Global Events',
    title: 'Global AI & Cloud Architecture Summit 2026',
    slug: 'global-ai-cloud-summit-2026',
    description:
      'The premier international engineering conference bringing together 4,000+ distributed systems architects, platform engineers, and AI infrastructure leaders.',
    venueName: 'The Grand Tech Arena, Whitefield',
    city: 'Bengaluru',
    country: 'India',
    isOnline: false,
    startsAt: new Date(Date.now() + 14 * 86400000).toISOString(),
    endsAt: new Date(Date.now() + 16 * 86400000).toISOString(),
    salesCutoffAt: new Date(Date.now() + 13 * 86400000).toISOString(),
    status: 'PUBLISHED',
    category: 'Technology & Engineering',
    bannerImage: '/src/assets/images/event_platform_hero_1793197857426.jpg',
    createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
    tiers: [
      {
        id: 'tier_vip_summit',
        eventId: 'evt_tech_summit_2026',
        name: 'VIP Executive & Speaker Lounge Pass',
        description: 'Priority front row seating, backstage green room access, and private 1:1 speaker roundtables.',
        price: 1499900, // ₹14,999.00
        totalCapacity: 20,
        heldCount: 0,
        soldCount: 18,
        availableCount: 2, // Only 2 remaining! Ideal for concurrency testing
        maxPerOrder: 2,
      },
      {
        id: 'tier_general_summit',
        eventId: 'evt_tech_summit_2026',
        name: 'General Admission Standard Access',
        description: 'Access to all main stages, breakout engineering tracks, expo hall, and official after-party.',
        price: 499900, // ₹4,999.00
        totalCapacity: 150,
        heldCount: 0,
        soldCount: 84,
        availableCount: 66,
        maxPerOrder: 6,
      },
      {
        id: 'tier_early_summit',
        eventId: 'evt_tech_summit_2026',
        name: 'Early Bird Dev Special (Sold Out)',
        description: 'Discounted early pass for open-source contributors and startup engineers.',
        price: 249900, // ₹2,499.00
        totalCapacity: 50,
        heldCount: 0,
        soldCount: 50,
        availableCount: 0,
        maxPerOrder: 4,
      },
    ],
  },
  {
    id: 'evt_sound_gala',
    tenantId: 'tenant_echo',
    organizerName: 'Echo Cultural & Festival Productions',
    title: 'Sunburn & Sound Live Electronic Festival',
    slug: 'sunburn-sound-festival',
    description:
      'Immersive audio-visual performance festival featuring 24 ambient and modern electronic live acts across 3 sensory halls.',
    venueName: 'Jio World Convention Centre, BKC',
    city: 'Mumbai',
    country: 'India',
    isOnline: false,
    startsAt: new Date(Date.now() + 25 * 86400000).toISOString(),
    endsAt: new Date(Date.now() + 27 * 86400000).toISOString(),
    salesCutoffAt: new Date(Date.now() + 24 * 86400000).toISOString(),
    status: 'PUBLISHED',
    category: 'Music & Arts',
    bannerImage: '/src/assets/images/event_platform_hero_1793197857426.jpg',
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    tiers: [
      {
        id: 'tier_front_gala',
        eventId: 'evt_sound_gala',
        name: 'Stage-Side Golden Circle',
        description: 'Unobstructed acoustic sightlines and private festival express bar lane.',
        price: 699900, // ₹6,999.00
        totalCapacity: 60,
        heldCount: 0,
        soldCount: 38,
        availableCount: 22,
        maxPerOrder: 4,
      },
      {
        id: 'tier_std_gala',
        eventId: 'evt_sound_gala',
        name: 'General Festival Admission',
        description: 'Access to all 3 stages and art installations across all 3 festival nights.',
        price: 219900, // ₹2,199.00
        totalCapacity: 250,
        heldCount: 0,
        soldCount: 110,
        availableCount: 140,
        maxPerOrder: 8,
      },
    ],
  },
];

// In-Memory store tables
export const holds: TicketReservationHold[] = [];
export const orders: Order[] = [
  {
    id: 'ord_sample_101',
    orderNumber: 'RP-2026-9812',
    eventId: 'evt_tech_summit_2026',
    eventTitle: 'Global AI & Cloud Architecture Summit 2026',
    tenantId: 'tenant_apex',
    userId: 'user_attendee_liam',
    attendeeName: 'Liam Chen',
    attendeeEmail: 'liam.attendee@gmail.com',
    tierId: 'tier_vip_summit',
    tierName: 'VIP Executive & Speaker Lounge Pass',
    quantity: 1,
    unitPrice: 1499900,
    totalAmount: 1499900,
    status: 'PAID',
    holdToken: 'sample_hold_past',
    transactionId: 'txn_sample_101',
    createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
  {
    id: 'ord_sample_102',
    orderNumber: 'RP-2026-9813',
    eventId: 'evt_tech_summit_2026',
    eventTitle: 'Global AI & Cloud Architecture Summit 2026',
    tenantId: 'tenant_apex',
    userId: 'user_attendee_jane',
    attendeeName: 'Jane Doe',
    attendeeEmail: 'jane.attendee@gmail.com',
    tierId: 'tier_general_summit',
    tierName: 'General Admission Standard Access',
    quantity: 2,
    unitPrice: 499900,
    totalAmount: 999800,
    status: 'PAID',
    holdToken: 'sample_hold_past_2',
    transactionId: 'txn_sample_102',
    createdAt: new Date(Date.now() - 4 * 3600000).toISOString(),
  },
];

export const transactions: Transaction[] = [
  {
    id: 'txn_sample_101',
    orderId: 'ord_sample_101',
    amount: 1499900,
    currency: 'INR',
    gateway: 'RAZORPAY_SIMULATOR',
    gatewayReference: 'pay_sim_892301982',
    status: 'SUCCEEDED',
    createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
  {
    id: 'txn_sample_102',
    orderId: 'ord_sample_102',
    amount: 999800,
    currency: 'INR',
    gateway: 'RAZORPAY_SIMULATOR',
    gatewayReference: 'pay_sim_892301983',
    status: 'SUCCEEDED',
    createdAt: new Date(Date.now() - 4 * 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 4 * 3600000).toISOString(),
  },
];

export const workerLogs: WorkerLog[] = [
  {
    id: 'log_init',
    timestamp: new Date().toISOString(),
    action: 'SWEEP_CLEAN',
    holdToken: 'system_boot',
    tierName: 'System Expiry Worker',
    quantity: 0,
    details: 'Hold expiry worker initialized. Polling interval: 3000ms. TTL: 10 minutes.',
  },
];

// Redis / PostgreSQL Atomic Mutex Simulation
// In PostgreSQL, concurrency is protected by:
// `SELECT * FROM "TicketTier" WHERE id = $1 FOR UPDATE;`
// In Redis, concurrency is protected by:
// `SETNX lock:tier:123 lock_id PX 3000`
// This in-memory mutex queues concurrent execution of resource blocks sequentially.
class AsyncMutex {
  private queue: Array<() => void> = [];
  private locked = false;

  async acquire(): Promise<() => void> {
    return new Promise((resolve) => {
      const run = () => {
        this.locked = true;
        resolve(() => {
          this.locked = false;
          const next = this.queue.shift();
          if (next) {
            next();
          }
        });
      };

      if (!this.locked) {
        run();
      } else {
        this.queue.push(run);
      }
    });
  }
}

const resourceLocks = new Map<string, AsyncMutex>();

export async function withAtomicLock<T>(resourceKey: string, task: () => Promise<T>): Promise<T> {
  let mutex = resourceLocks.get(resourceKey);
  if (!mutex) {
    mutex = new AsyncMutex();
    resourceLocks.set(resourceKey, mutex);
  }

  const release = await mutex.acquire();
  try {
    return await task();
  } finally {
    release();
  }
}
