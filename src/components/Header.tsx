import React from 'react';
import { User, Role } from '../types/index.ts';
import { Calendar, Shield, Ticket, Users, Play, Code2, BookOpen, Layers } from 'lucide-react';

interface HeaderProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  currentUser: User;
  users: User[];
  onSwitchUser: (user: User) => void;
  activeHoldsCount: number;
  onOpenCreateEvent: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setCurrentTab,
  currentUser,
  users,
  onSwitchUser,
  activeHoldsCount,
  onOpenCreateEvent,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand wordmark (single text element) */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setCurrentTab('events')}
            className="flex items-center gap-2.5 text-left group"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <Ticket className="w-4 h-4" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-white whitespace-nowrap block">
                ReservePulse
              </span>
              <span className="text-[10px] text-slate-400 font-mono tracking-wider block uppercase">
                Multi-Tenant Ticket Engine
              </span>
            </div>
          </button>
        </div>

        {/* Zone 2: Navigation Links (single line, no wrapping) */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          <button
            onClick={() => setCurrentTab('events')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              currentTab === 'events'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            Events Catalog
          </button>

          <button
            onClick={() => setCurrentTab('holds')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 relative ${
              currentTab === 'holds'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Active Holds
            {activeHoldsCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 bg-amber-500/20 text-amber-300 font-mono text-[10px] rounded-full border border-amber-500/30">
                {activeHoldsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setCurrentTab('organizer')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              currentTab === 'organizer'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Organizer Studio
          </button>

          <button
            onClick={() => setCurrentTab('concurrency')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              currentTab === 'concurrency'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Play className="w-3.5 h-3.5 text-emerald-400" />
            Race Simulator
          </button>

          <button
            onClick={() => setCurrentTab('deliverables')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              currentTab === 'deliverables'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            ER & Postman
          </button>

          <button
            onClick={() => setCurrentTab('guide')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              currentTab === 'guide'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            VS Code Guide
          </button>
        </nav>

        {/* Zone 3: Persona Switcher and Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg p-1">
            <span className="text-[11px] text-slate-400 pl-2 font-mono">Role:</span>
            <select
              value={currentUser.id}
              onChange={(e) => {
                const selected = users.find((u) => u.id === e.target.value);
                if (selected) onSwitchUser(selected);
              }}
              className="bg-slate-950 text-xs text-slate-200 font-medium px-2 py-1 rounded border border-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.role === 'ADMIN' ? '🛡️ Admin' : u.role === 'ORGANIZER' ? '👔 Organizer' : '🎟️ Attendee'} - {u.name.split(' ')[0]}
                </option>
              ))}
            </select>
          </div>

          {(currentUser.role === 'ORGANIZER' || currentUser.role === 'ADMIN') ? (
            <button
              onClick={onOpenCreateEvent}
              className="px-3.5 py-1.5 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 transition-colors shadow-sm whitespace-nowrap shrink-0 flex items-center gap-1.5"
            >
              <Calendar className="w-3.5 h-3.5" />
              Create Event
            </button>
          ) : (
            <button
              onClick={() => setCurrentTab('concurrency')}
              className="px-3.5 py-1.5 text-xs font-medium text-emerald-300 bg-emerald-950/60 border border-emerald-800/80 rounded-lg hover:bg-emerald-900/60 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5" />
              Simulate Race
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
