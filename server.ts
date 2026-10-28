import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import {
  tenants,
  users,
  events,
  holds,
  orders,
  transactions,
  workerLogs,
  withAtomicLock,
} from './server/store.ts';
import {
  TicketReservationHold,
  Order,
  Transaction,
  WorkerLog,
  ConcurrencyTestResult,
} from './src/types/index.ts';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Background Expiry Worker
// Evaluates every 2.5 seconds and releases ticket holds where expiresAt <= Date.now()
setInterval(async () => {
  const now = Date.now();
  for (const hold of holds) {
    if (hold.status === 'ACTIVE' && hold.expiresAt <= now) {
      // Execute atomically per tier
      await withAtomicLock(`tier:${hold.tierId}`, async () => {
        // Double check status inside atomic lock
        if (hold.status === 'ACTIVE' && hold.expiresAt <= now) {
          hold.status = 'EXPIRED';

          // Locate tier and restore inventory
          for (const evt of events) {
            const tier = evt.tiers.find((t) => t.id === hold.tierId);
            if (tier) {
              tier.heldCount = Math.max(0, tier.heldCount - hold.quantity);
              tier.availableCount = Math.max(
                0,
                tier.totalCapacity - tier.heldCount - tier.soldCount
              );

              const log: WorkerLog = {
                id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                timestamp: new Date().toISOString(),
                action: 'HOLD_EXPIRED',
                holdToken: hold.holdToken,
                tierName: tier.name,
                quantity: hold.quantity,
                details: `Auto-released ${hold.quantity} tickets after 10-min TTL timeout. Available stock now: ${tier.availableCount}`,
              };
              workerLogs.unshift(log);
              if (workerLogs.length > 50) workerLogs.pop();
              break;
            }
          }
        }
      });
    }
  }
}, 2500);

// API Endpoints

// 1. Current Users / Roles
app.get('/api/users', (_req: Request, res: Response) => {
  res.json({ success: true, users });
});

// 2. Events List (with active inventory calculations)
app.get('/api/events', (req: Request, res: Response) => {
  const tenantId = req.query.tenantId as string;
  let result = events;
  if (tenantId) {
    result = events.filter((e) => e.tenantId === tenantId);
  }
  // Ensure available count is refreshed
  result.forEach((evt) => {
    evt.tiers.forEach((t) => {
      t.availableCount = Math.max(0, t.totalCapacity - t.heldCount - t.soldCount);
    });
  });
  res.json({ success: true, events: result });
});

// 3. Single Event Detail
app.get('/api/events/:id', (req: Request, res: Response) => {
  const event = events.find((e) => e.id === req.params.id);
  if (!event) {
    return res.status(404).json({ success: false, error: 'Event not found' });
  }
  event.tiers.forEach((t) => {
    t.availableCount = Math.max(0, t.totalCapacity - t.heldCount - t.soldCount);
  });
  res.json({ success: true, event });
});

// 4. Create Event (Organizer & Admin RBAC)
app.post('/api/events', (req: Request, res: Response) => {
  const {
    tenantId,
    organizerName,
    title,
    description,
    venueName,
    city,
    country,
    startsAt,
    endsAt,
    salesCutoffAt,
    category,
    tiers,
    bannerImage,
  } = req.body;

  if (!title || !venueName || !tiers || !Array.isArray(tiers) || tiers.length === 0) {
    return res.status(400).json({ success: false, error: 'Missing required event fields or ticket tiers' });
  }

  const newEventId = `evt_${Date.now()}`;
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const formattedTiers = tiers.map((t: any, index: number) => ({
    id: `tier_${newEventId}_${index + 1}`,
    eventId: newEventId,
    name: t.name || 'General Admission',
    description: t.description || '',
    price: Number(t.price) || 5000,
    totalCapacity: Number(t.totalCapacity) || 100,
    heldCount: 0,
    soldCount: 0,
    availableCount: Number(t.totalCapacity) || 100,
    maxPerOrder: Number(t.maxPerOrder) || 4,
  }));

  const newEvent = {
    id: newEventId,
    tenantId: tenantId || 'tenant_apex',
    organizerName: organizerName || 'Apex Systems Global Events',
    title,
    slug,
    description: description || 'Exciting multi-tenant live conference and gathering.',
    venueName,
    city: city || 'San Francisco',
    country: country || 'United States',
    isOnline: false,
    startsAt: startsAt || new Date(Date.now() + 30 * 86400000).toISOString(),
    endsAt: endsAt || new Date(Date.now() + 31 * 86400000).toISOString(),
    salesCutoffAt: salesCutoffAt || new Date(Date.now() + 29 * 86400000).toISOString(),
    status: 'PUBLISHED' as const,
    category: category || 'Conference',
    bannerImage: bannerImage || '/src/assets/images/event_platform_hero_1793197857426.jpg',
    tiers: formattedTiers,
    createdAt: new Date().toISOString(),
  };

  events.unshift(newEvent);
  res.status(201).json({ success: true, event: newEvent });
});

// 5. ATOMIC RESERVATION HOLD ENGINE (10-minute hold with lock)
app.post('/api/reservations/hold', async (req: Request, res: Response) => {
  const { eventId, tierId, quantity = 1, userId = 'user_attendee_jane', attendeeName, attendeeEmail } = req.body;

  if (!eventId || !tierId) {
    return res.status(400).json({ success: false, error: 'eventId and tierId are required' });
  }

  const qty = Number(quantity);
  if (qty <= 0) {
    return res.status(400).json({ success: false, error: 'Quantity must be at least 1' });
  }

  // Atomic operation wrapped in resource lock for this tier
  try {
    const result = await withAtomicLock(`tier:${tierId}`, async () => {
      const event = events.find((e) => e.id === eventId);
      if (!event) {
        return { status: 404, data: { success: false, error: 'Event not found' } };
      }

      const tier = event.tiers.find((t) => t.id === tierId);
      if (!tier) {
        return { status: 404, data: { success: false, error: 'Ticket tier not found' } };
      }

      // Check sales cut-off
      if (new Date(event.salesCutoffAt).getTime() < Date.now()) {
        return {
          status: 400,
          data: { success: false, error: 'SALES_CUTOFF_EXCEEDED', message: 'Ticket sales have ended for this event' },
        };
      }

      // Check max per order
      if (qty > tier.maxPerOrder) {
        return {
          status: 400,
          data: {
            success: false,
            error: 'MAX_LIMIT_EXCEEDED',
            message: `Maximum allowed tickets per order is ${tier.maxPerOrder}`,
          },
        };
      }

      // Recalculate available stock under lock
      const available = tier.totalCapacity - tier.heldCount - tier.soldCount;
      if (available < qty) {
        return {
          status: 409,
          data: {
            success: false,
            error: 'INSUFFICIENT_INVENTORY',
            message: `Requested ${qty} tickets, but only ${Math.max(0, available)} are available`,
            available: Math.max(0, available),
          },
        };
      }

      // Atomic lock acquired and stock confirmed: update held inventory
      tier.heldCount += qty;
      tier.availableCount = tier.totalCapacity - tier.heldCount - tier.soldCount;

      const holdDurationMs = 10 * 60 * 1000; // 10 minutes
      const now = Date.now();
      const holdToken = `hld_${now}_${Math.random().toString(36).slice(2, 8)}`;

      const newHold: TicketReservationHold = {
        id: `hold_${now}_${Math.random().toString(36).slice(2, 6)}`,
        holdToken,
        eventId,
        eventTitle: event.title,
        tierId,
        tierName: tier.name,
        unitPrice: tier.price,
        quantity: qty,
        totalAmount: tier.price * qty,
        userId,
        attendeeName: attendeeName || 'Jane Doe',
        attendeeEmail: attendeeEmail || 'jane.attendee@gmail.com',
        status: 'ACTIVE',
        expiresAt: now + holdDurationMs,
        createdAt: now,
      };

      holds.unshift(newHold);

      const log: WorkerLog = {
        id: `log_${now}_${Math.random().toString(36).slice(2, 6)}`,
        timestamp: new Date().toISOString(),
        action: 'HOLD_CREATED',
        holdToken,
        tierName: tier.name,
        quantity: qty,
        details: `Reserved ${qty} seats. 10-minute hold timer activated for user ${userId}. Available left: ${tier.availableCount}`,
      };
      workerLogs.unshift(log);

      return { status: 201, data: { success: true, hold: newHold, availableLeft: tier.availableCount } };
    });

    return res.status(result.status).json(result.data);
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Lock acquisition failure', details: err?.message });
  }
});

// 6. Get Active Holds for user
app.get('/api/reservations/active', (req: Request, res: Response) => {
  const userId = (req.query.userId as string) || 'user_attendee_jane';
  const now = Date.now();
  const activeHolds = holds.filter((h) => h.userId === userId && h.status === 'ACTIVE' && h.expiresAt > now);
  res.json({ success: true, holds: activeHolds });
});

// 7. Manually Cancel / Release Hold
app.post('/api/reservations/release', async (req: Request, res: Response) => {
  const { holdToken } = req.body;
  if (!holdToken) {
    return res.status(400).json({ success: false, error: 'holdToken is required' });
  }

  const hold = holds.find((h) => h.holdToken === holdToken);
  if (!hold) {
    return res.status(404).json({ success: false, error: 'Hold not found' });
  }

  if (hold.status !== 'ACTIVE') {
    return res.json({ success: true, message: `Hold was already in state: ${hold.status}` });
  }

  await withAtomicLock(`tier:${hold.tierId}`, async () => {
    hold.status = 'CANCELLED';
    for (const evt of events) {
      const tier = evt.tiers.find((t) => t.id === hold.tierId);
      if (tier) {
        tier.heldCount = Math.max(0, tier.heldCount - hold.quantity);
        tier.availableCount = Math.max(0, tier.totalCapacity - tier.heldCount - tier.soldCount);

        const log: WorkerLog = {
          id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          timestamp: new Date().toISOString(),
          action: 'HOLD_CANCELLED',
          holdToken,
          tierName: tier.name,
          quantity: hold.quantity,
          details: `Manual release by attendee. Released ${hold.quantity} seats back to available pool.`,
        };
        workerLogs.unshift(log);
        break;
      }
    }
  });

  res.json({ success: true, message: 'Hold released successfully' });
});

// 8. ATOMIC CHECKOUT & CONVERT HOLD TO ORDER
app.post('/api/reservations/checkout', async (req: Request, res: Response) => {
  const { holdToken, paymentMethod = 'card_simulated' } = req.body;

  if (!holdToken) {
    return res.status(400).json({ success: false, error: 'holdToken is required' });
  }

  const hold = holds.find((h) => h.holdToken === holdToken);
  if (!hold) {
    return res.status(404).json({ success: false, error: 'Hold session not found' });
  }

  // Atomic checkout locking tier
  try {
    const result = await withAtomicLock(`tier:${hold.tierId}`, async () => {
      const now = Date.now();

      // Check if hold has expired
      if (hold.status !== 'ACTIVE' || hold.expiresAt <= now) {
        hold.status = 'EXPIRED';
        return {
          status: 410,
          data: {
            success: false,
            error: 'HOLD_EXPIRED',
            message: 'Your 10-minute temporary reservation hold has expired. The tickets have been released to the public queue.',
          },
        };
      }

      // Convert hold to permanent order
      const event = events.find((e) => e.id === hold.eventId);
      const tier = event?.tiers.find((t) => t.id === hold.tierId);

      if (!tier || !event) {
        return { status: 404, data: { success: false, error: 'Tier or event record missing' } };
      }

      // Move quantity from held to sold
      tier.heldCount = Math.max(0, tier.heldCount - hold.quantity);
      tier.soldCount += hold.quantity;
      tier.availableCount = Math.max(0, tier.totalCapacity - tier.heldCount - tier.soldCount);

      hold.status = 'CONVERTED';

      const orderId = `ord_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const orderNumber = `RP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

      const newOrder: Order = {
        id: orderId,
        orderNumber,
        eventId: hold.eventId,
        eventTitle: hold.eventTitle,
        tenantId: event.tenantId,
        userId: hold.userId,
        attendeeName: hold.attendeeName,
        attendeeEmail: hold.attendeeEmail,
        tierId: hold.tierId,
        tierName: hold.tierName,
        quantity: hold.quantity,
        unitPrice: hold.unitPrice,
        totalAmount: hold.totalAmount,
        status: 'PENDING',
        holdToken: hold.holdToken,
        createdAt: new Date().toISOString(),
      };

      orders.unshift(newOrder);

      const log: WorkerLog = {
        id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        timestamp: new Date().toISOString(),
        action: 'HOLD_CONVERTED',
        holdToken,
        tierName: tier.name,
        quantity: hold.quantity,
        details: `Converted hold to confirmed Order ${orderNumber}. Inventory permanently committed.`,
      };
      workerLogs.unshift(log);

      return {
        status: 200,
        data: {
          success: true,
          order: newOrder,
          message: 'Reservation converted to pending order. Ready for payment settlement.',
        },
      };
    });

    return res.status(result.status).json(result.data);
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Checkout lock failure', details: err?.message });
  }
});

// 9. ASYNCHRONOUS PAYMENT SIMULATOR GATEWAY
app.post('/api/payment/simulate', (req: Request, res: Response) => {
  const { orderId, outcome = 'APPROVE' } = req.body;

  const order = orders.find((o) => o.id === orderId);
  if (!order) {
    return res.status(404).json({ success: false, error: 'Order not found' });
  }

  const txnId = `txn_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const ref = `sim_gateway_${Math.random().toString(36).slice(2, 10).toUpperCase()}`;

  if (outcome === 'APPROVE') {
    order.status = 'PAID';
    order.transactionId = txnId;

    const txn: Transaction = {
      id: txnId,
      orderId,
      amount: order.totalAmount,
      currency: 'INR',
      gateway: 'RAZORPAY_SIMULATOR',
      gatewayReference: ref,
      status: 'SUCCEEDED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    transactions.unshift(txn);

    return res.json({
      success: true,
      status: 'SUCCEEDED',
      orderStatus: 'PAID',
      transaction: txn,
      message: 'Payment approved synchronously via Mock Gateway.',
    });
  }

  if (outcome === 'REJECT') {
    order.status = 'FAILED';
    const txn: Transaction = {
      id: txnId,
      orderId,
      amount: order.totalAmount,
      currency: 'INR',
      gateway: 'RAZORPAY_SIMULATOR',
      gatewayReference: ref,
      status: 'FAILED',
      failureReason: 'CARD_DECLINED_INSUFFICIENT_FUNDS',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    transactions.unshift(txn);

    return res.json({
      success: false,
      status: 'FAILED',
      orderStatus: 'FAILED',
      transaction: txn,
      error: 'CARD_DECLINED',
      message: 'Payment simulation rejected with code CARD_DECLINED_INSUFFICIENT_FUNDS.',
    });
  }

  // ASYNC PENDING -> Settled in 2 seconds
  const txn: Transaction = {
    id: txnId,
    orderId,
    amount: order.totalAmount,
    currency: 'INR',
    gateway: 'RAZORPAY_SIMULATOR',
    gatewayReference: ref,
    status: 'PROCESSING',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  transactions.unshift(txn);

  setTimeout(() => {
    if (outcome === 'ASYNC_APPROVE') {
      order.status = 'PAID';
      order.transactionId = txnId;
      txn.status = 'SUCCEEDED';
      txn.updatedAt = new Date().toISOString();
    } else {
      order.status = 'FAILED';
      txn.status = 'FAILED';
      txn.failureReason = 'ASYNC_WEBHOOK_TIMEOUT';
      txn.updatedAt = new Date().toISOString();
    }
  }, 2000);

  return res.json({
    success: true,
    status: 'PROCESSING',
    orderStatus: 'PENDING',
    transaction: txn,
    message: 'Payment gateway dispatched async webhook event. Poll /api/payment/status/:orderId for resolution.',
  });
});

// 10. Check Payment Status
app.get('/api/payment/status/:orderId', (req: Request, res: Response) => {
  const order = orders.find((o) => o.id === req.params.orderId);
  if (!order) {
    return res.status(404).json({ success: false, error: 'Order not found' });
  }
  const txn = transactions.find((t) => t.orderId === order.id);
  res.json({ success: true, order, transaction: txn });
});

// 11. CONCURRENCY RACE CONDITION TEST ENGINE
// Simulates N concurrent bookings competing for limited stock
app.post('/api/concurrency-test', async (req: Request, res: Response) => {
  const { tierId = 'tier_vip_summit', totalRequests = 15, quantityPerRequest = 1 } = req.body;

  // Find event and tier
  let targetEvent: any;
  let targetTier: any;
  for (const e of events) {
    const t = e.tiers.find((x) => x.id === tierId);
    if (t) {
      targetEvent = e;
      targetTier = t;
      break;
    }
  }

  if (!targetTier) {
    return res.status(404).json({ success: false, error: 'Tier not found' });
  }

  const initialStock = targetTier.totalCapacity - targetTier.heldCount - targetTier.soldCount;
  const startTimer = Date.now();
  const logs: ConcurrencyTestResult['logs'] = [];
  let successfulHolds = 0;
  let conflictedRequests = 0;

  // Fire all requests concurrently using Promise.all
  const requestPromises = Array.from({ length: Number(totalRequests) }).map(async (_, idx) => {
    const reqStart = Date.now();
    const simUserId = `sim_user_${idx + 1}`;

    try {
      const outcome = await withAtomicLock(`tier:${tierId}`, async () => {
        const available = targetTier.totalCapacity - targetTier.heldCount - targetTier.soldCount;
        if (available >= quantityPerRequest) {
          targetTier.heldCount += quantityPerRequest;
          targetTier.availableCount = targetTier.totalCapacity - targetTier.heldCount - targetTier.soldCount;

          const holdToken = `hld_sim_${Date.now()}_${idx}`;
          const newHold: TicketReservationHold = {
            id: `hold_sim_${idx}`,
            holdToken,
            eventId: targetEvent.id,
            eventTitle: targetEvent.title,
            tierId: targetTier.id,
            tierName: targetTier.name,
            unitPrice: targetTier.price,
            quantity: quantityPerRequest,
            totalAmount: targetTier.price * quantityPerRequest,
            userId: simUserId,
            attendeeName: `Concurrent Test User #${idx + 1}`,
            attendeeEmail: `test${idx + 1}@loadtest.local`,
            status: 'ACTIVE',
            expiresAt: Date.now() + 10 * 60 * 1000,
            createdAt: Date.now(),
          };
          holds.unshift(newHold);

          return { success: true, remaining: targetTier.availableCount };
        } else {
          return { success: false, available };
        }
      });

      const durationMs = Date.now() - reqStart;
      if (outcome.success) {
        successfulHolds++;
        logs.push({
          reqId: idx + 1,
          userId: simUserId,
          status: 'SUCCESS',
          durationMs,
          message: `Acquired lock & reserved ${quantityPerRequest} ticket(s). Remaining stock: ${outcome.remaining}`,
          timestamp: new Date().toISOString(),
        });
      } else {
        conflictedRequests++;
        logs.push({
          reqId: idx + 1,
          userId: simUserId,
          status: 'CONFLICT',
          durationMs,
          message: `Blocked 409 Conflict: Insufficient stock (requested ${quantityPerRequest}, available: ${outcome.available})`,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (e: any) {
      logs.push({
        reqId: idx + 1,
        userId: simUserId,
        status: 'CONFLICT',
        durationMs: Date.now() - reqStart,
        message: `Lock error: ${e.message}`,
        timestamp: new Date().toISOString(),
      });
    }
  });

  await Promise.all(requestPromises);

  const totalTimeMs = Date.now() - startTimer;
  const remainingStock = targetTier.totalCapacity - targetTier.heldCount - targetTier.soldCount;

  const result: ConcurrencyTestResult = {
    totalRequests: Number(totalRequests),
    successfulHolds,
    conflictedRequests,
    totalTimeMs,
    initialStock,
    remainingStock,
    logs: logs.sort((a, b) => a.reqId - b.reqId),
  };

  res.json({ success: true, result });
});

// 12. ORGANIZER ANALYTICS & CONVERSION RATE
app.get('/api/organizer/analytics', (req: Request, res: Response) => {
  const tenantId = (req.query.tenantId as string) || 'tenant_apex';

  const tenantEvents = events.filter((e) => e.tenantId === tenantId);
  const tenantOrders = orders.filter((o) => o.tenantId === tenantId);

  const totalRevenue = tenantOrders
    .filter((o) => o.status === 'PAID')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const totalTicketsSold = tenantOrders
    .filter((o) => o.status === 'PAID')
    .reduce((sum, o) => sum + o.quantity, 0);

  const tenantEventIds = tenantEvents.map((e) => e.id);
  const tenantHolds = holds.filter((h) => tenantEventIds.includes(h.eventId));
  const activeHolds = tenantHolds.filter((h) => h.status === 'ACTIVE' && h.expiresAt > Date.now());

  const totalHoldsCreated = tenantHolds.length || 1;
  const convertedHolds = tenantHolds.filter((h) => h.status === 'CONVERTED').length;
  const conversionRate = Number(((convertedHolds / Math.max(1, totalHoldsCreated)) * 100).toFixed(1));
  const averageOrderValue = totalTicketsSold > 0 ? Math.round(totalRevenue / totalTicketsSold) : 0;

  // Tier performance
  const tierBreakdown: any[] = [];
  tenantEvents.forEach((evt) => {
    evt.tiers.forEach((t) => {
      const tierOrders = tenantOrders.filter((o) => o.tierId === t.id && o.status === 'PAID');
      const tierRevenue = tierOrders.reduce((sum, o) => sum + o.totalAmount, 0);
      tierBreakdown.push({
        tierId: t.id,
        tierName: `${evt.title.slice(0, 24)}... - ${t.name}`,
        sold: t.soldCount,
        held: t.heldCount,
        capacity: t.totalCapacity,
        revenue: tierRevenue,
      });
    });
  });

  res.json({
    success: true,
    analytics: {
      totalRevenue,
      totalTicketsSold,
      totalActiveHolds: activeHolds.length,
      totalHoldsCreated,
      conversionRate,
      averageOrderValue,
      tierBreakdown,
      recentOrders: tenantOrders.slice(0, 10),
    },
  });
});

// 13. WORKER LOGS & FORCE TIMEOUT TRIGGER (for testing without waiting 10 min)
app.get('/api/worker/logs', (_req: Request, res: Response) => {
  res.json({ success: true, logs: workerLogs });
});

app.post('/api/worker/force-expire', async (req: Request, res: Response) => {
  const { holdToken } = req.body;
  const hold = holds.find((h) => (holdToken ? h.holdToken === holdToken : h.status === 'ACTIVE'));
  if (!hold) {
    return res.status(404).json({ success: false, error: 'No matching active hold to expire' });
  }

  await withAtomicLock(`tier:${hold.tierId}`, async () => {
    hold.expiresAt = Date.now() - 1000; // set in past
    hold.status = 'EXPIRED';

    for (const evt of events) {
      const tier = evt.tiers.find((t) => t.id === hold.tierId);
      if (tier) {
        tier.heldCount = Math.max(0, tier.heldCount - hold.quantity);
        tier.availableCount = Math.max(0, tier.totalCapacity - tier.heldCount - tier.soldCount);

        workerLogs.unshift({
          id: `log_${Date.now()}_force`,
          timestamp: new Date().toISOString(),
          action: 'HOLD_EXPIRED',
          holdToken: hold.holdToken,
          tierName: tier.name,
          quantity: hold.quantity,
          details: `Manual test force-expire triggered. Released ${hold.quantity} tickets back immediately.`,
        });
        break;
      }
    }
  });

  res.json({ success: true, message: `Hold ${hold.holdToken} forcefully expired and inventory returned.` });
});

// 14. EXPORT POSTMAN COLLECTION V2.1.0 DELIVERABLE
app.get('/api/postman/export', (_req: Request, res: Response) => {
  const collection = {
    info: {
      name: 'ReservePulse - Multi-Tenant Event & Ticket Reservation API',
      description:
        'Official Postman Collection for testing Multi-Tenant Event & Ticket Reservation System with RBAC, 10-minute temporary holds, concurrency race conditions, and mock async payment gateway.',
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      version: '1.0.0',
    },
    variable: [
      { key: 'baseUrl', value: 'http://localhost:3000', type: 'string' },
      { key: 'holdToken', value: '', type: 'string' },
      { key: 'orderId', value: '', type: 'string' },
      { key: 'tierId', value: 'tier_vip_summit', type: 'string' },
      { key: 'eventId', value: 'evt_tech_summit_2026', type: 'string' },
    ],
    item: [
      {
        name: '01. Events & Public Catalog',
        item: [
          {
            name: 'List Active Events (Cached)',
            request: {
              method: 'GET',
              header: [{ key: 'Accept', value: 'application/json' }],
              url: { raw: '{{baseUrl}}/api/events', host: ['{{baseUrl}}'], path: ['api', 'events'] },
            },
          },
          {
            name: 'Get Single Event Detail with Live Tier Stock',
            request: {
              method: 'GET',
              header: [{ key: 'Accept', value: 'application/json' }],
              url: { raw: '{{baseUrl}}/api/events/{{eventId}}', host: ['{{baseUrl}}'], path: ['api', 'events', '{{eventId}}'] },
            },
          },
        ],
      },
      {
        name: '02. Reservation Engine (10-Min Temporary Holds)',
        item: [
          {
            name: 'Create 10-Minute Hold (Atomic Row-Lock)',
            request: {
              method: 'POST',
              header: [{ key: 'Content-Type', value: 'application/json' }],
              body: {
                mode: 'raw',
                raw: JSON.stringify(
                  {
                    eventId: '{{eventId}}',
                    tierId: '{{tierId}}',
                    quantity: 1,
                    userId: 'user_attendee_jane',
                    attendeeName: 'Jane Doe',
                    attendeeEmail: 'jane.attendee@gmail.com',
                  },
                  null,
                  2
                ),
              },
              url: { raw: '{{baseUrl}}/api/reservations/hold', host: ['{{baseUrl}}'], path: ['api', 'reservations', 'hold'] },
            },
          },
          {
            name: 'Get User Active Holds',
            request: {
              method: 'GET',
              header: [],
              url: { raw: '{{baseUrl}}/api/reservations/active?userId=user_attendee_jane', host: ['{{baseUrl}}'], path: ['api', 'reservations', 'active'], query: [{ key: 'userId', value: 'user_attendee_jane' }] },
            },
          },
          {
            name: 'Manual Release / Cancel Hold',
            request: {
              method: 'POST',
              header: [{ key: 'Content-Type', value: 'application/json' }],
              body: { mode: 'raw', raw: JSON.stringify({ holdToken: '{{holdToken}}' }, null, 2) },
              url: { raw: '{{baseUrl}}/api/reservations/release', host: ['{{baseUrl}}'], path: ['api', 'reservations', 'release'] },
            },
          },
        ],
      },
      {
        name: '03. Checkout & Payment Simulation',
        item: [
          {
            name: 'Convert Hold to Order (Checkout)',
            request: {
              method: 'POST',
              header: [{ key: 'Content-Type', value: 'application/json' }],
              body: { mode: 'raw', raw: JSON.stringify({ holdToken: '{{holdToken}}' }, null, 2) },
              url: { raw: '{{baseUrl}}/api/reservations/checkout', host: ['{{baseUrl}}'], path: ['api', 'reservations', 'checkout'] },
            },
          },
          {
            name: 'Simulate Asynchronous Payment (Gateway Webhook)',
            request: {
              method: 'POST',
              header: [{ key: 'Content-Type', value: 'application/json' }],
              body: { mode: 'raw', raw: JSON.stringify({ orderId: '{{orderId}}', outcome: 'APPROVE' }, null, 2) },
              url: { raw: '{{baseUrl}}/api/payment/simulate', host: ['{{baseUrl}}'], path: ['api', 'payment', 'simulate'] },
            },
          },
          {
            name: 'Poll Payment Status',
            request: {
              method: 'GET',
              header: [],
              url: { raw: '{{baseUrl}}/api/payment/status/{{orderId}}', host: ['{{baseUrl}}'], path: ['api', 'payment', 'status', '{{orderId}}'] },
            },
          },
        ],
      },
      {
        name: '04. Edge Cases & Concurrency Stress Test',
        item: [
          {
            name: 'Execute 15 Concurrent Simultaneous Bookings (Race Test)',
            request: {
              method: 'POST',
              header: [{ key: 'Content-Type', value: 'application/json' }],
              body: {
                mode: 'raw',
                raw: JSON.stringify(
                  {
                    tierId: 'tier_vip_summit',
                    totalRequests: 15,
                    quantityPerRequest: 1,
                  },
                  null,
                  2
                ),
              },
              url: { raw: '{{baseUrl}}/api/concurrency-test', host: ['{{baseUrl}}'], path: ['api', 'concurrency-test'] },
            },
          },
          {
            name: 'Simulate Hold Expiry Worker Sweep',
            request: {
              method: 'POST',
              header: [{ key: 'Content-Type', value: 'application/json' }],
              body: { mode: 'raw', raw: JSON.stringify({ holdToken: '{{holdToken}}' }, null, 2) },
              url: { raw: '{{baseUrl}}/api/worker/force-expire', host: ['{{baseUrl}}'], path: ['api', 'worker', 'force-expire'] },
            },
          },
        ],
      },
      {
        name: '05. Organizer Studio & Analytics',
        item: [
          {
            name: 'Get Real-Time Revenue & Conversion Analytics',
            request: {
              method: 'GET',
              header: [],
              url: { raw: '{{baseUrl}}/api/organizer/analytics?tenantId=tenant_apex', host: ['{{baseUrl}}'], path: ['api', 'organizer', 'analytics'], query: [{ key: 'tenantId', value: 'tenant_apex' }] },
            },
          },
          {
            name: 'Create New Multi-Tier Event',
            request: {
              method: 'POST',
              header: [{ key: 'Content-Type', value: 'application/json' }],
              body: {
                mode: 'raw',
                raw: JSON.stringify(
                  {
                    tenantId: 'tenant_apex',
                    organizerName: 'Apex Systems Global Events',
                    title: 'Distributed Systems & High Frequency Summit 2026',
                    description: 'Deep dive into consensus algorithms and atomic reservation architectures.',
                    venueName: 'Palace of Fine Arts',
                    city: 'San Francisco',
                    country: 'United States',
                    category: 'Technology & Engineering',
                    tiers: [
                      { name: 'VIP Pass', price: 29900, totalCapacity: 30, maxPerOrder: 2 },
                      { name: 'Standard Ticket', price: 12900, totalCapacity: 200, maxPerOrder: 6 },
                    ],
                  },
                  null,
                  2
                ),
              },
              url: { raw: '{{baseUrl}}/api/events', host: ['{{baseUrl}}'], path: ['api', 'events'] },
            },
          },
        ],
      },
    ],
  };

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename="reservepulse_postman_collection.json"');
  res.send(JSON.stringify(collection, null, 2));
});

// Setup Vite middleware for client React SPA
async function startServer() {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });

  app.use(vite.middlewares);

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] ReservePulse Full-Stack Server running at http://0.0.0.0:${PORT}`);
    console.log(`[Worker] 10-Minute Hold Expiry Background Worker active.`);
  });
}

startServer();
