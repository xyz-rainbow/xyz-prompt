/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ChevronLeft, ChevronRight, Copy, Check, Inbox, Trash2, Sparkles, User, MessageSquare } from 'lucide-react';
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
  const chatMessages = useStore((state) => state.chatMessages);
  const chatLoading = useStore((state) => state.chatLoading);
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
  const pageMessages = chatMessages.filter((m) => m.promptId === activePrompt.id);
  const latestAssistant = [...pageMessages].reverse().find((m) => m.role === 'assistant');
  const hasOutput = pageMessages.length > 0;
  const awaitingResponse =
    chatLoading &&
    pageMessages.length > 0 &&
    pageMessages[pageMessages.length - 1]?.role === 'user';

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
    const text = latestAssistant?.content ?? '';
    if (!text) return;
    navigator.clipboard.writeText(text);
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
    if (!confirm(t.pagesMode.deletePromptConfirm)) return;
    await deletePrompt(activePrompt.id);
  };

  return (
    <div className="relative mx-auto w-full max-w-2xl space-y-6 py-2 animate-fade-in">
      <div className="relative group">
        <button
          type="button"
          onClick={handlePrevPage}
          disabled={activePageIndex === 0}
          className={`absolute -left-12 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-300 shadow-md transition-all hover:bg-white/15 hover:text-white disabled:pointer-events-none disabled:opacity-0 ${
            activePageIndex > 0 ? 'hover:scale-110 active:scale-95' : ''
          }`}
          title={language === 'es' ? 'Anterior' : 'Previous'}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <div className="space-y-4 rounded-xl border border-white/10 bg-white/[0.03] p-5 shadow-2xl backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="rounded-lg border border-lime-500/20 bg-lime-500/10 px-2.5 py-1 text-xs font-bold font-mono text-lime-400">
                #{activePrompt.number}
              </span>
              <h3 className="truncate font-display text-sm font-bold tracking-wide text-slate-200">
                {activePrompt.title}
              </h3>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => void handleDelete()}
                title={t.pagesMode.deletePrompt}
                className="cursor-pointer rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-rose-500/10 hover:text-rose-400"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
              {latestAssistant && (
                <button
                  type="button"
                  onClick={handleCopy}
                  title={t.pagesMode.copyResponse}
                  className="cursor-pointer rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-lime-400" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              )}
            </div>
          </div>

          <div className="relative min-h-[160px] max-h-[min(360px,45vh)] overflow-y-auto rounded-xl border border-white/5 bg-[#050507]/40 p-4 shadow-inner custom-scrollbar">
            {!hasOutput && !awaitingResponse && (
              <div className="flex h-full min-h-[140px] flex-col items-center justify-center gap-3 px-4 text-center">
                <MessageSquare className="h-8 w-8 text-slate-600" />
                <p className="max-w-sm text-xs leading-relaxed text-slate-500">{t.pagesMode.readyToTest}</p>
              </div>
            )}

            {hasOutput && (
              <div className="space-y-3">
                {pageMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-2.5 rounded-lg border p-3 text-xs leading-relaxed ${
                      msg.role === 'user'
                        ? 'border-lime-500/15 bg-lime-500/5 text-slate-300'
                        : 'border-purple-500/20 bg-purple-500/5 text-slate-200'
                    }`}
                  >
                    <span className="mt-0.5 shrink-0">
                      {msg.role === 'user' ? (
                        <User className="h-3.5 w-3.5 text-lime-400" />
                      ) : (
                        <Sparkles className="h-3.5 w-3.5 text-purple-400" />
                      )}
                    </span>
                    <pre className="flex-1 whitespace-pre-wrap break-words font-sans">{msg.content}</pre>
                  </div>
                ))}
              </div>
            )}

            {awaitingResponse && (
              <div className="mt-3 flex items-center gap-2 rounded-lg border border-purple-500/20 bg-purple-500/5 p-3 text-xs text-purple-300 animate-pulse">
                <Sparkles className="h-3.5 w-3.5 animate-spin" />
                <span>{t.chat.thinking}</span>
              </div>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={handleNextPage}
          disabled={activePageIndex === prompts.length - 1}
          className={`absolute -right-12 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-300 shadow-md transition-all hover:bg-white/15 hover:text-white disabled:pointer-events-none disabled:opacity-0 ${
            activePageIndex < prompts.length - 1 ? 'hover:scale-110 active:scale-95' : ''
          }`}
          title={language === 'es' ? 'Siguiente' : 'Next'}
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="flex justify-center text-xs font-mono tracking-wider text-slate-500">
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
