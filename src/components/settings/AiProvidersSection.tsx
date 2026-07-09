/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Cpu } from 'lucide-react';
import { useStore } from '../../store/useStore';
import ProviderConfigCard from './ProviderConfigCard';
import AddCustomProvider from './AddCustomProvider';

export default function AiProvidersSection() {
  const t = useStore((state) => state.t());
  const providers = useStore((state) => state.providers);
  const aiSettings = useStore((state) => state.aiSettings);
  const setPreferMock = useStore((state) => state.setPreferMock);

  const builtin = providers.filter((p) => p.builtin);
  const custom = providers.filter((p) => !p.builtin);

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <h4 className="text-[10px] font-mono font-semibold tracking-widest text-slate-500 uppercase flex items-center gap-1.5">
          <Cpu className="w-3.5 h-3.5 text-lime-400" />
          {t.providers.title}
        </h4>
        <p className="text-[10px] text-slate-500 leading-relaxed">{t.providers.subtitle}</p>
      </div>

      <label className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 cursor-pointer">
        <div>
          <span className="block text-[11px] font-semibold text-slate-300">{t.providers.preferMock}</span>
          <span className="block text-[9px] text-slate-500">{t.providers.preferMockDesc}</span>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={aiSettings.preferMock}
          onClick={() => setPreferMock(!aiSettings.preferMock)}
          className={`relative h-5 w-9 shrink-0 rounded-full transition-colors cursor-pointer ${
            aiSettings.preferMock ? 'bg-purple-500/40' : 'bg-lime-500/40'
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
              aiSettings.preferMock ? 'translate-x-4' : ''
            }`}
          />
        </button>
      </label>

      <div className="space-y-2 max-h-[42vh] overflow-y-auto pr-1 custom-scrollbar">
        {builtin.map((p) => (
          <div key={p.id}>
            <ProviderConfigCard profile={p} />
          </div>
        ))}
        {custom.length > 0 && (
          <>
            <p className="text-[10px] font-mono uppercase tracking-wider text-purple-400 pt-1">
              {t.providers.customProvider}
            </p>
            {custom.map((p) => (
              <div key={p.id}>
                <ProviderConfigCard profile={p} />
              </div>
            ))}
          </>
        )}
      </div>

      <AddCustomProvider />
    </div>
  );
}
