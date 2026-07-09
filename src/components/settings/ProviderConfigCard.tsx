/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { ProviderProfile } from '../../types';
import { deriveStatus, maskApiKey } from '../../lib/providers/provider-profile';
import { useStore } from '../../store/useStore';

interface ProviderConfigCardProps {
  profile: ProviderProfile;
}

export default function ProviderConfigCard({ profile }: ProviderConfigCardProps) {
  const t = useStore((state) => state.t());
  const language = useStore((state) => state.language);
  const upsertProvider = useStore((state) => state.upsertProvider);
  const deleteProvider = useStore((state) => state.deleteProvider);
  const aiSettings = useStore((state) => state.aiSettings);
  const setActiveModel = useStore((state) => state.setActiveModel);

  const [baseURL, setBaseURL] = useState(profile.baseURL);
  const [apiKey, setApiKey] = useState('');
  const [busy, setBusy] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [manualText, setManualText] = useState(profile.manualModels.join('\n'));

  useEffect(() => {
    setBaseURL(profile.baseURL);
  }, [profile.baseURL]);

  useEffect(() => {
    setManualText(profile.manualModels.join('\n'));
  }, [profile.manualModels]);

  const status = deriveStatus(profile);
  const modelCount = profile.manualModels.length;
  const keyPlaceholder = profile.apiKey ? maskApiKey(profile.apiKey) : (language === 'es' ? 'No configurada' : 'Not set');

  const isActiveProvider = aiSettings.activeProviderId === profile.id;

  const handleSet = async () => {
    setBusy(true);
    try {
      await upsertProvider({
        id: profile.id,
        baseURL: baseURL.trim(),
        ...(apiKey.trim() ? { apiKey: apiKey.trim() } : {}),
      });
      setApiKey('');
    } finally {
      setBusy(false);
    }
  };

  const handleClear = async () => {
    setBusy(true);
    try {
      await upsertProvider({ id: profile.id, apiKey: '' });
      setApiKey('');
    } finally {
      setBusy(false);
    }
  };

  const handleToggle = async (enabled: boolean) => {
    setBusy(true);
    try {
      await upsertProvider({ id: profile.id, enabled });
    } finally {
      setBusy(false);
    }
  };

  const handleReset = () => setBaseURL(profile.defaultBaseURL);

  const handleSaveManual = async () => {
    setBusy(true);
    try {
      const models = manualText.split('\n').map((s) => s.trim()).filter(Boolean);
      await upsertProvider({ id: profile.id, manualModels: models });
      setManualOpen(false);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`${t.providers.delete} ${profile.label}?`)) return;
    setBusy(true);
    try {
      await deleteProvider(profile.id);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-white/10 bg-white/[0.02] p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-lime-500/10 text-[10px] font-bold text-lime-400 border border-lime-500/20">
            {profile.label.slice(0, 2).toUpperCase()}
          </span>
          <span className="truncate text-xs font-semibold text-slate-200">{profile.label}</span>
          <span className={`inline-flex items-center gap-1 text-[10px] font-mono ${status === 'online' ? 'text-lime-400' : 'text-rose-400'}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${status === 'online' ? 'bg-lime-400' : 'bg-rose-400'}`} />
            {status === 'online' ? t.providers.online : t.providers.disconnected}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {!profile.builtin && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={busy}
              className="rounded-lg p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
              title={t.providers.delete}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            role="switch"
            aria-checked={profile.enabled}
            onClick={() => handleToggle(!profile.enabled)}
            disabled={busy}
            className={`relative h-5 w-9 rounded-full transition-colors cursor-pointer ${
              profile.enabled ? 'bg-lime-500/40' : 'bg-white/10'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                profile.enabled ? 'translate-x-4' : ''
              }`}
            />
          </button>
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-[10px] font-mono uppercase tracking-wider text-slate-500">{t.providers.baseUrl}</label>
        <div className="flex gap-1.5">
          <input
            value={baseURL}
            onChange={(e) => setBaseURL(e.target.value)}
            placeholder="https://api.example.com/v1"
            className="flex-1 h-8 rounded-lg border border-white/10 bg-[#050507]/50 px-2 text-[11px] text-slate-200 focus:border-lime-500/40 focus:outline-none"
            spellCheck={false}
          />
          {profile.defaultBaseURL && baseURL !== profile.defaultBaseURL && (
            <button
              type="button"
              onClick={handleReset}
              className="shrink-0 rounded-lg border border-white/10 px-2 text-[10px] text-slate-400 hover:text-lime-400 cursor-pointer"
            >
              {t.providers.reset}
            </button>
          )}
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-[10px] font-mono uppercase tracking-wider text-slate-500">{t.providers.apiKey}</label>
        <div className="flex gap-1.5">
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={keyPlaceholder}
            className="flex-1 h-8 rounded-lg border border-white/10 bg-[#050507]/50 px-2 text-[11px] text-slate-200 focus:border-lime-500/40 focus:outline-none"
            autoComplete="off"
            spellCheck={false}
          />
          <button
            type="button"
            onClick={handleSet}
            disabled={busy || (!apiKey.trim() && baseURL === profile.baseURL)}
            className="shrink-0 rounded-lg bg-lime-500/20 border border-lime-500/30 px-2.5 text-[10px] font-semibold text-lime-300 hover:bg-lime-500/30 disabled:opacity-40 cursor-pointer"
          >
            {t.providers.set}
          </button>
          <button
            type="button"
            onClick={handleClear}
            disabled={busy || !profile.apiKey}
            className="shrink-0 rounded-lg border border-white/10 px-2.5 text-[10px] text-slate-400 hover:text-purple-300 cursor-pointer disabled:opacity-40"
          >
            {t.providers.clear}
          </button>
        </div>
      </div>

      {profile.manualModels.length > 0 && (
        <div className="space-y-1">
          <label className="text-[10px] font-mono uppercase tracking-wider text-slate-500">{t.providers.activeModel}</label>
          <select
            value={isActiveProvider ? aiSettings.activeModelId : profile.manualModels[0]}
            onChange={(e) => setActiveModel(profile.id, e.target.value)}
            className="w-full h-8 rounded-lg border border-white/10 bg-[#050507]/50 px-2 text-[11px] text-slate-200 focus:border-purple-500/40 focus:outline-none cursor-pointer"
          >
            {profile.manualModels.map((m) => (
              <option key={m} value={m} className="bg-slate-900">
                {m}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-[10px] text-slate-500">
          {status === 'online'
            ? `${modelCount} ${t.providers.modelsAvailable}`
            : t.providers.noModels}
        </p>
        <button
          type="button"
          onClick={() => setManualOpen((o) => !o)}
          className="text-[10px] text-purple-400 hover:text-purple-300 underline-offset-2 hover:underline cursor-pointer"
        >
          {manualOpen ? t.providers.hideManualList : t.providers.manualList}
        </button>
      </div>

      {manualOpen && (
        <div className="space-y-1.5">
          <textarea
            value={manualText}
            onChange={(e) => setManualText(e.target.value)}
            placeholder={'gpt-4o-mini\nllama3.2'}
            rows={3}
            className="w-full rounded-lg border border-white/10 bg-[#050507]/50 p-2 text-[11px] font-mono text-slate-200 focus:border-purple-500/40 focus:outline-none resize-y"
            spellCheck={false}
          />
          <p className="text-[9px] text-slate-500">{t.providers.manualHint}</p>
          <button
            type="button"
            onClick={handleSaveManual}
            disabled={busy}
            className="rounded-lg bg-purple-500/20 border border-purple-500/30 px-3 py-1 text-[10px] font-semibold text-purple-300 hover:bg-purple-500/30 cursor-pointer"
          >
            {t.providers.saveList}
          </button>
        </div>
      )}
    </div>
  );
}
