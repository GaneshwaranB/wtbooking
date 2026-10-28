import React, { useState } from 'react';
import { Terminal, Copy, Check, FolderTree, Play, CheckCircle2, ShieldAlert, Cpu } from 'lucide-react';

export const WindowsSetupGuide: React.FC = () => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-10">
      {/* Guide Header */}
      <div className="border-b border-slate-800 pb-5">
        <div className="flex items-center gap-2 text-xs font-mono text-indigo-400">
          <Terminal className="w-4 h-4" />
          <span>Windows 10/11 & VS Code Beginner Setup Protocol</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight mt-1">
          Complete Step-by-Step Local & Production Implementation Guide
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Exact PowerShell commands, folder hierarchy, PostgreSQL, Redis, Prisma migrations, background workers, and deployment.
        </p>
      </div>

      {/* Quick Navigation Steps */}
      <div className="space-y-8 text-sm">
        {/* Step 1: Prerequisites */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3">
            <span className="w-7 h-7 rounded-full bg-indigo-600/30 text-indigo-300 font-mono font-bold flex items-center justify-center text-xs">
              01
            </span>
            <h3 className="text-base font-bold text-white">
              Prerequisites on Windows (Beginner Friendly)
            </h3>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Ensure you have installed:
            <br />
            1. <b>Node.js (LTS version 20 or 22)</b> from <a href="https://nodejs.org" target="_blank" rel="noreferrer" className="text-indigo-400 underline">nodejs.org</a>.
            <br />
            2. <b>Visual Studio Code</b> from <a href="https://code.visualstudio.com" target="_blank" rel="noreferrer" className="text-indigo-400 underline">code.visualstudio.com</a>.
            <br />
            3. <b>Docker Desktop for Windows</b> (or native PostgreSQL & Redis via WSL2 / Memurai).
          </p>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
              <span>Open Windows PowerShell and verify versions:</span>
              <button
                onClick={() => copy('node -v\nnpm -v\ngit -v', 'step1_verify')}
                className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                {copiedId === 'step1_verify' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copy</span>
              </button>
            </div>
            <pre className="font-mono text-xs text-emerald-400">
              node -v<br />
              npm -v<br />
              git -v
            </pre>
          </div>
        </section>

        {/* Step 2: Folder Structure */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3">
            <span className="w-7 h-7 rounded-full bg-indigo-600/30 text-indigo-300 font-mono font-bold flex items-center justify-center text-xs">
              02
            </span>
            <h3 className="text-base font-bold text-white">
              Folder Architecture in VS Code
            </h3>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Create your project folder and open it in VS Code:
          </p>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 font-mono text-xs text-slate-300">
            <div className="flex items-center justify-between text-slate-400 pb-2 border-b border-slate-800">
              <span>Recommended clean folder structure:</span>
            </div>
            <pre className="text-indigo-300 leading-5">
{`reservepulse/
├── prisma/
│   └── schema.prisma         # Relational data model & indexes
├── server/
│   ├── store.ts              # In-memory atomic store / Redis fallback
│   ├── services/
│   │   ├── redisLock.ts      # Distributed lock implementation (Redlock)
│   │   └── expiryWorker.ts   # 10-minute hold release worker
├── src/
│   ├── components/
│   │   ├── Header.tsx        # Top Bar Contract with RBAC switcher
│   │   ├── EventsView.tsx    # Live events catalog with hold trigger
│   │   ├── CheckoutModal.tsx # Async payment gateway simulator
│   │   ├── ConcurrencySimulator.tsx # Race condition test harness
│   │   └── OrganizerStudio.tsx      # Revenue & conversion charts
│   ├── types/
│   │   └── index.ts          # TypeScript domain models
│   ├── App.tsx
│   └── main.tsx
├── .env.example
├── package.json
├── server.ts                 # Express full-stack API + Vite middleware
└── tsconfig.json`}
            </pre>
          </div>
        </section>

        {/* Step 3: Install Packages */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3">
            <span className="w-7 h-7 rounded-full bg-indigo-600/30 text-indigo-300 font-mono font-bold flex items-center justify-center text-xs">
              03
            </span>
            <h3 className="text-base font-bold text-white">
              Terminal Setup Commands (PowerShell)
            </h3>
          </div>

          <div className="space-y-3">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                <span>1. Run in PowerShell to install required dependencies:</span>
                <button
                  onClick={() =>
                    copy(
                      'npm install @prisma/client express ioredis bcryptjs jsonwebtoken dotenv lucide-react\nnpm install -D prisma tsx typescript @types/node @types/express @types/jsonwebtoken @types/bcryptjs',
                      'step3_install'
                    )
                  }
                  className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                >
                  {copiedId === 'step3_install' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copy Command</span>
                </button>
              </div>
              <pre className="font-mono text-xs text-emerald-400 whitespace-pre-wrap">
npm install @prisma/client express ioredis bcryptjs jsonwebtoken dotenv lucide-react{'\n'}
npm install -D prisma tsx typescript @types/node @types/express @types/jsonwebtoken @types/bcryptjs
              </pre>
            </div>
          </div>
        </section>

        {/* Step 4: Run PostgreSQL & Redis in 1 Command with Docker */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3">
            <span className="w-7 h-7 rounded-full bg-indigo-600/30 text-indigo-300 font-mono font-bold flex items-center justify-center text-xs">
              04
            </span>
            <h3 className="text-base font-bold text-white">
              Local Database & Redis Setup (Fastest with Docker)
            </h3>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Run this single command in PowerShell to spin up PostgreSQL and Redis in the background:
          </p>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
              <span>Start PostgreSQL and Redis:</span>
              <button
                onClick={() =>
                  copy(
                    'docker run --name pg-ticket -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=reservepulse -p 5432:5432 -d postgres:16-alpine\ndocker run --name redis-ticket -p 6379:6379 -d redis:alpine',
                    'step4_docker'
                  )
                }
                className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                {copiedId === 'step4_docker' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copy</span>
              </button>
            </div>
            <pre className="font-mono text-xs text-amber-300 whitespace-pre-wrap">
docker run --name pg-ticket -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=reservepulse -p 5432:5432 -d postgres:16-alpine{'\n'}
docker run --name redis-ticket -p 6379:6379 -d redis:alpine
            </pre>
          </div>
        </section>

        {/* Step 5: Environment Variables */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3">
            <span className="w-7 h-7 rounded-full bg-indigo-600/30 text-indigo-300 font-mono font-bold flex items-center justify-center text-xs">
              05
            </span>
            <h3 className="text-base font-bold text-white">
              Create .env Configuration File
            </h3>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            In your project root, create a file named <code className="text-indigo-300 font-mono">.env</code>:
          </p>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
              <span>.env template:</span>
              <button
                onClick={() =>
                  copy(
                    'DATABASE_URL="postgresql://postgres:postgres@localhost:5432/reservepulse?schema=public"\nREDIS_URL="redis://localhost:6379"\nJWT_SECRET="super-secret-reservepulse-key-2026"\nPORT=3000\nNODE_ENV="development"',
                    'step5_env'
                  )
                }
                className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                {copiedId === 'step5_env' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copy .env</span>
              </button>
            </div>
            <pre className="font-mono text-xs text-cyan-300 whitespace-pre-wrap">
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/reservepulse?schema=public"{'\n'}
REDIS_URL="redis://localhost:6379"{'\n'}
JWT_SECRET="super-secret-reservepulse-key-2026"{'\n'}
PORT=3000{'\n'}
NODE_ENV="development"
            </pre>
          </div>
        </section>

        {/* Step 6: Prisma Migration */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3">
            <span className="w-7 h-7 rounded-full bg-indigo-600/30 text-indigo-300 font-mono font-bold flex items-center justify-center text-xs">
              06
            </span>
            <h3 className="text-base font-bold text-white">
              Generate & Apply Database Migration
            </h3>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
              <span>Run Prisma command:</span>
              <button
                onClick={() =>
                  copy('npx prisma migrate dev --name init\nnpx prisma generate', 'step6_migrate')
                }
                className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                {copiedId === 'step6_migrate' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copy</span>
              </button>
            </div>
            <pre className="font-mono text-xs text-emerald-400 whitespace-pre-wrap">
npx prisma migrate dev --name init{'\n'}
npx prisma generate
            </pre>
          </div>
        </section>

        {/* Step 7: Running the App */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3">
            <span className="w-7 h-7 rounded-full bg-indigo-600/30 text-indigo-300 font-mono font-bold flex items-center justify-center text-xs">
              07
            </span>
            <h3 className="text-base font-bold text-white">
              Launch Development Server & Test Suite
            </h3>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
              <span>Start dev server:</span>
              <button
                onClick={() => copy('npm run dev', 'step7_run')}
                className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                {copiedId === 'step7_run' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copy</span>
              </button>
            </div>
            <pre className="font-mono text-xs text-emerald-400">
              npm run dev
            </pre>
            <p className="text-xs text-slate-400 pt-2">
              Open <a href="http://localhost:3000" target="_blank" rel="noreferrer" className="text-indigo-400 underline">http://localhost:3000</a> in your browser. Both Express backend APIs and React frontend execute seamlessly.
            </p>
          </div>
        </section>

        {/* Step 8: Deployment on Render / Railway */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3">
            <span className="w-7 h-7 rounded-full bg-indigo-600/30 text-indigo-300 font-mono font-bold flex items-center justify-center text-xs">
              08
            </span>
            <h3 className="text-base font-bold text-white">
              Production Deployment Guide (Render / Railway / Vercel)
            </h3>
          </div>

          <div className="text-xs text-slate-300 space-y-2 leading-relaxed">
            <p>
              <b>To deploy to Render.com:</b>
            </p>
            <ol className="list-decimal pl-5 space-y-1 text-slate-400">
              <li>Push your codebase to a private/public GitHub repository.</li>
              <li>In Render Dashboard, create a <b>PostgreSQL Database</b> and a <b>Redis Instance</b>.</li>
              <li>Create a new <b>Web Service</b> pointing to your repo.</li>
              <li>Build Command: <code className="text-indigo-300 font-mono">npm install && npm run build && npx prisma migrate deploy</code></li>
              <li>Start Command: <code className="text-indigo-300 font-mono">npm start</code> (or <code className="text-indigo-300 font-mono">tsx server.ts</code>)</li>
              <li>Add Environment Variables: <code className="text-indigo-300 font-mono">DATABASE_URL</code> and <code className="text-indigo-300 font-mono">REDIS_URL</code>.</li>
            </ol>
          </div>
        </section>
      </div>
    </div>
  );
};
