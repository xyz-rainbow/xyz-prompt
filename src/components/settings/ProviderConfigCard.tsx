/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronDown, RefreshCw, Trash2 } from 'lucide-react';
import { ProviderProfile } from '../../types';
import { isProfileConfigured, maskApiKey } from '../../lib/providers/provider-profile';
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
  const refreshProviderModels = useStore((state) => state.refreshProviderModels);

  const [expanded, setExpanded] = useState(false);
  const [baseURL, setBaseURL] = useState(profile.baseURL);
  const [apiKey, setApiKey] = useState('');
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [manualText, setManualText] = useState(profile.manualModels.join('\n'));
  const [fetchNotice, setFetchNotice] = useState<{
    type: 'success' | 'error';
    message: string;
    hint?: string;
  } | null>(null);

  const autoRefreshKeyRef = useRef<string | null>(null);
  const prevEnabledRef = useRef(profile.enabled);

  useEffect(() => {
    setBaseURL(profile.baseURL);
  }, [profile.baseURL]);

  useEffect(() => {
    setManualText(profile.manualModels.join('\n'));
  }, [profile.manualModels]);

  useEffect(() => {
    if (profile.enabled && !prevEnabledRef.current) {
      setExpanded(true);
    }
    prevEnabledRef.current = profile.enabled;
  }, [profile.enabled]);

  const configured = isProfileConfigured(profile);
  const modelCount = profile.manualModels.length;
  const keyPlaceholder = profile.apiKey ? maskApiKey(profile.apiKey) : (language === 'es' ? 'No configurada' : 'Not set');
  const isActiveProvider = aiSettings.activeProviderId === profile.id;

  const runRefresh = useCallback(async () => {
    if (!isProfileConfigured(profile)) return;

    setRefreshing(true);
    setFetchNotice(null);
    try {
      const result = await refreshProviderModels(profile.id);
      if (result.success) {
        setFetchNotice({
          type: 'success',
          message: t.providers.modelsFetched.replace('{{count}}', String(result.models?.length ?? 0)),
        });
      } else if (result.error) {
        setFetchNotice({
          type: 'error',
          message: result.error.message,
          hint: result.error.hint,
        });
      } else {
        setFetchNotice({
          type: 'error',
          message: t.providers.modelsFetchFailed,
        });
      }
    } finally {
      setRefreshing(false);
    }
  }, [profile, refreshProviderModels, t.providers.modelsFetched, t.providers.modelsFetchFailed]);

  useEffect(() => {
    if (!profile.enabled || !configured) return;

    const key = `${profile.id}:${profile.baseURL}:${profile.apiKey ? 'key' : 'no-key'}`;
    if (autoRefreshKeyRef.current === key) return;
    autoRefreshKeyRef.current = key;
    void runRefresh();
  }, [profile.enabled, profile.id, profile.baseURL, profile.apiKey, configured, runRefresh]);

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
      setFetchNotice(null);
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

  const selectValue =
    isActiveProvider && profile.manualModels.includes(aiSettings.activeModelId)
      ? aiSettings.activeModelId
      : profile.manualModels[0] ?? '';

  const displayModel =
    isActiveProvider && aiSettings.activeModelId && profile.manualModels.includes(aiSettings.activeModelId)
      ? aiSettings.activeModelId
      : profile.manualModels[0] ?? null;

  const statusLabel = profile.enabled ? t.providers.on : t.providers.off;

  const statusTone = profile.enabled ? 'text-lime-400' : 'text-rose-400';

  const refreshButton = (iconOnly = false) => (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        void runRefresh();
      }}
      disabled={busy || refreshing || !configured}
      className={`inline-flex items-center justify-center rounded-lg border border-lime-500/20 bg-lime-500/5 text-lime-400 hover:text-lime-300 hover:bg-lime-500/10 disabled:opacity-40 cursor-pointer shrink-0 ${
        iconOnly ? 'h-7 w-7' : 'gap-1 px-2 py-1 text-[10px]'
      }`}
      title={t.providers.refreshModels}
    >
      <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
      {!iconOnly && <span>{t.providers.refreshModels}</span>}
    </button>
  );

  return (
    <div
      className={`flex flex-col gap-2 rounded-xl border bg-white/[0.02] p-2.5 transition-colors ${
        expanded ? 'border-white/15' : 'border-white/10'
      }`}
    >
      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] grid-rows-3 gap-x-2.5 gap-y-0.5 items-center">
        <div className="row-span-3 flex items-center justify-center self-center">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-lime-500/10 text-xs font-bold text-lime-400 border border-lime-500/20">
            {profile.label.slice(0, 2).toUpperCase()}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          aria-label={expanded ? t.providers.collapseDetails : t.providers.expandDetails}
          className="col-start-2 row-start-1 truncate text-left text-xs font-semibold text-slate-200 hover:text-lime-300 cursor-pointer min-w-0"
        >
          {profile.label}
        </button>

        <div className="col-start-3 row-start-1 flex justify-end">
          <button
            type="button"
            role="switch"
            aria-checked={profile.enabled}
            onClick={(e) => {
              e.stopPropagation();
              void handleToggle(!profile.enabled);
            }}
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

        <span className={`col-start-2 row-start-2 truncate text-[10px] font-mono font-medium ${statusTone}`}>
          {statusLabel}
        </span>

        <div className="col-start-3 row-start-2 flex justify-end">
          {!expanded && refreshButton(true)}
        </div>

        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          aria-label={expanded ? t.providers.collapseDetails : t.providers.expandDetails}
          className="col-start-2 row-start-3 truncate text-left text-[10px] font-mono text-slate-400 hover:text-slate-300 cursor-pointer min-w-0"
          title={displayModel ?? t.providers.noModelSelected}
        >
          {displayModel ?? t.providers.noModelSelected}
        </button>

        <div className="col-start-3 row-start-3 flex justify-end">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            aria-label={expanded ? t.providers.collapseDetails : t.providers.expandDetails}
            className="rounded-md p-0.5 text-slate-500 hover:text-slate-300 cursor-pointer"
          >
            <ChevronDown className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {!expanded && fetchNotice && (
        <div
          className={`rounded-lg border px-2.5 py-2 text-[10px] leading-relaxed ${
            fetchNotice.type === 'success'
              ? 'border-lime-500/25 bg-lime-500/10 text-lime-200'
              : 'border-rose-500/25 bg-rose-500/10 text-rose-100'
          }`}
        >
          <p className="font-medium">{fetchNotice.message}</p>
          {fetchNotice.hint && <p className="opacity-80 mt-0.5">{fetchNotice.hint}</p>}
        </div>
      )}

      {expanded && (
        <>
          {!profile.builtin && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => void handleDelete()}
                disabled={busy}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
                {t.providers.delete}
              </button>
            </div>
          )}

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

          <div className="space-y-1">
            <label className="text-[10px] font-mono uppercase tracking-wider text-slate-500">{t.providers.activeModel}</label>
            <select
              value={selectValue}
              onChange={(e) => {
                if (e.target.value) setActiveModel(profile.id, e.target.value);
              }}
              disabled={busy || refreshing || !profile.enabled || profile.manualModels.length === 0}
              className="w-full h-8 rounded-lg border border-white/10 bg-[#050507]/50 px-2 text-[11px] text-slate-200 focus:border-purple-500/40 focus:outline-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {profile.manualModels.length === 0 ? (
                <option value="" disabled className="bg-slate-900">
                  {t.providers.selectModelPlaceholder}
                </option>
              ) : (
                profile.manualModels.map((m) => (
                  <option key={m} value={m} className="bg-slate-900">
                    {m}
                  </option>
                ))
              )}
            </select>
          </div>

          {fetchNotice && (
            <div
              className={`rounded-lg border px-2.5 py-2 text-[10px] leading-relaxed ${
                fetchNotice.type === 'success'
                  ? 'border-lime-500/25 bg-lime-500/10 text-lime-200'
                  : 'border-rose-500/25 bg-rose-500/10 text-rose-100'
              }`}
            >
              <p className="font-medium">{fetchNotice.message}</p>
              {fetchNotice.hint && <p className="opacity-80 mt-0.5">{fetchNotice.hint}</p>}
            </div>
          )}

          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] text-slate-500">
              {refreshing
                ? t.providers.refreshingModels
                : modelCount > 0
                  ? `${modelCount} ${t.providers.modelsAvailable}`
                  : t.providers.noModels}
            </p>
            <div className="flex items-center gap-2 shrink-0">
              {refreshButton(false)}
              <button
                type="button"
                onClick={() => setManualOpen((o) => !o)}
                className="text-[10px] text-purple-400 hover:text-purple-300 underline-offset-2 hover:underline cursor-pointer"
              >
                {manualOpen ? t.providers.hideManualList : t.providers.manualList}
              </button>
            </div>
          </div>

          {manualOpen && (
            <div className="space-y-1.5">
              <textarea
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                placeholder={'gpt-4o-mini\nllama3.2:latest'}
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
        </>
      )}
    </div>
  );
}
