import React, { useState } from 'react';
import { Event, TicketTier, User } from '../types/index.ts';
import { Calendar, MapPin, Ticket, ShieldCheck, Clock, Users, ArrowRight, Zap, CheckCircle2 } from 'lucide-react';

interface EventsViewProps {
  events: Event[];
  currentUser: User;
  onHoldTicket: (eventId: string, tierId: string, quantity: number) => Promise<void>;
  loadingTierId: string | null;
  onSelectConcurrencyTest: (tierId: string) => void;
}

export const EventsView: React.FC<EventsViewProps> = ({
  events,
  currentUser,
  onHoldTicket,
  loadingTierId,
  onSelectConcurrencyTest,
}) => {
  const [selectedQuantities, setSelectedQuantities] = useState<Record<string, number>>({});
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  const getQuantity = (tierId: string) => selectedQuantities[tierId] || 1;

  const setQuantity = (tierId: string, qty: number) => {
    setSelectedQuantities((prev) => ({ ...prev, [tierId]: qty }));
  };

  const categories = ['ALL', 'Technology & Engineering', 'Music & Arts'];
  const filteredEvents =
    categoryFilter === 'ALL'
      ? events
      : events.filter((e) => e.category === categoryFilter);

  return (
    <div className="space-y-10">
      {/* Hero Showcase Frame */}
      <section className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 shadow-2xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[380px]">
          {/* Left Hero Narrative */}
          <div className="lg:col-span-7 p-8 sm:p-10 flex flex-col justify-between z-10">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs text-indigo-400 font-mono tracking-wider uppercase">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Distributed Mutex & Redis Redlock Architecture</span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white max-w-xl text-balance">
                High-Concurrency Multi-Tenant Ticket Reservation Engine
              </h1>

              <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-lg">
                Engineered for flash sales with row-level locking (<code className="font-mono text-indigo-300">SELECT FOR UPDATE</code>)
                and 10-minute ephemeral reservation holds to eliminate race conditions and double-bookings under extreme load.
              </p>
            </div>

            {/* Quick Proof Metrics strip */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-800/80 mt-6">
              <div>
                <div className="font-mono text-xl font-bold text-white tabular-nums">10:00</div>
                <div className="text-[11px] text-slate-400">Temporary Hold TTL</div>
              </div>
              <div>
                <div className="font-mono text-xl font-bold text-emerald-400 tabular-nums">0.00%</div>
                <div className="text-[11px] text-slate-400">Double-Booking Rate</div>
              </div>
              <div>
                <div className="font-mono text-xl font-bold text-indigo-400 tabular-nums">100%</div>
                <div className="text-[11px] text-slate-400">Atomic Isolation</div>
              </div>
            </div>
          </div>

          {/* Right Image Banner */}
          <div className="lg:col-span-5 relative min-h-[240px] lg:min-h-full">
            <img
              src="/src/assets/images/event_platform_hero_1793197857426.jpg"
              alt="High-End Arena Stage Architecture"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-slate-900 via-slate-900/40 to-transparent" />
          </div>
        </div>
      </section>

      {/* Category Filter and Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Featured Live Events</h2>
          <p className="text-xs text-slate-400">
            Real-time seat inventories updated continuously via database row transactions.
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-lg">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                categoryFilter === cat
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat === 'ALL' ? 'All Categories' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Events Grid */}
      <div className="space-y-8">
        {filteredEvents.map((event) => {
          const startDate = new Date(event.startsAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          });

          return (
            <div
              key={event.id}
              className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg transition-all hover:border-slate-700"
            >
              <div className="p-6 sm:p-7 space-y-6">
                {/* Event Header */}
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span className="font-semibold text-indigo-400">{event.organizerName}</span>
                      <span>·</span>
                      <span>{event.category}</span>
                      <span>·</span>
                      <span className="text-emerald-400">Instant Booking Ready</span>
                    </div>

                    <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                      {event.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
                      {event.description}
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end gap-2 shrink-0 text-xs text-slate-400">
                    <div className="flex items-center gap-1.5 font-medium text-slate-200">
                      <Calendar className="w-4 h-4 text-indigo-400" />
                      <span>{startDate}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-slate-500" />
                      <span>{event.venueName}, {event.city}</span>
                    </div>
                  </div>
                </div>

                {/* Tier Selection Matrix */}
                <div className="border-t border-slate-800/80 pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Select Ticket Tier & Place Temporary Hold (10-Min Window)
                    </h4>
                    <span className="text-[11px] text-slate-400">
                      Prices in INR (₹) · Row-locked at checkout
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {event.tiers.map((tier) => {
                      const qty = getQuantity(tier.id);
                      const isSoldOut = tier.availableCount <= 0;
                      const isFewLeft = tier.availableCount > 0 && tier.availableCount <= 5;
                      const isLoading = loadingTierId === tier.id;

                      const soldPercent = Math.round((tier.soldCount / tier.totalCapacity) * 100);
                      const heldPercent = Math.round((tier.heldCount / tier.totalCapacity) * 100);

                      return (
                        <div
                          key={tier.id}
                          className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                            isSoldOut
                              ? 'bg-slate-950/60 border-slate-800/60 opacity-60'
                              : isFewLeft
                              ? 'bg-slate-900 border-amber-500/40 shadow-sm'
                              : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <h5 className="text-sm font-bold text-white">{tier.name}</h5>
                              <div className="text-right shrink-0">
                                <span className="font-mono text-base font-bold text-white tabular-nums">
                                  ₹{(tier.price / 100).toLocaleString('en-IN')}
                                </span>
                              </div>
                            </div>

                            <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                              {tier.description}
                            </p>

                            {/* Stock Bar */}
                            <div className="mt-4 space-y-1.5">
                              <div className="flex items-center justify-between text-[11px] font-mono tabular-nums">
                                <span className={isSoldOut ? 'text-red-400 font-semibold' : isFewLeft ? 'text-amber-400 font-semibold' : 'text-slate-300'}>
                                  {isSoldOut ? 'Sold Out' : `${tier.availableCount} available`}
                                </span>
                                <span className="text-slate-400">
                                  {tier.heldCount > 0 ? `${tier.heldCount} on hold` : `cap: ${tier.totalCapacity}`}
                                </span>
                              </div>

                              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden flex">
                                <div
                                  className="bg-indigo-500 h-full"
                                  style={{ width: `${soldPercent}%` }}
                                  title={`Sold: ${tier.soldCount}`}
                                />
                                <div
                                  className="bg-amber-400 h-full"
                                  style={{ width: `${heldPercent}%` }}
                                  title={`Held: ${tier.heldCount}`}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Control & Hold CTA */}
                          <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center gap-2">
                            {!isSoldOut && (
                              <select
                                value={qty}
                                onChange={(e) => setQuantity(tier.id, Number(e.target.value))}
                                disabled={isLoading}
                                className="bg-slate-900 border border-slate-700 text-xs text-white rounded-lg px-2 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                              >
                                {Array.from(
                                  { length: Math.min(tier.maxPerOrder, tier.availableCount) },
                                  (_, i) => i + 1
                                ).map((n) => (
                                  <option key={n} value={n}>
                                    {n} tix
                                  </option>
                                ))}
                              </select>
                            )}

                            <button
                              onClick={() => onHoldTicket(event.id, tier.id, qty)}
                              disabled={isSoldOut || isLoading}
                              className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap ${
                                isSoldOut
                                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm'
                              }`}
                            >
                              {isLoading ? (
                                <span>Locking Seat...</span>
                              ) : isSoldOut ? (
                                <span>Sold Out</span>
                              ) : (
                                <>
                                  <Clock className="w-3.5 h-3.5" />
                                  <span>Hold 10 Min</span>
                                </>
                              )}
                            </button>

                            {/* Direct button to test race condition on this tier */}
                            {tier.availableCount > 0 && tier.availableCount <= 5 && (
                              <button
                                onClick={() => onSelectConcurrencyTest(tier.id)}
                                title="Run 15-user concurrent race simulation against this scarce tier"
                                className="p-2 bg-amber-950/40 hover:bg-amber-900/40 border border-amber-800/50 rounded-lg text-amber-300 text-xs transition-colors"
                              >
                                <Zap className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
