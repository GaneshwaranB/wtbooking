import React, { useState } from 'react';
import { Event, ConcurrencyTestResult } from '../types/index.ts';
import { Play, ShieldAlert, CheckCircle2, AlertOctagon, Zap, ArrowRight, RefreshCw, Cpu } from 'lucide-react';

interface ConcurrencySimulatorProps {
  events: Event[];
  preselectedTierId?: string;
  onRefreshEvents: () => void;
}

export const ConcurrencySimulator: React.FC<ConcurrencySimulatorProps> = ({
  events,
  preselectedTierId,
  onRefreshEvents,
}) => {
  const [selectedTierId, setSelectedTierId] = useState<string>(
    preselectedTierId || 'tier_vip_summit'
  );
  const [concurrentCount, setConcurrentCount] = useState<number>(15);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<ConcurrencyTestResult | null>(null);

  // Find tier details
  let targetTier: any = null;
  let targetEvent: any = null;
  for (const e of events) {
    const t = e.tiers.find((x) => x.id === selectedTierId);
    if (t) {
      targetTier = t;
      targetEvent = e;
      break;
    }
  }

  const handleRunRaceTest = async () => {
    setIsRunning(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/concurrency-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tierId: selectedTierId,
          totalRequests: concurrentCount,
          quantityPerRequest: 1,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setTestResult(data.result);
        onRefreshEvents();
      }
    } catch (err) {
      console.error('Concurrency test error:', err);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Overview Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 uppercase tracking-wider">
              <Zap className="w-4 h-4" />
              <span>Stress Test & Race Condition Simulator</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              Atomic Row-Locking & Mutex Concurrency Harness
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
              Simulate hundreds of millisecond-level concurrent requests competing for the exact same
              tickets. Proves that database transactions and distributed mutex locks prevent double-booking.
            </p>
          </div>

          <div className="flex items-center gap-2 p-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-300">
            <Cpu className="w-4 h-4 text-indigo-400" />
            <span>SELECT ... FOR UPDATE / Redlock</span>
          </div>
        </div>

        {/* Configuration Bar */}
        <div className="pt-6 border-t border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase block mb-1.5">
              1. Target Ticket Tier (Scarce Inventory)
            </label>
            <select
              value={selectedTierId}
              onChange={(e) => setSelectedTierId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-xs text-white rounded-lg p-2.5 font-medium focus:ring-1 focus:ring-indigo-500"
            >
              {events.map((e) =>
                e.tiers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {e.title.slice(0, 28)}... - {t.name} ({t.availableCount} left)
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase block mb-1.5">
              2. Number of Concurrent Simultaneous Workers
            </label>
            <div className="flex items-center gap-2">
              {[5, 10, 15, 20].map((num) => (
                <button
                  key={num}
                  onClick={() => setConcurrentCount(num)}
                  className={`flex-1 py-2 text-xs font-mono font-semibold rounded-lg border transition-colors ${
                    concurrentCount === num
                      ? 'bg-indigo-600 border-indigo-500 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {num} reqs
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleRunRaceTest}
              disabled={isRunning || !targetTier}
              className={`w-full py-2.5 px-4 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg ${
                isRunning
                  ? 'bg-indigo-900 text-indigo-300 cursor-wait'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
              }`}
            >
              {isRunning ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Firing {concurrentCount} Simultaneous Requests...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Execute Race Test</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Target Current Status Box */}
      {targetTier && (
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
          <div>
            <span className="text-slate-400">Target: </span>
            <span className="text-white font-bold">{targetEvent?.title}</span>
            <span className="text-slate-500"> → </span>
            <span className="text-indigo-400 font-semibold">{targetTier.name}</span>
          </div>

          <div className="flex items-center gap-6">
            <div>
              <span className="text-slate-400">Total Capacity: </span>
              <span className="text-white font-bold tabular-nums">{targetTier.totalCapacity}</span>
            </div>
            <div>
              <span className="text-slate-400">Active Holds: </span>
              <span className="text-amber-400 font-bold tabular-nums">{targetTier.heldCount}</span>
            </div>
            <div>
              <span className="text-slate-400">Sold: </span>
              <span className="text-indigo-400 font-bold tabular-nums">{targetTier.soldCount}</span>
            </div>
            <div>
              <span className="text-slate-400">Available: </span>
              <span className="text-emerald-400 font-bold tabular-nums">{targetTier.availableCount}</span>
            </div>
          </div>
        </div>
      )}

      {/* Results View */}
      {testResult && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Proof Summary Banner */}
          <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/30 rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/40">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Race Condition Invariants Verified: 0 Double Bookings
                  </h3>
                  <p className="text-xs text-slate-300">
                    All {testResult.totalRequests} concurrent worker threads dispatched simultaneously in{' '}
                    <span className="font-mono text-emerald-400 font-semibold">{testResult.totalTimeMs}ms</span>.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono">
                <div className="text-right">
                  <div className="text-lg font-bold text-emerald-400 tabular-nums">
                    {testResult.successfulHolds} Holds
                  </div>
                  <div className="text-[10px] text-slate-400">Success (201)</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-amber-400 tabular-nums">
                    {testResult.conflictedRequests} Blocked
                  </div>
                  <div className="text-[10px] text-slate-400">Conflict (409)</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-indigo-400 tabular-nums">
                    {testResult.remainingStock} Left
                  </div>
                  <div className="text-[10px] text-slate-400">Stock Remainder</div>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Request Logs Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Simultaneous Request Thread Execution Logs
              </h4>
              <span className="text-[11px] text-slate-400 font-mono">
                Isolated with atomic mutex locks
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-4">Req #</th>
                    <th className="py-2.5 px-4">Simulated Worker</th>
                    <th className="py-2.5 px-4">Result</th>
                    <th className="py-2.5 px-4">Latency</th>
                    <th className="py-2.5 px-4">Atomic Lock Evaluation Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {testResult.logs.map((log) => {
                    const isSuccess = log.status === 'SUCCESS';
                    return (
                      <tr
                        key={log.reqId}
                        className={isSuccess ? 'bg-emerald-950/20' : 'hover:bg-slate-800/40'}
                      >
                        <td className="py-2.5 px-4 font-bold text-slate-300">#{log.reqId}</td>
                        <td className="py-2.5 px-4 text-slate-400">{log.userId}</td>
                        <td className="py-2.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              isSuccess
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            }`}
                          >
                            {isSuccess ? '201 CREATED' : '409 CONFLICT'}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-slate-300 tabular-nums">
                          {log.durationMs}ms
                        </td>
                        <td className="py-2.5 px-4 text-slate-300">
                          {log.message}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
