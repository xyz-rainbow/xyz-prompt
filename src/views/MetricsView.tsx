/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { LayoutGrid, ArrowLeft, ArrowRight, MessageSquare, ThumbsUp, Sparkles, Inbox } from 'lucide-react';
import { useStore } from '../store/useStore';
import { Prompt } from '../types';
import MetricsPopup from '../components/metrics/MetricsPopup';

export default function MetricsView() {
  const t = useStore((state) => state.t());
  const prompts = useStore((state) => state.prompts);
  const votes = useStore((state) => state.votes);
  const feedbacks = useStore((state) => state.feedbacks);

  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [currentPage, setCurrentPage] = useState(0);

  // Pagination config: 3x3 grid = 9 cards max per page
  const cardsPerPage = 9;
  const totalPages = Math.ceil(prompts.length / cardsPerPage);
  const paginatedPrompts = prompts.slice(currentPage * cardsPerPage, (currentPage + 1) * cardsPerPage);

  // If no prompts are in the DB, show a beautiful blank state
  if (prompts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center min-h-[350px] animate-fade-in">
        <div className="rounded-full bg-white/5 p-4 border border-white/10 mb-4 shadow-xl backdrop-blur-md">
          <Inbox className="w-8 h-8 text-indigo-400" />
        </div>
        <h3 className="font-display text-lg font-bold text-slate-200">{t.pagesMode.noPrompts}</h3>
        <p className="text-xs text-slate-400 mt-2 max-w-sm leading-relaxed">
          {t.pagesMode.noPromptsDesc}
        </p>
      </div>
    );
  }

  // Aggregate metrics mapping
  const getPromptMetrics = (id: string) => {
    const promptVotes = votes.filter((v) => v.promptId === id);
    const likes = promptVotes.filter((v) => v.type === 'like').length;
    const dislikes = promptVotes.filter((v) => v.type === 'dislike').length;
    const score = likes - dislikes;
    const commentCount = feedbacks.filter((f) => f.promptId === id).length;

    return { likes, dislikes, score, commentCount };
  };

  return (
    <div className="space-y-5 w-full max-w-4xl mx-auto py-2 animate-fade-in">
      {/* Top Title Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <h3 className="font-display font-bold text-slate-100 flex items-center gap-2 text-sm tracking-wide">
            <LayoutGrid className="w-4 h-4 text-indigo-400" />
            {t.metricsMode.gridTitle}
          </h3>
          <p className="text-[11px] text-slate-400 mt-1 max-w-md">
            {t.metricsMode.subtitle}
          </p>
        </div>

        {/* Mini Pagination controls */}
        {totalPages > 1 && (
          <div className="flex items-center gap-3 bg-white/5 p-1 border border-white/10 rounded-lg backdrop-blur-md">
            <button
              onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
              disabled={currentPage === 0}
              className="p-1 rounded text-slate-400 hover:text-slate-200 disabled:opacity-30 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono text-slate-400">
              {currentPage + 1} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
              disabled={currentPage === totalPages - 1}
              className="p-1 rounded text-slate-400 hover:text-slate-200 disabled:opacity-30 cursor-pointer"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Grid 3x3 Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {paginatedPrompts.map((p) => {
          const m = getPromptMetrics(p.id);
          const truncatedContent = p.content.slice(0, 150) + (p.content.length > 150 ? '...' : '');

          return (
            <div
              key={p.id}
              onClick={() => setSelectedPrompt(p)}
              className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] p-4 min-h-[160px] cursor-pointer hover:border-indigo-500/30 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-indigo-950/20 backdrop-blur-md"
            >
              {/* Dynamic Content Hover Preview Overlay */}
              <div className="absolute inset-x-0 bottom-0 top-1/2 translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 bg-[#050507]/90 backdrop-blur-md border-t border-white/10 p-3 z-10 flex flex-col justify-between overflow-hidden">
                <div>
                  <span className="text-[8px] font-mono font-bold uppercase tracking-wider text-indigo-400">Content Preview</span>
                  <p className="text-[10px] text-slate-400 leading-normal font-mono break-words mt-1 line-clamp-3">
                    {p.content}
                  </p>
                </div>
                <span className="text-[9px] font-semibold text-indigo-400 text-right uppercase tracking-wider block mt-1 animate-pulse">
                  Click to open full audit &rarr;
                </span>
              </div>

              {/* Top Row Title & Index */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 border-b border-white/5 pb-2">
                  <span className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-300 border border-white/5">
                    #{p.number}
                  </span>
                  <h4 className="font-display font-bold text-xs text-slate-200 group-hover:text-indigo-400 transition-colors truncate max-w-[170px]">
                    {p.title}
                  </h4>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed font-mono line-clamp-3">
                  {truncatedContent}
                </p>
              </div>

              {/* Bottom Row aggregates */}
              <div className="flex items-center justify-between border-t border-white/5 pt-3.5 text-[10px] font-mono text-slate-400">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <ThumbsUp className="w-3 h-3 text-indigo-400" />
                    <span className={m.score >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                      {m.score > 0 ? `+${m.score}` : m.score}
                    </span>
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-3 h-3 text-fuchsia-400" />
                    <span className="text-fuchsia-300">{m.commentCount}</span>
                  </span>
                </div>

                <span className="text-[9px] uppercase tracking-wider bg-white/5 px-1.5 py-0.5 rounded border border-white/5 text-slate-400">
                  {p.source}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Metrics Popup modal */}
      {selectedPrompt && (
        <MetricsPopup
          prompt={selectedPrompt}
          onClose={() => setSelectedPrompt(null)}
        />
      )}
    </div>
  );
}
