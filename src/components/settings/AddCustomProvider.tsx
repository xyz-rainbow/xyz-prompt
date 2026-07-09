/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { ProviderProtocol } from '../../types';
import { useStore } from '../../store/useStore';

function slugify(label: string): string {
  const base = label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  return `custom-${base || 'provider'}-${Math.random().toString(36).slice(2, 6)}`;
}

export default function AddCustomProvider() {
  const t = useStore((state) => state.t());
  const upsertProvider = useStore((state) => state.upsertProvider);

  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState('');
  const [baseURL, setBaseURL] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [protocol, setProtocol] = useState<ProviderProtocol>('openai-compatible');
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setLabel('');
    setBaseURL('');
    setApiKey('');
    setProtocol('openai-compatible');
    setOpen(false);
  };

  const handleAdd = async () => {
    if (!label.trim() || !baseURL.trim()) return;
    setBusy(true);
    try {
      await upsertProvider({
        id: slugify(label),
        label: label.trim(),
        protocol,
        baseURL: baseURL.trim(),
        apiKey: apiKey.trim(),
        enabled: true,
        builtin: false,
        defaultBaseURL: baseURL.trim(),
        manualModels: ['default-model'],
      });
      reset();
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-2 rounded-xl border border-dashed border-purple-500/30 hover:border-purple-500/50 bg-purple-500/5 hover:bg-purple-500/10 py-2.5 text-[11px] font-semibold text-purple-300 transition-all cursor-pointer"
      >
        <Plus className="w-3.5 h-3.5" />
        {t.providers.addProvider}
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-dashed border-purple-500/30 bg-purple-500/5 p-3">
      <p className="text-[10px] font-mono uppercase tracking-wider text-purple-400">{t.providers.customProvider}</p>
      <input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder={t.providers.name}
        className="h-8 rounded-lg border border-white/10 bg-[#050507]/50 px-2 text-[11px] text-slate-200 focus:border-purple-500/40 focus:outline-none"
      />
      <select
        value={protocol}
        onChange={(e) => setProtocol(e.target.value as ProviderProtocol)}
        className="h-8 rounded-lg border border-white/10 bg-[#050507]/50 px-2 text-[11px] text-slate-200 focus:border-purple-500/40 focus:outline-none cursor-pointer"
      >
        <option value="openai-compatible" className="bg-slate-900">OpenAI compatible</option>
        <option value="ollama" className="bg-slate-900">Ollama</option>
        <option value="anthropic" className="bg-slate-900">Anthropic</option>
        <option value="google" className="bg-slate-900">Google</option>
        <option value="openai" className="bg-slate-900">OpenAI</option>
      </select>
      <input
        value={baseURL}
        onChange={(e) => setBaseURL(e.target.value)}
        placeholder="http://127.0.0.1:1234/v1"
        className="h-8 rounded-lg border border-white/10 bg-[#050507]/50 px-2 text-[11px] text-slate-200 focus:border-purple-500/40 focus:outline-none"
        spellCheck={false}
      />
      <input
        type="password"
        value={apiKey}
        onChange={(e) => setApiKey(e.target.value)}
        placeholder="sk-…"
        className="h-8 rounded-lg border border-white/10 bg-[#050507]/50 px-2 text-[11px] text-slate-200 focus:border-purple-500/40 focus:outline-none"
        autoComplete="off"
        spellCheck={false}
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleAdd}
          disabled={busy}
          className="flex-1 rounded-lg bg-gradient-to-r from-lime-500 to-purple-600 py-1.5 text-[11px] font-semibold text-white cursor-pointer disabled:opacity-50"
        >
          {t.providers.add}
        </button>
        <button
          type="button"
          onClick={reset}
          disabled={busy}
          className="rounded-lg border border-white/10 px-3 py-1.5 text-[11px] text-slate-400 hover:text-white cursor-pointer"
        >
          {t.providers.cancel}
        </button>
      </div>
    </div>
  );
}
