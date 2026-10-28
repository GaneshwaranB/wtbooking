import React, { useEffect, useState } from 'react';
import { TicketReservationHold } from '../types/index.ts';
import { Clock, CheckCircle2, XCircle, ArrowRight, FastForward } from 'lucide-react';

interface HoldCountdownBannerProps {
  activeHolds: TicketReservationHold[];
  onCheckout: (hold: TicketReservationHold) => void;
  onRelease: (holdToken: string) => void;
  onForceExpire: (holdToken: string) => void;
}

export const HoldCountdownBanner: React.FC<HoldCountdownBannerProps> = ({
  activeHolds,
  onCheckout,
  onRelease,
  onForceExpire,
}) => {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (activeHolds.length === 0) return null;

  return (
    <div className="bg-amber-950/40 border-b border-amber-800/50 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        {activeHolds.map((hold) => {
          const remainingMs = Math.max(0, hold.expiresAt - now);
          const minutes = Math.floor(remainingMs / 60000);
          const seconds = Math.floor((remainingMs % 60000) / 1000);
          const totalDurationMs = 10 * 60 * 1000;
          const progressPercent = Math.min(100, (remainingMs / totalDurationMs) * 100);
          const isUrgent = remainingMs < 120000; // < 2 minutes

          return (
            <div
              key={hold.id}
              className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    isUrgent
                      ? 'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-100">
                      Temporary 10-Minute Hold Active:
                    </span>
                    <span className="text-amber-200">
                      {hold.quantity}x {hold.tierName}
                    </span>
                    <span className="text-slate-400">·</span>
                    <span className="text-slate-300 font-medium">{hold.eventTitle}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                    <span>
                      Total: ₹{(hold.totalAmount / 100).toLocaleString('en-IN')}
                    </span>
                    <span>·</span>
                    <span>Hold Token: <code className="font-mono text-slate-300">{hold.holdToken.slice(0, 16)}...</code></span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 w-full sm:w-auto justify-end">
                {/* Visual Timer */}
                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right">
                    <div
                      className={`font-mono text-sm font-bold tabular-nums ${
                        isUrgent ? 'text-red-400' : 'text-amber-300'
                      }`}
                    >
                      {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                    </div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider">
                      Expires In
                    </div>
                  </div>
                  <div className="w-16 h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-1000 ${
                        isUrgent ? 'bg-red-500' : 'bg-amber-400'
                      }`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => onCheckout(hold)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg text-xs transition-colors flex items-center gap-1 shadow-sm whitespace-nowrap"
                  >
                    <span>Checkout Now</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onRelease(hold.holdToken)}
                    title="Release seats back to inventory"
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-lg text-xs transition-colors whitespace-nowrap"
                  >
                    Release
                  </button>

                  <button
                    onClick={() => onForceExpire(hold.holdToken)}
                    title="Dev testing: Force 10-minute timeout right now"
                    className="px-2 py-1.5 bg-red-950/50 hover:bg-red-900/50 text-red-300 border border-red-800/40 rounded-lg text-xs transition-colors flex items-center gap-1"
                  >
                    <FastForward className="w-3 h-3" />
                    <span>Expire</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
