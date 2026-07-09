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
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-5 py-4 space-y-6 custom-scrollbar min-w-0 w-full">
        <div className="space-y-2.5">
          <h4 className="text-[10px] font-mono font-semibold tracking-widest text-slate-500 uppercase flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-fuchsia-400" />
            {t.language}
          </h4>
          <div className="grid grid-cols-2 gap-2 rounded-lg bg-white/5 p-1 border border-white/10 min-w-0">
            <button
              type="button"
              onClick={() => setLanguage('es')}
              className={`py-1.5 text-xs font-medium rounded transition-all cursor-pointer ${
                language === 'es' ? 'bg-white/10 text-fuchsia-400 font-semibold shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ES
            </button>
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`py-1.5 text-xs font-medium rounded transition-all cursor-pointer ${
                language === 'en' ? 'bg-white/10 text-fuchsia-400 font-semibold shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              EN
            </button>
          </div>
        </div>

        <AiProvidersSection />
      </div>

      <div className="w-full min-w-0 shrink-0 border-t border-b border-white/10 bg-white/[0.03] px-5 py-4">
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 space-y-2">
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
