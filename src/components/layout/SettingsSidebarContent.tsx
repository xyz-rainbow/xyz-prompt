/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Globe } from 'lucide-react';
import { useStore } from '../../store/useStore';
import AiProvidersSection from '../settings/AiProvidersSection';

export default function SettingsSidebarContent() {
  const language = useStore((state) => state.language);
  const setLanguage = useStore((state) => state.setLanguage);
  const t = useStore((state) => state.t());

  return (
    <>
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-3 py-3 space-y-4 custom-scrollbar min-w-0 w-full">
        <div className="flex min-w-0 items-center justify-between gap-2">
          <h4 className="flex shrink-0 items-center gap-1 text-[9px] font-mono font-semibold uppercase tracking-widest text-slate-500">
            <Globe className="h-3 w-3 text-fuchsia-400" />
            {t.language}
          </h4>
          <div className="grid min-w-0 shrink-0 grid-cols-2 gap-0.5 rounded-md border border-white/10 bg-white/5 p-0.5">
            <button
              type="button"
              onClick={() => setLanguage('es')}
              className={`rounded px-2 py-0.5 text-[10px] font-medium transition-all cursor-pointer ${
                language === 'es'
                  ? 'bg-white/10 font-semibold text-fuchsia-400 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ES
            </button>
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`rounded px-2 py-0.5 text-[10px] font-medium transition-all cursor-pointer ${
                language === 'en'
                  ? 'bg-white/10 font-semibold text-fuchsia-400 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              EN
            </button>
          </div>
        </div>

        <AiProvidersSection />
      </div>

      <div className="w-full min-w-0 shrink-0 border-t border-b border-white/10 bg-black/30 px-3 py-3">
        <div className="rounded-lg border border-white/5 bg-black/25 p-3 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>Database Engine</span>
            <span className="text-emerald-400 font-bold">INDEXEDDB</span>
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
            <span>Cache Connection</span>
            <span className="text-emerald-500">Active</span>
          </div>
        </div>
      </div>
    </>
  );
}
