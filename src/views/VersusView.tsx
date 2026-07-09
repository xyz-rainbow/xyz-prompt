/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { RefreshCw, Sparkles, AlertTriangle } from 'lucide-react';
import { useStore } from '../store/useStore';
import VoteBar from '../components/rate/VoteBar';

export default function VersusView() {
  const t = useStore((state) => state.t());
  const prompts = useStore((state) => state.prompts);
  const versusPrompts = useStore((state) => state.versusPrompts);
  const generateNextVersus = useStore((state) => state.generateNextVersus);
  const versusSelectedId = useStore((state) => state.versusSelectedId);
  const setVersusSelectedId = useStore((state) => state.setVersusSelectedId);
  const versusOutputs = useStore((state) => state.versusOutputs);
  const chatLoading = useStore((state) => state.chatLoading);

  if (prompts.length < 2) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center min-h-[350px] animate-fade-in">
        <div className="rounded-full bg-white/5 p-4 border border-white/10 mb-4 shadow-xl backdrop-blur-md">
          <AlertTriangle className="w-8 h-8 text-purple-400 animate-pulse" />
        </div>
        <h3 className="font-display text-lg font-bold text-slate-200">
          {t.language === 'es' ? 'Se requieren al menos 2 prompts' : 'At least 2 prompts required'}
        </h3>
        <p className="text-xs text-slate-400 mt-2 max-w-sm leading-relaxed">
          {t.language === 'es'
            ? 'Para realizar comparaciones Versus A/B, necesitas añadir o sembrar al menos dos prompts en tu base de datos local.'
            : 'To perform A/B Versus comparisons, you must create or seed at least two prompts in your local database.'}
        </p>
      </div>
    );
  }

  if (!versusPrompts) {
    return (
      <div className="flex items-center justify-center py-12">
        <button
          onClick={generateNextVersus}
          className="rounded-xl bg-gradient-to-r from-lime-500 to-purple-600 hover:from-lime-400 hover:to-purple-500 px-6 py-2.5 text-xs font-semibold text-slate-100 border border-white/10 shadow-lg cursor-pointer"
        >
          {t.versusMode.nextVersus}
        </button>
      </div>
    );
  }

  const [promptA, promptB] = versusPrompts;

  const handleSelectToggle = (id: string) => {
    if (versusSelectedId === id) {
      setVersusSelectedId(null);
    } else {
      setVersusSelectedId(id);
    }
  };

  const renderOutput = (output: string | null, label: string) => {
    if (!chatLoading && !output) return null;

    return (
      <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-3.5 space-y-2 min-h-[100px] max-h-[180px] overflow-y-auto">
        <div className="flex items-center gap-1.5 text-[10px] font-semibold text-purple-400 uppercase tracking-wider">
          <Sparkles className={`w-3 h-3 ${chatLoading ? 'animate-spin' : ''}`} />
          <span>{t.chat.simulatedResponse} {label}</span>
        </div>
        {chatLoading ? (
          <div className="space-y-2 py-2 animate-pulse">
            <div className="h-2 bg-white/5 rounded w-5/6" />
            <div className="h-2 bg-white/5 rounded w-4/5" />
            <div className="h-2 bg-white/5 rounded w-2/3" />
          </div>
        ) : (
          <div className="text-[11px] text-slate-300 font-sans leading-relaxed max-w-none whitespace-pre-wrap">
            {output}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 w-full max-w-4xl mx-auto py-2 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <h3 className="font-display font-bold text-slate-100 flex items-center gap-2 text-sm tracking-wide">
            <Sparkles className="w-4 h-4 text-lime-400" />
            {t.versusMode.compareTitle}
          </h3>
          <p className="text-[11px] text-slate-400 mt-1 max-w-md leading-relaxed">
            {t.versusMode.subtitle}
          </p>
        </div>

        <button
          onClick={generateNextVersus}
          disabled={chatLoading}
          className="flex items-center gap-2 rounded-xl border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 px-4 py-2 text-xs font-semibold text-slate-200 cursor-pointer transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          {t.versusMode.nextVersus}
        </button>
      </div>

      {versusOutputs?.userMessage && (
        <div className="rounded-xl border border-lime-500/20 bg-lime-500/5 px-4 py-2 text-xs text-lime-200">
          <span className="font-mono text-lime-400/80 uppercase text-[10px]">User → </span>
          {versusOutputs.userMessage}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">
        <div className="flex flex-col justify-between rounded-xl border border-white/10 bg-white/[0.03] p-5 space-y-4 shadow-2xl backdrop-blur-md">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
              <span className="rounded-lg bg-lime-500/15 px-2 py-0.5 text-[10px] font-bold font-mono text-lime-400 border border-lime-500/10 uppercase">
                Alpha (A) - #{promptA.number}
              </span>
              <h4 className="text-xs font-semibold text-slate-300 max-w-[180px] truncate">{promptA.title}</h4>
            </div>

            <div className="bg-[#050507]/40 backdrop-blur-md rounded-xl border border-white/5 p-3 max-h-[140px] overflow-y-auto">
              <pre className="text-[11px] text-slate-400 font-mono whitespace-pre-wrap leading-relaxed">
                {promptA.content}
              </pre>
            </div>

            {renderOutput(versusOutputs?.promptA ?? null, 'A')}
          </div>

          <div className="pt-2">
            <VoteBar
              promptId={promptA.id}
              mode="versus"
              isSelected={versusSelectedId === promptA.id}
              onSelect={() => handleSelectToggle(promptA.id)}
            />
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-xl border border-white/10 bg-white/[0.03] p-5 space-y-4 shadow-2xl backdrop-blur-md">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
              <span className="rounded-lg bg-purple-500/15 px-2 py-0.5 text-[10px] font-bold font-mono text-purple-400 border border-purple-500/10 uppercase">
                Beta (B) - #{promptB.number}
              </span>
              <h4 className="text-xs font-semibold text-slate-300 max-w-[180px] truncate">{promptB.title}</h4>
            </div>

            <div className="bg-[#050507]/40 backdrop-blur-md rounded-xl border border-white/5 p-3 max-h-[140px] overflow-y-auto">
              <pre className="text-[11px] text-slate-400 font-mono whitespace-pre-wrap leading-relaxed">
                {promptB.content}
              </pre>
            </div>

            {renderOutput(versusOutputs?.promptB ?? null, 'B')}
          </div>

          <div className="pt-2">
            <VoteBar
              promptId={promptB.id}
              mode="versus"
              isSelected={versusSelectedId === promptB.id}
              onSelect={() => handleSelectToggle(promptB.id)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
