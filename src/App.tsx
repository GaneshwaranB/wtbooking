import React, { useState, useEffect } from 'react';
import { User, Event, TicketReservationHold } from './types/index.ts';
import { Header } from './components/Header.tsx';
import { HoldCountdownBanner } from './components/HoldCountdownBanner.tsx';
import { EventsView } from './components/EventsView.tsx';
import { CheckoutModal } from './components/CheckoutModal.tsx';
import { ConcurrencySimulator } from './components/ConcurrencySimulator.tsx';
import { OrganizerStudio } from './components/OrganizerStudio.tsx';
import { ERDiagramView } from './components/ERDiagramView.tsx';
import { WindowsSetupGuide } from './components/WindowsSetupGuide.tsx';
import { CreateEventModal } from './components/CreateEventModal.tsx';
import { ShieldCheck, AlertCircle, CheckCircle2, Ticket, Clock, Layers } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('events');
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User>({
    id: 'user_attendee_jane',
    email: 'jane.attendee@gmail.com',
    name: 'Jane Doe (Attendee)',
    role: 'ATTENDEE',
  });
  const [events, setEvents] = useState<Event[]>([]);
  const [activeHolds, setActiveHolds] = useState<TicketReservationHold[]>([]);
  const [checkoutHold, setCheckoutHold] = useState<TicketReservationHold[] | null>(null);
  const [activeCheckoutTarget, setActiveCheckoutTarget] = useState<TicketReservationHold | null>(null);
  const [createEventModalOpen, setCreateEventModalOpen] = useState<boolean>(false);
  const [loadingTierId, setLoadingTierId] = useState<string | null>(null);
  const [concurrencyPreselectedTier, setConcurrencyPreselectedTier] = useState<string>('tier_vip_summit');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      if (data.success && data.users) {
        setUsers(data.users);
        const jane = data.users.find((u: User) => u.id === 'user_attendee_jane');
        if (jane && currentUser.id === 'user_attendee_jane') {
          setCurrentUser(jane);
        }
      }
    } catch (e) {
      console.error('Error fetching users:', e);
    }
  };

  const fetchEvents = async () => {
    try {
      const res = await fetch('/api/events');
      const data = await res.json();
      if (data.success && data.events) {
        setEvents(data.events);
      }
    } catch (e) {
      console.error('Error fetching events:', e);
    }
  };

  const fetchActiveHolds = async () => {
    try {
      const res = await fetch(`/api/reservations/active?userId=${currentUser.id}`);
      const data = await res.json();
      if (data.success) {
        setActiveHolds(data.holds || []);
      }
    } catch (e) {
      console.error('Error fetching active holds:', e);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchEvents();
    fetchActiveHolds();

    const interval = setInterval(() => {
      fetchEvents();
      fetchActiveHolds();
    }, 3000);

    return () => clearInterval(interval);
  }, [currentUser.id]);

  const handleHoldTicket = async (eventId: string, tierId: string, quantity: number) => {
    setLoadingTierId(tierId);
    try {
      const res = await fetch('/api/reservations/hold', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          tierId,
          quantity,
          userId: currentUser.id,
          attendeeName: currentUser.name,
          attendeeEmail: currentUser.email,
        }),
      });

      const data = await res.json();
      if (res.status === 201 && data.success) {
        showToast(`Successfully locked ${quantity} seat(s)! 10-minute hold active.`, 'success');
        fetchActiveHolds();
        fetchEvents();
      } else {
        showToast(data.message || data.error || 'Failed to place reservation hold', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Network error locking seats', 'error');
    } finally {
      setLoadingTierId(null);
    }
  };

  const handleReleaseHold = async (holdToken: string) => {
    try {
      const res = await fetch('/api/reservations/release', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ holdToken }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Hold released. Inventory returned to available stock.', 'success');
        fetchActiveHolds();
        fetchEvents();
      }
    } catch (err) {
      console.error('Error releasing hold:', err);
    }
  };

  const handleForceExpire = async (holdToken: string) => {
    try {
      const res = await fetch('/api/worker/force-expire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ holdToken }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Hold forcefully expired. Background worker returned seats.', 'success');
        fetchActiveHolds();
        fetchEvents();
      }
    } catch (err) {
      console.error('Error expiring hold:', err);
    }
  };

  const handleSelectConcurrencyTest = (tierId: string) => {
    setConcurrencyPreselectedTier(tierId);
    setCurrentTab('concurrency');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-20 right-6 z-50 animate-in fade-in slide-in-from-top-4 duration-200">
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl text-xs font-medium border ${
              toast.type === 'success'
                ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/40'
                : 'bg-red-950/90 text-red-200 border-red-500/40'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Primary Header complying with Top Bar Contract */}
      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        currentUser={currentUser}
        users={users}
        onSwitchUser={setCurrentUser}
        activeHoldsCount={activeHolds.length}
        onOpenCreateEvent={() => setCreateEventModalOpen(true)}
      />

      {/* Persistent 10-Minute Hold Countdown Banner */}
      <HoldCountdownBanner
        activeHolds={activeHolds}
        onCheckout={(hold) => setActiveCheckoutTarget(hold)}
        onRelease={handleReleaseHold}
        onForceExpire={handleForceExpire}
      />

      {/* Main Viewport Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentTab === 'events' && (
          <EventsView
            events={events}
            currentUser={currentUser}
            onHoldTicket={handleHoldTicket}
            loadingTierId={loadingTierId}
            onSelectConcurrencyTest={handleSelectConcurrencyTest}
          />
        )}

        {currentTab === 'holds' && (
          <div className="space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <h2 className="text-xl font-bold text-white">Your Active 10-Minute Reservation Holds</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Seats currently locked in database row transactions for your session. Complete checkout before the timer expires.
              </p>
            </div>

            {activeHolds.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-4">
                <Ticket className="w-12 h-12 text-slate-600 mx-auto" />
                <h3 className="text-base font-semibold text-white">No Active Ticket Holds</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Browse the Events Catalog and select tickets to activate a 10-minute temporary reservation hold.
                </p>
                <button
                  onClick={() => setCurrentTab('events')}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors"
                >
                  Browse Events
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeHolds.map((hold) => (
                  <div
                    key={hold.id}
                    className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-mono text-indigo-400 uppercase">
                          Active Hold
                        </span>
                        <h4 className="text-base font-bold text-white">{hold.eventTitle}</h4>
                        <p className="text-xs text-slate-400">
                          {hold.tierName} · {hold.quantity} Ticket(s)
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="font-mono text-base font-bold text-white tabular-nums">
                          ₹{(hold.totalAmount / 100).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>

                    <div className="text-xs text-slate-400 font-mono space-y-1">
                      <div>Hold Token: {hold.holdToken}</div>
                      <div>Attendee: {hold.attendeeName} ({hold.attendeeEmail})</div>
                    </div>

                    <div className="pt-2 flex items-center gap-2">
                      <button
                        onClick={() => setActiveCheckoutTarget(hold)}
                        className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-colors"
                      >
                        Checkout & Pay
                      </button>
                      <button
                        onClick={() => handleReleaseHold(hold.holdToken)}
                        className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition-colors"
                      >
                        Release
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {currentTab === 'organizer' && (
          <OrganizerStudio
            currentUser={currentUser}
            events={events}
            onOpenCreateEvent={() => setCreateEventModalOpen(true)}
            onRefreshEvents={fetchEvents}
          />
        )}

        {currentTab === 'concurrency' && (
          <ConcurrencySimulator
            events={events}
            preselectedTierId={concurrencyPreselectedTier}
            onRefreshEvents={fetchEvents}
          />
        )}

        {currentTab === 'deliverables' && <ERDiagramView />}

        {currentTab === 'guide' && <WindowsSetupGuide />}
      </main>

      {/* Modals */}
      {activeCheckoutTarget && (
        <CheckoutModal
          hold={activeCheckoutTarget}
          onClose={() => setActiveCheckoutTarget(null)}
          onSuccess={() => {
            fetchActiveHolds();
            fetchEvents();
          }}
        />
      )}

      {createEventModalOpen && (
        <CreateEventModal
          currentUser={currentUser}
          onClose={() => setCreateEventModalOpen(false)}
          onEventCreated={() => {
            fetchEvents();
            showToast('Event created successfully with tiered tickets!', 'success');
          }}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>ReservePulse · Multi-Tenant Ticket Reservation Engine</span>
          <div className="flex items-center gap-4 text-slate-400">
            <span>SELECT FOR UPDATE Row Locking</span>
            <span>·</span>
            <span>Redis Redlock Distributed Mutex</span>
            <span>·</span>
            <span>10-Minute Hold Expiry</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
