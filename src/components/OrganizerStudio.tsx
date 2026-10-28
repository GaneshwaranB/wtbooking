import React, { useEffect, useState } from 'react';
import { OrganizerAnalytics, WorkerLog, User, Event } from '../types/index.ts';
import {
  IndianRupee,
  Ticket,
  Percent,
  Layers,
  TrendingUp,
  Clock,
  RefreshCw,
  Plus,
  ShieldCheck,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

interface OrganizerStudioProps {
  currentUser: User;
  events: Event[];
  onOpenCreateEvent: () => void;
  onRefreshEvents: () => void;
}

export const OrganizerStudio: React.FC<OrganizerStudioProps> = ({
  currentUser,
  events,
  onOpenCreateEvent,
  onRefreshEvents,
}) => {
  const [analytics, setAnalytics] = useState<OrganizerAnalytics | null>(null);
  const [workerLogs, setWorkerLogs] = useState<WorkerLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchAnalytics = async () => {
    try {
      const tenantParam = currentUser.tenantId ? `?tenantId=${currentUser.tenantId}` : '';
      const [analyticsRes, logsRes] = await Promise.all([
        fetch(`/api/organizer/analytics${tenantParam}`),
        fetch('/api/worker/logs'),
      ]);

      const analyticsData = await analyticsRes.json();
      const logsData = await logsRes.json();

      if (analyticsData.success) {
        setAnalytics(analyticsData.analytics);
      }
      if (logsData.success) {
        setWorkerLogs(logsData.logs || []);
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 3000);
    return () => clearInterval(interval);
  }, [currentUser]);

  return (
    <div className="space-y-8">
      {/* Studio Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-indigo-400">
            <span>Tenant Workspace: {currentUser.tenantId || 'Global Platform'}</span>
            <span>·</span>
            <span className="text-emerald-400">Live Telemetry Active</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight mt-1">
            Organizer Revenue & Conversion Studio
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time analytics for ticket sales, active 10-minute holds, and conversion rates.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchAnalytics}
            className="p-2 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-lg text-slate-300 text-xs transition-colors flex items-center gap-1.5"
            title="Refresh analytics data"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync</span>
          </button>
          <button
            onClick={onOpenCreateEvent}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create New Event</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      {analytics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Gross Settled Revenue</span>
              <IndianRupee className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-white tabular-nums">
              ₹{(analytics.totalRevenue / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-emerald-400 font-medium">
              Real-time payment settlements
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Paid Tickets Sold</span>
              <Ticket className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-white tabular-nums">
              {analytics.totalTicketsSold}
            </div>
            <div className="text-[11px] text-slate-400">
              Avg Order: ₹{(analytics.averageOrderValue / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Hold-to-Buy Conversion</span>
              <Percent className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-white tabular-nums">
              {analytics.conversionRate}%
            </div>
            <div className="text-[11px] text-slate-400">
              {analytics.totalHoldsCreated} holds registered
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Active Temporary Holds</span>
              <Layers className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-amber-300 tabular-nums">
              {analytics.totalActiveHolds}
            </div>
            <div className="text-[11px] text-slate-400">
              Auto-expires in 10-min window
            </div>
          </div>
        </div>
      )}

      {/* Tier Performance Breakdown */}
      {analytics && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Ticket Tier Real-Time Inventory & Revenue Distribution
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              Transactional integrity guaranteed
            </span>
          </div>

          <div className="p-6 space-y-6">
            {analytics.tierBreakdown.map((t) => {
              const soldPct = Math.round((t.sold / t.capacity) * 100);
              const heldPct = Math.round((t.held / t.capacity) * 100);
              const avail = Math.max(0, t.capacity - t.sold - t.held);

              return (
                <div key={t.tierId} className="space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                    <span className="font-semibold text-white">{t.tierName}</span>
                    <div className="flex items-center gap-4 font-mono text-[11px]">
                      <span className="text-slate-400">
                        Sold: <b className="text-indigo-400">{t.sold}</b>
                      </span>
                      <span className="text-slate-400">
                        Held: <b className="text-amber-400">{t.held}</b>
                      </span>
                      <span className="text-slate-400">
                        Available: <b className="text-emerald-400">{avail}</b>
                      </span>
                      <span className="text-white font-bold">
                        ₹{(t.revenue / 100).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  <div className="h-2.5 w-full bg-slate-950 rounded-full overflow-hidden flex border border-slate-800">
                    <div
                      className="bg-indigo-500 h-full transition-all"
                      style={{ width: `${soldPct}%` }}
                      title={`Sold: ${t.sold}`}
                    />
                    <div
                      className="bg-amber-400 h-full transition-all"
                      style={{ width: `${heldPct}%` }}
                      title={`Held: ${t.held}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Two Column Layout: Recent Orders & Background Expiry Worker Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg flex flex-col">
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Settled Orders
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">Latest transactions</span>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-4">Order #</th>
                  <th className="py-2.5 px-4">Attendee</th>
                  <th className="py-2.5 px-4">Tier & Qty</th>
                  <th className="py-2.5 px-4 text-right">Amount</th>
                  <th className="py-2.5 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {analytics?.recentOrders && analytics.recentOrders.length > 0 ? (
                  analytics.recentOrders.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-4 font-semibold text-slate-200">
                        {o.orderNumber}
                      </td>
                      <td className="py-2.5 px-4 text-slate-300">
                        {o.attendeeName}
                      </td>
                      <td className="py-2.5 px-4 text-slate-400">
                        {o.quantity}x {o.tierName.slice(0, 14)}...
                      </td>
                      <td className="py-2.5 px-4 text-right font-bold text-white tabular-nums">
                        ₹{(o.totalAmount / 100).toLocaleString('en-IN')}
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            o.status === 'PAID'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {o.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      No settled orders yet. Place a reservation from the Events tab.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Background Expiry Worker Log Monitor */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg flex flex-col">
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Hold Expiry Worker Telemetry
              </h3>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">Sweep cycle: 2.5s</span>
          </div>

          <div className="p-4 overflow-y-auto max-h-[340px] space-y-2.5 font-mono text-xs">
            {workerLogs.map((log) => (
              <div
                key={log.id}
                className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1"
              >
                <div className="flex items-center justify-between text-[10px]">
                  <span
                    className={`font-bold ${
                      log.action === 'HOLD_EXPIRED'
                        ? 'text-red-400'
                        : log.action === 'HOLD_CONVERTED'
                        ? 'text-emerald-400'
                        : log.action === 'HOLD_CREATED'
                        ? 'text-amber-300'
                        : 'text-indigo-400'
                    }`}
                  >
                    [{log.action}]
                  </span>
                  <span className="text-slate-500">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-slate-300 text-[11px]">{log.details}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
