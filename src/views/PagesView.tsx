/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ChevronLeft, ChevronRight, Copy, Check, Inbox, Trash2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import VoteBar from '../components/rate/VoteBar';

export default function PagesView() {
  const t = useStore((state) => state.t());
  const prompts = useStore((state) => state.prompts);
  const activePageIndex = useStore((state) => state.activePageIndex);
  const setActivePageIndex = useStore((state) => state.setActivePageIndex);
  const selectedPagesPromptId = useStore((state) => state.selectedPagesPromptId);
  const setSelectedPagesPromptId = useStore((state) => state.setSelectedPagesPromptId);
  const deletePrompt = useStore((state) => state.deletePrompt);
  const language = useStore((state) => state.language);

  const [copied, setCopied] = React.useState(false);

  if (prompts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[350px] min-w-0 p-4 text-center animate-fade-in sm:p-8">
        <div className="rounded-full bg-white/5 p-4 border border-white/10 mb-4 shadow-xl backdrop-blur-md">
          <Inbox className="w-8 h-8 text-lime-400 animate-bounce" />
        </div>
        <h3 className="font-display text-lg font-bold text-slate-200">{t.pagesMode.noPrompts}</h3>
        <p className="mt-2 max-w-md text-xs leading-relaxed text-slate-400 break-words">
          {t.pagesMode.noPromptsDesc}
        </p>
      </div>
    );
  }

  const activePrompt = prompts[activePageIndex] || prompts[0];

  const handleNextPage = () => {
    if (activePageIndex < prompts.length - 1) {
      setActivePageIndex(activePageIndex + 1);
    }
  };

  const handlePrevPage = () => {
    if (activePageIndex > 0) {
      setActivePageIndex(activePageIndex - 1);
    }
  };

  const handleCopy = () => {
    if (!activePrompt) return;
    navigator.clipboard.writeText(activePrompt.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSelectToggle = () => {
    if (selectedPagesPromptId === activePrompt.id) {
      setSelectedPagesPromptId(null);
    } else {
      setSelectedPagesPromptId(activePrompt.id);
    }
  };

  const handleDelete = async () => {
    if (!activePrompt) return;
    if (!confirm(t.pagesMode.deletePromptConfirm)) return;
    await deletePrompt(activePrompt.id);
  };

  return (
    <div className="relative space-y-6 w-full max-w-2xl mx-auto py-2 animate-fade-in">
      <div className="relative group">
        <button
          onClick={handlePrevPage}
          disabled={activePageIndex === 0}
          className={`absolute -left-12 top-1/2 -translate-y-1/2 flex items-center justify-center w-9 h-9 rounded-full border border-white/10 bg-white/5 text-slate-300 hover:text-white hover:bg-white/15 disabled:opacity-0 disabled:pointer-events-none transition-all shadow-md z-10 cursor-pointer ${
            activePageIndex > 0 ? 'hover:scale-110 active:scale-95' : ''
          }`}
          title={language === 'es' ? 'Anterior' : 'Previous'}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5 space-y-4 shadow-2xl backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="rounded-lg bg-lime-500/10 px-2.5 py-1 text-xs font-bold font-mono text-lime-400 border border-lime-500/20">
                #{activePrompt.number}
              </span>
              <h3 className="font-display font-bold text-slate-200 text-sm tracking-wide truncate max-w-[280px]">
                {activePrompt.title}
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDelete}
                title={t.pagesMode.deletePrompt}
                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-rose-500/10 hover:text-rose-400 cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={handleCopy}
                title={language === 'es' ? 'Copiar prompt' : 'Copy prompt text'}
                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-white/5 hover:text-white cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-lime-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="relative bg-[#050507]/40 backdrop-blur-md rounded-xl border border-white/5 p-4 min-h-[120px] max-h-[220px] overflow-y-auto shadow-inner">
            <pre className="text-xs text-slate-300 font-mono whitespace-pre-wrap break-all leading-relaxed font-medium">
              {activePrompt.content}
            </pre>
          </div>
        </div>

        <button
          onClick={handleNextPage}
          disabled={activePageIndex === prompts.length - 1}
          className={`absolute -right-12 top-1/2 -translate-y-1/2 flex items-center justify-center w-9 h-9 rounded-full border border-white/10 bg-white/5 text-slate-300 hover:text-white hover:bg-white/15 disabled:opacity-0 disabled:pointer-events-none transition-all shadow-md z-10 cursor-pointer ${
            activePageIndex < prompts.length - 1 ? 'hover:scale-110 active:scale-95' : ''
          }`}
          title={language === 'es' ? 'Siguiente' : 'Next'}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="flex justify-center text-xs font-mono text-slate-500 tracking-wider">
        {activePageIndex + 1} / {prompts.length}
      </div>

      <VoteBar
        promptId={activePrompt.id}
        mode="pages"
        isSelected={selectedPagesPromptId === activePrompt.id}
        onSelect={handleSelectToggle}
      />
    </div>
  );
}
