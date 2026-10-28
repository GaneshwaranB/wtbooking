export type Role = 'ADMIN' | 'ORGANIZER' | 'ATTENDEE';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  contactEmail: string;
  verified: boolean;
  createdAt: string;
}

export interface User {
  id: string;
  tenantId?: string; // null for super admin
  email: string;
  name: string;
  role: Role;
  avatarUrl?: string;
}

export interface TicketTier {
  id: string;
  eventId: string;
  name: string;
  description: string;
  price: number; // in USD cents (e.g. 15000 = $150.00)
  totalCapacity: number;
  heldCount: number;
  soldCount: number;
  availableCount: number; // totalCapacity - heldCount - soldCount
  maxPerOrder: number;
}

export interface Event {
  id: string;
  tenantId: string;
  organizerName: string;
  title: string;
  slug: string;
  description: string;
  venueName: string;
  city: string;
  country: string;
  isOnline: boolean;
  startsAt: string;
  endsAt: string;
  salesCutoffAt: string;
  status: 'DRAFT' | 'PUBLISHED' | 'SOLD_OUT' | 'ARCHIVED';
  category: string;
  bannerImage: string;
  tiers: TicketTier[];
  createdAt: string;
}

export interface TicketReservationHold {
  id: string;
  holdToken: string;
  eventId: string;
  eventTitle: string;
  tierId: string;
  tierName: string;
  unitPrice: number;
  quantity: number;
  totalAmount: number;
  userId: string;
  attendeeName: string;
  attendeeEmail: string;
  status: 'ACTIVE' | 'CONVERTED' | 'EXPIRED' | 'CANCELLED';
  expiresAt: number; // Epoch timestamp ms
  createdAt: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  eventId: string;
  eventTitle: string;
  tenantId: string;
  userId: string;
  attendeeName: string;
  attendeeEmail: string;
  tierId: string;
  tierName: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  holdToken: string;
  transactionId?: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  orderId: string;
  amount: number;
  currency: string;
  gateway: string;
  gatewayReference: string;
  status: 'PROCESSING' | 'SUCCEEDED' | 'FAILED';
  failureReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkerLog {
  id: string;
  timestamp: string;
  action: 'HOLD_EXPIRED' | 'HOLD_CREATED' | 'HOLD_CONVERTED' | 'HOLD_CANCELLED' | 'SWEEP_CLEAN';
  holdToken: string;
  tierName: string;
  quantity: number;
  details: string;
}

export interface ConcurrencyTestResult {
  totalRequests: number;
  successfulHolds: number;
  conflictedRequests: number; // 409
  totalTimeMs: number;
  initialStock: number;
  remainingStock: number;
  logs: Array<{
    reqId: number;
    userId: string;
    status: 'SUCCESS' | 'CONFLICT';
    durationMs: number;
    message: string;
    timestamp: string;
  }>;
}

export interface OrganizerAnalytics {
  totalRevenue: number;
  totalTicketsSold: number;
  totalActiveHolds: number;
  totalHoldsCreated: number;
  conversionRate: number; // (sold / total holds created) * 100
  averageOrderValue: number;
  tierBreakdown: Array<{
    tierId: string;
    tierName: string;
    sold: number;
    held: number;
    capacity: number;
    revenue: number;
  }>;
  recentOrders: Order[];
}
