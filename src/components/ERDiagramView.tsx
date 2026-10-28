import React, { useState } from 'react';
import {
  PRISMA_SCHEMA_CONTENT,
  POSTGRES_SQL_DDL,
  REDIS_LOCK_SNIPPET,
  MERMAID_ER_DIAGRAM,
} from '../data/deliverables.ts';
import {
  Database,
  FileCode,
  Layers,
  Copy,
  Check,
  Download,
  Terminal,
  ExternalLink,
  ShieldCheck,
  Key,
} from 'lucide-react';

export const ERDiagramView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'VISUAL' | 'MERMAID' | 'PRISMA' | 'SQL' | 'REDIS' | 'POSTMAN'
  >('VISUAL');
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const downloadPostmanJson = () => {
    window.location.href = '/api/postman/export';
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-indigo-400">
            <Database className="w-4 h-4" />
            <span>Architecture & Data Deliverables</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight mt-1">
            Entity-Relationship Model & Postman Test Harness
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Relational schema, row-level locking DDL, distributed Redis locks, and RFC-compliant Postman collection.
          </p>
        </div>

        {/* Tab selection */}
        <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto">
          {[
            { id: 'VISUAL', label: 'Interactive ER' },
            { id: 'MERMAID', label: 'Mermaid' },
            { id: 'PRISMA', label: 'Prisma Schema' },
            { id: 'SQL', label: 'Postgres SQL' },
            { id: 'REDIS', label: 'Redis Redlock' },
            { id: 'POSTMAN', label: 'Postman Suite' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Visual Interactive ER Diagram */}
      {activeTab === 'VISUAL' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Relational Data Entities & Foreign Key Topology
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Multi-tenant isolation enforced via Tenant foreign key cascading down to Events, Users, and Orders.
                </p>
              </div>
              <button
                onClick={() => copyToClipboard(MERMAID_ER_DIAGRAM, 'mermaid_vis')}
                className="px-3 py-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                {copied === 'mermaid_vis' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copy Mermaid</span>
              </button>
            </div>

            {/* Visual Schema Entity Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Tenant Entity */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <div className="bg-slate-800/80 px-4 py-2.5 border-b border-slate-700 flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-indigo-300">Tenant</span>
                  <span className="text-[10px] text-slate-400 font-mono">1 : N Isolation</span>
                </div>
                <div className="p-4 space-y-1.5 font-mono text-xs">
                  <div className="flex items-center justify-between text-amber-300">
                    <span className="flex items-center gap-1.5"><Key className="w-3 h-3 text-amber-400" /> id</span>
                    <span className="text-[10px] text-slate-400">VARCHAR PK</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span>name</span>
                    <span className="text-[10px] text-slate-500">VARCHAR(255)</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span>slug</span>
                    <span className="text-[10px] text-slate-500">VARCHAR UNIQUE</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span>contactEmail</span>
                    <span className="text-[10px] text-slate-500">VARCHAR</span>
                  </div>
                </div>
              </div>

              {/* User Entity */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <div className="bg-slate-800/80 px-4 py-2.5 border-b border-slate-700 flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-indigo-300">User</span>
                  <span className="text-[10px] text-slate-400 font-mono">RBAC Auth</span>
                </div>
                <div className="p-4 space-y-1.5 font-mono text-xs">
                  <div className="flex items-center justify-between text-amber-300">
                    <span className="flex items-center gap-1.5"><Key className="w-3 h-3 text-amber-400" /> id</span>
                    <span className="text-[10px] text-slate-400">VARCHAR PK</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span>tenantId</span>
                    <span className="text-[10px] text-indigo-400">FK → Tenant</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span>email</span>
                    <span className="text-[10px] text-slate-500">VARCHAR UNIQUE</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span>role</span>
                    <span className="text-[10px] text-emerald-400">ADMIN|ORG|ATT</span>
                  </div>
                </div>
              </div>

              {/* Event Entity */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <div className="bg-slate-800/80 px-4 py-2.5 border-b border-slate-700 flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-indigo-300">Event</span>
                  <span className="text-[10px] text-slate-400 font-mono">Multi-Tenant Event</span>
                </div>
                <div className="p-4 space-y-1.5 font-mono text-xs">
                  <div className="flex items-center justify-between text-amber-300">
                    <span className="flex items-center gap-1.5"><Key className="w-3 h-3 text-amber-400" /> id</span>
                    <span className="text-[10px] text-slate-400">VARCHAR PK</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span>tenantId</span>
                    <span className="text-[10px] text-indigo-400">FK → Tenant</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span>title</span>
                    <span className="text-[10px] text-slate-500">VARCHAR(255)</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span>salesCutoffAt</span>
                    <span className="text-[10px] text-slate-400">TIMESTAMP</span>
                  </div>
                </div>
              </div>

              {/* TicketTier Entity */}
              <div className="bg-slate-900 border border-indigo-500/40 rounded-xl overflow-hidden shadow-md">
                <div className="bg-indigo-950/80 px-4 py-2.5 border-b border-indigo-500/40 flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-indigo-200">TicketTier</span>
                  <span className="text-[10px] text-amber-300 font-mono font-bold">LOCKED ROW</span>
                </div>
                <div className="p-4 space-y-1.5 font-mono text-xs">
                  <div className="flex items-center justify-between text-amber-300">
                    <span className="flex items-center gap-1.5"><Key className="w-3 h-3 text-amber-400" /> id</span>
                    <span className="text-[10px] text-slate-400">VARCHAR PK</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span>eventId</span>
                    <span className="text-[10px] text-indigo-400">FK → Event</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span>totalCapacity</span>
                    <span className="text-[10px] text-slate-400">INTEGER</span>
                  </div>
                  <div className="flex items-center justify-between text-amber-300 font-semibold">
                    <span>heldCount</span>
                    <span className="text-[10px] text-amber-400">INTEGER (10m TTL)</span>
                  </div>
                  <div className="flex items-center justify-between text-emerald-300 font-semibold">
                    <span>soldCount</span>
                    <span className="text-[10px] text-emerald-400">INTEGER (Paid)</span>
                  </div>
                </div>
              </div>

              {/* TicketReservationHold Entity */}
              <div className="bg-slate-900 border border-amber-500/40 rounded-xl overflow-hidden shadow-md">
                <div className="bg-amber-950/80 px-4 py-2.5 border-b border-amber-500/40 flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-amber-200">TicketReservationHold</span>
                  <span className="text-[10px] text-amber-300 font-mono">10-MIN TTL</span>
                </div>
                <div className="p-4 space-y-1.5 font-mono text-xs">
                  <div className="flex items-center justify-between text-amber-300">
                    <span className="flex items-center gap-1.5"><Key className="w-3 h-3 text-amber-400" /> id</span>
                    <span className="text-[10px] text-slate-400">VARCHAR PK</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span>holdToken</span>
                    <span className="text-[10px] text-amber-400 font-bold">VARCHAR UK</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span>tierId</span>
                    <span className="text-[10px] text-indigo-400">FK → TicketTier</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span>expiresAt</span>
                    <span className="text-[10px] text-red-400">now + 10m</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span>status</span>
                    <span className="text-[10px] text-slate-400">ACT|CONV|EXP</span>
                  </div>
                </div>
              </div>

              {/* Order & Transaction Entity */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <div className="bg-slate-800/80 px-4 py-2.5 border-b border-slate-700 flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-indigo-300">Order & Transaction</span>
                  <span className="text-[10px] text-slate-400 font-mono">Settlement</span>
                </div>
                <div className="p-4 space-y-1.5 font-mono text-xs">
                  <div className="flex items-center justify-between text-amber-300">
                    <span className="flex items-center gap-1.5"><Key className="w-3 h-3 text-amber-400" /> id</span>
                    <span className="text-[10px] text-slate-400">VARCHAR PK</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span>orderNumber</span>
                    <span className="text-[10px] text-slate-400">RP-2026-XXXX</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span>tierId</span>
                    <span className="text-[10px] text-indigo-400">FK → Tier</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span>status</span>
                    <span className="text-[10px] text-emerald-400">PENDING|PAID</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span>gatewayRef</span>
                    <span className="text-[10px] text-slate-400">Stripe Mock Ref</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mermaid Tab */}
      {activeTab === 'MERMAID' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-mono">
              Syntax: Mermaid ER Diagram v10+
            </span>
            <button
              onClick={() => copyToClipboard(MERMAID_ER_DIAGRAM, 'mermaid_tab')}
              className="px-3 py-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 rounded-lg flex items-center gap-1.5"
            >
              {copied === 'mermaid_tab' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>Copy Mermaid Code</span>
            </button>
          </div>
          <pre className="p-5 bg-slate-950 border border-slate-800 rounded-xl font-mono text-xs text-slate-300 overflow-x-auto leading-relaxed">
            {MERMAID_ER_DIAGRAM}
          </pre>
        </div>
      )}

      {/* Prisma Tab */}
      {activeTab === 'PRISMA' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-mono">
              File: prisma/schema.prisma
            </span>
            <button
              onClick={() => copyToClipboard(PRISMA_SCHEMA_CONTENT, 'prisma_tab')}
              className="px-3 py-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 rounded-lg flex items-center gap-1.5"
            >
              {copied === 'prisma_tab' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>Copy schema.prisma</span>
            </button>
          </div>
          <pre className="p-5 bg-slate-950 border border-slate-800 rounded-xl font-mono text-xs text-indigo-300 overflow-x-auto leading-relaxed max-h-[500px]">
            {PRISMA_SCHEMA_CONTENT}
          </pre>
        </div>
      )}

      {/* Postgres SQL DDL Tab */}
      {activeTab === 'SQL' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-mono">
              PostgreSQL DDL & Atomic SELECT FOR UPDATE Stored Function
            </span>
            <button
              onClick={() => copyToClipboard(POSTGRES_SQL_DDL, 'sql_tab')}
              className="px-3 py-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 rounded-lg flex items-center gap-1.5"
            >
              {copied === 'sql_tab' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>Copy SQL DDL</span>
            </button>
          </div>
          <pre className="p-5 bg-slate-950 border border-slate-800 rounded-xl font-mono text-xs text-emerald-300 overflow-x-auto leading-relaxed max-h-[500px]">
            {POSTGRES_SQL_DDL}
          </pre>
        </div>
      )}

      {/* Redis Redlock Tab */}
      {activeTab === 'REDIS' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-mono">
              src/services/redisLock.ts (Distributed Mutex & Lua Release)
            </span>
            <button
              onClick={() => copyToClipboard(REDIS_LOCK_SNIPPET, 'redis_tab')}
              className="px-3 py-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 rounded-lg flex items-center gap-1.5"
            >
              {copied === 'redis_tab' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>Copy Redis Code</span>
            </button>
          </div>
          <pre className="p-5 bg-slate-950 border border-slate-800 rounded-xl font-mono text-xs text-amber-300 overflow-x-auto leading-relaxed max-h-[500px]">
            {REDIS_LOCK_SNIPPET}
          </pre>
        </div>
      )}

      {/* Postman Collection Tab */}
      {activeTab === 'POSTMAN' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-white">
                  Postman API Collection v2.1.0 Deliverable
                </h3>
                <p className="text-xs text-slate-400">
                  Pre-configured testing suite covering happy paths and edge cases: concurrent race conditions, expired 10-minute holds (410), out of stock (409), and async payment simulator.
                </p>
              </div>

              <button
                onClick={downloadPostmanJson}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/20 whitespace-nowrap shrink-0"
              >
                <Download className="w-4 h-4" />
                <span>Download postman_collection.json</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-800">
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Edge Case 1: Concurrent Flash Booking
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Dispatches simultaneous calls with low inventory. Tests that the database transaction row-lock returns <code className="text-emerald-400 font-mono">201 Created</code> up to exact capacity and gracefully blocks the rest with <code className="text-amber-400 font-mono">409 Conflict</code>.
                </p>
              </div>

              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Edge Case 2: Expired 10-Min Session Checkout
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Attempts to call <code className="text-indigo-300 font-mono">/api/reservations/checkout</code> after the 10-minute TTL expires. Confirms backend returns <code className="text-red-400 font-mono">410 Gone</code> and releases ticket inventory back to the public pool.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
