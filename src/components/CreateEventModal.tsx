import React, { useState } from 'react';
import { User } from '../types/index.ts';
import { X, Plus, Trash2, Calendar, MapPin, DollarSign, Layers } from 'lucide-react';

interface CreateEventModalProps {
  currentUser: User;
  onClose: () => void;
  onEventCreated: () => void;
}

export const CreateEventModal: React.FC<CreateEventModalProps> = ({
  currentUser,
  onClose,
  onEventCreated,
}) => {
  const [title, setTitle] = useState('');
  const [venueName, setVenueName] = useState('');
  const [city, setCity] = useState('Bengaluru');
  const [country, setCountry] = useState('India');
  const [category, setCategory] = useState('Technology & Engineering');
  const [description, setDescription] = useState('');

  const nowPlus7 = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 16);
  const nowPlus8 = new Date(Date.now() + 8 * 86400000).toISOString().slice(0, 16);
  const nowPlus6 = new Date(Date.now() + 6 * 86400000).toISOString().slice(0, 16);

  const [startsAt, setStartsAt] = useState(nowPlus7);
  const [endsAt, setEndsAt] = useState(nowPlus8);
  const [salesCutoffAt, setSalesCutoffAt] = useState(nowPlus6);

  const [tiers, setTiers] = useState<
    Array<{ name: string; price: number; totalCapacity: number; maxPerOrder: number; description: string }>
  >([
    {
      name: 'VIP All-Access',
      price: 14999,
      totalCapacity: 25,
      maxPerOrder: 2,
      description: 'Backstage pass, speaker access, and reserved premium seating.',
    },
    {
      name: 'General Admission',
      price: 4999,
      totalCapacity: 150,
      maxPerOrder: 6,
      description: 'Full day access to keynotes, workshops, and catering.',
    },
  ]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const addTier = () => {
    setTiers([
      ...tiers,
      {
        name: 'Early Bird Pass',
        price: 2499,
        totalCapacity: 50,
        maxPerOrder: 4,
        description: 'Discounted admission for early attendees.',
      },
    ]);
  };

  const removeTier = (index: number) => {
    if (tiers.length <= 1) return;
    setTiers(tiers.filter((_, i) => i !== index));
  };

  const updateTier = (index: number, field: string, value: any) => {
    const updated = [...tiers];
    (updated[index] as any)[field] = value;
    setTiers(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !venueName) {
      setError('Please provide event title and venue.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const formattedTiers = tiers.map((t) => ({
        name: t.name,
        price: Math.round(Number(t.price) * 100), // convert to cents
        totalCapacity: Number(t.totalCapacity),
        maxPerOrder: Number(t.maxPerOrder),
        description: t.description,
      }));

      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: currentUser.tenantId || 'tenant_apex',
          organizerName: currentUser.name.split('(')[0].trim() || 'Apex Systems Events',
          title,
          description,
          venueName,
          city,
          country,
          startsAt: new Date(startsAt).toISOString(),
          endsAt: new Date(endsAt).toISOString(),
          salesCutoffAt: new Date(salesCutoffAt).toISOString(),
          category,
          bannerImage: '/src/assets/images/event_platform_hero_1793197857426.jpg',
          tiers: formattedTiers,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to create event');
        return;
      }

      onEventCreated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 sticky top-0 bg-slate-900/95 backdrop-blur z-10">
          <div>
            <h3 className="text-base font-bold text-white">Create Multi-Tier Event</h3>
            <p className="text-xs text-slate-400">
              Set ticket tiers, total capacities, and sales cut-off deadlines.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-950/40 border border-red-800 text-red-300 text-xs rounded-xl">
              {error}
            </div>
          )}

          {/* Event Details */}
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Event Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Distributed Systems & High Frequency Summit 2026"
                className="w-full bg-slate-950 border border-slate-800 text-xs text-white rounded-lg p-2.5 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Venue Name *
                </label>
                <input
                  type="text"
                  required
                  value={venueName}
                  onChange={(e) => setVenueName(e.target.value)}
                  placeholder="e.g. Symphony Hall"
                  className="w-full bg-slate-950 border border-slate-800 text-xs text-white rounded-lg p-2.5 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-xs text-white rounded-lg p-2.5 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-xs text-white rounded-lg p-2.5 focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="Technology & Engineering">Technology & Engineering</option>
                  <option value="Music & Arts">Music & Arts</option>
                  <option value="Business & Finance">Business & Finance</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Description
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Overview of the event, keynote speakers, and agenda..."
                className="w-full bg-slate-950 border border-slate-800 text-xs text-white rounded-lg p-2.5 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Dates & Cut-off */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Starts At
                </label>
                <input
                  type="datetime-local"
                  value={startsAt}
                  onChange={(e) => setStartsAt(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-xs text-white rounded-lg p-2 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Ends At
                </label>
                <input
                  type="datetime-local"
                  value={endsAt}
                  onChange={(e) => setEndsAt(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-xs text-white rounded-lg p-2 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Sales Cut-off Date
                </label>
                <input
                  type="datetime-local"
                  value={salesCutoffAt}
                  onChange={(e) => setSalesCutoffAt(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-xs text-amber-300 rounded-lg p-2 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Ticket Tiers Section */}
          <div className="pt-4 border-t border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Tiered Ticket Configuration
              </h4>
              <button
                type="button"
                onClick={addTier}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-xs text-indigo-300 rounded-lg flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Tier</span>
              </button>
            </div>

            <div className="space-y-3">
              {tiers.map((tier, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-400 font-mono">
                      Tier #{idx + 1}
                    </span>
                    {tiers.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTier(idx)}
                        className="text-slate-500 hover:text-red-400 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
                    <div className="sm:col-span-2">
                      <label className="text-[10px] text-slate-400 block mb-0.5">Tier Name</label>
                      <input
                        type="text"
                        required
                        value={tier.name}
                        onChange={(e) => updateTier(idx, 'name', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 text-white rounded p-1.5"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">Price (₹ INR)</label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={tier.price}
                        onChange={(e) => updateTier(idx, 'price', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 text-white rounded p-1.5 font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">Capacity</label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={tier.totalCapacity}
                        onChange={(e) => updateTier(idx, 'totalCapacity', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 text-white rounded p-1.5 font-mono"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Submit */}
          <div className="flex items-center gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 text-xs font-medium text-slate-400 hover:text-white bg-slate-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-colors shadow-lg shadow-indigo-600/20"
            >
              {submitting ? 'Creating Event...' : 'Publish Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
